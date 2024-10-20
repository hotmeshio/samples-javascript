import { MeshOS, Types } from '@hotmeshio/hotmesh';

import { schema as BillSchema } from './schema';
import * as workflows from './workflows';

/**
 * The 'Bill' entity. Shows how Redis-backed governance is able to
 * create durable, transactional workflows using a reentrant
 * process architecture. While the main function stays open and
 * is actively part of the operational data layer (ODL), hook functions
 * can be interleaved that transactionally update primary state.
 * 
 */
class Bill extends MeshOS {

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
    await this.meshData.connect({
      entity: Bill.getEntity(),
      target: workflows.create,
      options: {
        namespace: this.getNamespace(),
        taskQueue: this.getTaskQueue(),
      },
    });
  }
}

export { Bill };
