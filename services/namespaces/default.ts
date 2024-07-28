import { StringAnyType } from '@hotmeshio/hotmesh/build/types';
import { BaseEntity } from './base';
import { Types } from '@hotmeshio/hotmesh';
import { schema as DefaultSchema } from '../schemas/default';

/**
 * catch-all entity type that allows for generic hotmesh workflows
 * to be surfaced in the dashboard (as the dashboard is entity-focused)
 */
class DefaultEntity extends BaseEntity {

  async add(..._: any[]): Promise<StringAnyType> {
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
