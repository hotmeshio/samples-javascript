import { MeshData, Types } from '@hotmeshio/hotmesh';
import config from '../../../../config';
import { BaseEntity } from '../../base';
import { BillSchema } from '../../../schemas';

const doSendBill = async (...args: any[]) => {
  //send the bill
}

/**
 * The 'Bill' entity. Shows how Redis-backed governance is able to
 * create durable, transactional workflows using a reentrant
 * process architecture. While the main function stays open and
 * is actively part of the operational data layer (ODL), hook functions
 * can be interleaved that transactionally update primary state.
 * 
 */
class Bill extends BaseEntity {

  getTaskQueue(): string {
    return 'v1';
  }

  static getEntity(): string {
    return 'bill';
  }

  getEntity(): string {
    return Bill.getEntity();
  }

  getSearchOptions(): Types.WorkflowSearchOptions {
    return {
      index: `${this.getNamespace()}-${Bill.getEntity()}`,
      prefix: [Bill.getEntity()],
      schema: BillSchema,
    };
  }

  async connect() {
    //use two workers per container
    for (let i = 0; i < config.BILL_WORKER_COUNT; i++) {
      await this.meshData.connect({
        entity: Bill.getEntity(),
        target: this.workflow.create,
        options: {
          namespace: this.getNamespace(),
          taskQueue: this.getTaskQueue(),
        },
      });
    }
  }

  //*************** WORKFLOW-ORIENTED METHODS (DATA IN MOTION) *************

  workflow = {

    //create/send a bill
    async create({ userId, planId, plan, cycle, timestamp }): Promise<number> {
      //persist the billing plan details (searchable/indexed)
      const search = await MeshData.workflow.search();
      await search.set(
        '$entity', Bill.getEntity(),
        'userId', userId,
        'planId', planId,
        'plan', plan,
        'cycle', cycle,
        'timestamp', timestamp
      );
      //send the bill (once/idempotent)
      MeshData.workflow.once(doSendBill, userId, planId, plan, cycle, timestamp);
      return timestamp;
    },

    async reconcile() {
      //when users switch plans, reconcile the most-recent bill
    }
  }
}

export { Bill, MeshData };
