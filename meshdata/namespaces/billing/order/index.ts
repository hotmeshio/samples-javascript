import { Types } from '@hotmeshio/hotmesh';

import { BaseEntity } from '../../base';

import { schema as BillingOrderSchema } from './schema';
import { safeData } from '../../../../modules/utils';

class Order extends BaseEntity {

  getTaskQueue(): string {
    return 'v2';
  }

  getEntity(): string {
    return 'order';
  }

  getSearchOptions(): Types.WorkflowSearchOptions {
    return {
      index: `${this.getNamespace()}-${this.getEntity()}`,
      prefix: [this.getEntity()],
      schema: BillingOrderSchema,
    };
  }

  /**
   * Caches a single /v1 order in Redis.
   * @param order
   */
  async create(order: Types.StringAnyType) {
    const data = safeData({
      id: order.id,
      account_id: order.account_id,
      billing_group_id: order.billing_group_id,
      bleed: order.bleed,
      booklet: order.booklet,
      buckslip_id: (order.buckslips as Array<{ id: string }> | null)?.[0]?.id,
      card_id: (order.cards as Array<{ id: string }> | null)?.[0]?.id,
      color: order.color,
      custom_envelope_id: (order.custom_envelope as { id: string } | null)?.id,
      date_created: order.date_created,
      date_modified: order.date_modified,
      double_sided: order.double_sided,
      mail_type: order.mail_type,
      pages: order.pages,
      perforated_page: order.perforated_page,
      perforation_placement: order.perforation_placement,
      product_id: order.product_id,
      return_envelope_id: (order.return_envelope as { id: string } | null)?.id,
      send_date: order.send_date,
      sla: order.sla,
      size: order.size,
      target_delivery_date: order.target_delivery_date,
      use_type: order.use_type,
      object: order.object,
      'to/name': order.to?.name,
      'to/company': order.to?.company,
      'to/address_line1': order.to?.address_line1,
      'to/address_line2': order.to?.address_line2,
      'to/address_city': order.to?.address_city,
      'to/address_state': order.to?.address_state,
      'to/address_zip': order.to?.address_zip,
      'from/name': order.from?.name,
      'from/company': order.from?.company,
      'from/address_line1': order?.from?.address_line1,
      'from/address_line2': order?.from?.address_line2,
      'from/address_city': order?.from?.address_city,
      'from/address_state': order?.from?.address_state,
      'from/address_zip': order?.from?.address_zip,
    });

    //add the order to the cache; seed with data
    await this.meshData.exec({
      entity: this.getEntity(),
      args: [order.id],
      options: {
        id: order.id,
        search: { data },
        namespace: this.getNamespace(),
        taskQueue: this.getTaskQueue(),
        ttl: '100 years',
      },
    });

    return this.retrieve(order.id);
  }
}

export { Order };
