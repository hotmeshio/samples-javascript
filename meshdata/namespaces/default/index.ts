import { Types } from '@hotmeshio/hotmesh';

import { BaseEntity } from '../base';
import { schema as DefaultSchema } from './schema';

/**
 * catch-all entity type that allows for generic hotmesh workflows
 * to be surfaced in the dashboard (as the dashboard is entity-focused)
 */
class DefaultEntity extends BaseEntity {

  async connect() {
    console.log('default entity connected!');
    //no-op; default entity doesn't have workers in the dashboard
  }

  async add(..._: any[]): Promise<Types.StringAnyType> {
    return {  };
  }

  getTaskQueue(): string {
    return 'v1';
  }

  getEntity(): string {
    return 'default';
  }

  getSearchOptions(): Types.WorkflowSearchOptions {
    return {
      index: `${this.getNamespace()}-${this.getEntity()}`,
      prefix: [this.getEntity()],
      schema: DefaultSchema,
    };
  }
}

export { DefaultEntity };
