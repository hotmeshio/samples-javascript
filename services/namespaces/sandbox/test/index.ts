import { MeshData, Types, HotMesh } from '@hotmeshio/hotmesh';

import config from '../../../../config';
import * as activities from './activities';
import { TestArgs, TestInput } from '../../../../types/test';
import { BaseEntity } from '../../base';
import { TestSchema } from '../../../schemas';

//use proxyActivity to wrap (the proxy wrapper provides retry, throttle, etc)
//todo: configure test to use proxyActivities to further test performance/load
const proxiedActivities = MeshData.proxyActivities<typeof activities>({
  activities,
  retryPolicy: {
    backoffCoefficient: 2,
    maximumInterval: '10 seconds',
    maximumAttempts: 10,
  }
});

/**
 * The 'Test' entity.
 * 
 */
class Test extends BaseEntity {

  getTaskQueue(): string {
    return 'v1';
  }

  getEntity(): string {
    return 'test';
  }

  getSearchOptions(): Types.WorkflowSearchOptions {
    return {
      index: `${this.getNamespace()}-${this.getEntity()}`,
      prefix: [this.getEntity()],
      schema: TestSchema,
    };
  }

  async connect(counts: { 'test': number, 'test.transitive': number } = { 'test': config.TEST_WORKER_COUNT, 'test.transitive': 1 }) {
    for (let i = 0; i < counts[this.getEntity()]; i++) {
      await this.swarm('worker');
      await this.swarm('engine');
    }

    for (let i = 0; i < counts[`${this.getEntity()}.transitive`]; i++) {
      await this.meshData.connect({
        entity: `${this.getEntity()}.transitive`,
        target: this.workflow.hookTest,
        options: {
          namespace: this.getNamespace(),
          taskQueue: 'v1',
        },
      });
    }
  }

  async swarm(type: 'worker' | 'engine' = 'engine') {
    if (type === 'worker') {
      await this.meshData.connect({
        entity: this.getEntity(),
        target: this.workflow.startTest,
        options: {
          namespace: this.getNamespace(),
          taskQueue: 'v1',
        },
      });
    } else {
      console.log('Swarming 1 HotMesh engine...');
      const con = await this.meshData.getConnection();
      const hm = await HotMesh.init({
        appId: this.getNamespace(),
        engine: {
          redis: {
            class: con.class,
            options: con.options,
          }
        }
      });
    }
    return { status: 'success', type };
  }

  //********** STANDARD TEST METHODS (CREATE, FIND, ETC) ******************

  /**
   * Start/Create a Test; don't wait; return the test id immediately
   */
  async start({ type, width = 1, depth = 1, memo = '-1', wait = true, database }: TestInput): Promise<{ id: string, expectedCount: number }> {
    const timestamp = Date.now();
    const id = `tst${timestamp}`;

    // max concurrent workflows (Promise length) is set at 25
    // we can increase, but 25 is a good starting point for tests
    if (width > 25) {
      width = 25;
    }

    const expectedCount = Test.testCount(width, depth, type);
    if ((type === 'ok' && expectedCount > config.MAX_FLOWS_PER_TEST) || (type === 'batch' && expectedCount > 1_000_000)) {
      throw new Error(`Final test count exceeds ${config.MAX_FLOWS_PER_TEST}(ok)/1,000,000(batch) workflow max. Reduce width and/or depth.`);
    }

    // Run the Test workflow (it's recursive, and calls itself `width^depth` times)
    this.meshData.exec<string>({
      entity: this.getEntity(),
      args: [{ id, type, timestamp, width, depth, wait, memo, database }],
      options: {
        id,
        ttl: '1 hour',
        namespace: this.getNamespace(),
        taskQueue: 'v1',
        signalIn: false,
      },
    });

    return { id, expectedCount };
  }

  /**
   * Transitive Test
   */
  async transitive(id: string, { randomId }: { randomId: string }) {
    //OPTION 1) direct update; pure redis; fast!
    //await this.retrieve(id); //throws error if not found
    //await this.meshData.set(this.getEntity(), id, { search: { data: { randomId }}});

    //OPTION 2) call the 'test.transitive' transactional hook
    const hookId = await this.meshData.hook({
      entity: this.getEntity(),
      id,
      hookEntity: `${this.getEntity()}.transitive`,
      hookArgs: [randomId],
      options: { namespace: this.getNamespace(), taskQueue: this.getTaskQueue() },
    });

    return { hookId, randomId };
  }

  static testCount(base: number, exponent: number, type?: string): number {
    if (type === 'batch') {
      return base * exponent;
    } else if (base === 1) {
      return exponent;
    }
    return (Math.pow(base, exponent) - 1) / (base - 1);
  }

  //*************** WORKFLOW-ORIENTED METHODS (DATA IN MOTION) *************

  workflow = {

    /**
     * Recursive test workflow. Specify depth and width to recursively call this function.
     * @param param0
     * @param param0.id - the test id in the format `tst${timestamp}`
     * @param param0.type - the test type: ('ok', 'error', 'random')
     * @param param0.timestamp - the timestamp as a time value in ms
     * @param param0.width - the number of child workflows to start/exec each time
     * @param param0.depth - the depth
     * @param param0.wait - whether to wait for child workflows to complete before returning
     */
    async startTest({ id, type, timestamp, width, depth, wait, memo = '', database }: TestArgs): Promise<number> {
      //set some indexed, searchable data
      const search = await MeshData.workflow.search();
      await search.set(
        '$entity', 'test',
        'id', id,
        'type', type,
        'timestamp', timestamp.toString(),
        'width', width.toString(),
        'depth', depth.toString(),
        'count', Test.testCount(width, depth).toString(),
        'memo', memo.toString(),
      );

      if (type === 'batch') {
        //use batch testing for metering proxyActivities
        const proxied: Array<Promise<boolean>> = [];
        for (let i = 0; i < width; i++) {
          const groupId = `${timestamp}X${i}`;
          proxied.push(proxiedActivities.runTest({
            count: depth,
            groupId,
            database,
            namespace: MeshData.workflow.getContext().namespace,
          }));
        }
        await Promise.all(proxied);
      } else if (depth > 1) {
        //'ok' testing with exponential depth and width
        const childWorkflows: Array<Promise<string | number>> = [];
        for (let i = 0; i < width; i++) {
          const startOrExec = wait === false ? 'startChild' : 'execChild';
          childWorkflows.push(MeshData.workflow[startOrExec]({
            args: [{ id, type, timestamp, width, depth: depth - 1, wait, memo } as TestArgs],
            taskQueue: 'v1',
            //use 'workflowName' (not 'entity') to avoid indexing
            workflowName: 'test',
            signalIn: false,
          }));
        }
        await Promise.all(childWorkflows);
      }

      //all done! set the duration in ms and return
      const duration = Date.now() - timestamp;
      const durationSearch = await MeshData.workflow.search();
      await durationSearch.incr('duration', duration);
      return duration;
    },

    async hookTest(randomId: string): Promise<boolean> {
      const search = await MeshData.workflow.search();
      await search.set(
        'randomId', randomId,
      );
      return true;
    },

  }
}

export { Test, MeshData };
