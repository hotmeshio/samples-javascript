import { MeshData } from '@hotmeshio/hotmesh';

type TestArgs = {
  id: string;
  type: ('ok' | 'error' | 'random' | 'batch');
  timestamp: number;
  width: number;
  depth: number;
  wait: boolean;
  memo?: string;
};

/**
 * Seeds a recursive test workflow that grows exponentially with each generation.
 * @param param0
 * @param param0.id - the test id in the format `tst${timestamp}`
 * @param param0.type - the test type: ('ok', 'error', 'random')
 * @param param0.timestamp - the timestamp as a time value in ms
 * @param param0.width - the number of child workflows to start/exec each time
 * @param param0.depth - the depth
 * @param param0.wait - whether to wait for child workflows to complete before returning
 * @param param0.memo - string field for additional data
 */
const startTest = async ({ id, type, timestamp, width, depth, wait, memo = '' }: TestArgs): Promise<number> => {
  //add some data to the workflow record
  const search = await MeshData.workflow.search();
  await search.set(
    '$entity', 'test',
    'id', id,
    'type', type,
    'timestamp', timestamp.toString(),
    'width', width.toString(),
    'depth', depth.toString(),
    'count', ((Math.pow(width, depth) - 1) / (depth - 1)).toString(),
    'memo', memo.toString(),
  );

  if (depth > 1) {
    //test count grows exponentially with each generation
    const childWorkflows: Promise<number>[] = [];
    for (let i = 0; i < width; i++) {
      childWorkflows.push(
        MeshData.workflow.execChild<number>({
          args: [{ id, type, timestamp, width, depth: depth - 1, wait, memo } as TestArgs],
          taskQueue: 'v1',
          workflowName: 'test',
      }));
    }

    //test collation; all child workflows must now complete
    await Promise.all(childWorkflows);
  }

  //set the duration in ms and return
  const duration = Date.now() - timestamp;
  const durationSearch = await MeshData.workflow.search();
  await durationSearch.incr('duration', duration);
  return duration;
}

export { startTest };
