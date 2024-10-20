import { MeshOS, Types } from '@hotmeshio/hotmesh';

import { dateTimestamp, safeData } from '../../../modules/utils';

import { schema as InventorySchema } from './schema';

class Inventory extends MeshOS {

  getTaskQueue(): string {
    return 'v1';
  }

  getEntity(): string {
    return 'inventory';
  }

  getSearchOptions(): Types.WorkflowSearchOptions {
    return {
      index: `${this.getNamespace()}-${this.getEntity()}`,
      prefix: [this.getEntity()],
      schema: InventorySchema,
    };
  }

  /**
   * Caches a single inventory item
   */
  async add(inventory: Types.StringAnyType) {
    const invt = await this.meshData.get(this.getEntity(), inventory.id, { fields: ['id'], namespace: this.getNamespace() });

    const data = safeData({
      account_id: inventory.account_id,
      auto_reorder: inventory.auto_reorder,
      back_creative_id: inventory.back_creative_id,
      billing_group_id: inventory.billing_group_id,
      component_back_id: inventory.component_back_id,
      component_front_id: inventory.component_front_id,
      component_type: inventory.component_type,
      date_created: dateTimestamp(inventory.date_created),
      date_modified: dateTimestamp(inventory.date_modified),
      description: inventory.description,
      design: inventory.design,
      front_creative_id: inventory.front_creative_id,
      id: inventory.id,
      mail_type: inventory.mail_type,
      mode: inventory.mode,
      reorder_quantity: inventory.reorder_quantity,
      reorder_threshold: inventory.reorder_threshold,
      size: inventory.size,
      status: inventory.status,
    });


    if (!invt?.id) {
      await this.meshData.exec({
        entity: this.getEntity(),
        args: [inventory.id],
        options: {
          id: inventory.id,
          search: { data },
          namespace: this.getNamespace(),
          taskQueue: this.getTaskQueue(),
          ttl: '100 years',
        },
      });
      return await this.retrieve(inventory.id);
    } else {
        throw new Error('inventory item already exists');
    }
  }
}

export { Inventory };
