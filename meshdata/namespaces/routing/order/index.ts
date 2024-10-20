import { MeshOS, Types } from '@hotmeshio/hotmesh';

import { unixTimestamp, dateTimestamp, safeData } from '../../../../modules/utils';

import { schema as RoutingOrderSchema } from './schema';

/**
 * The 'order' entity, representing a single mail piece.
 */
class Order extends MeshOS {

  getTaskQueue(): string {
    return 'v1';
  }

  getEntity(): string {
    return 'order';
  }

  getSearchOptions(): Types.WorkflowSearchOptions {
    return {
      index: `${this.getNamespace()}-${this.getEntity()}`,
      prefix: [this.getEntity()],
      schema: RoutingOrderSchema,
    };
  }

  async add(order: Types.StringAnyType) {
    const data = safeData({
      account_id: order.account_id,
      billing_group_id: order.billing_group_id,
      buckslip_id: order.buckslips?.[0]?.id,
      campaign_id: order.campaign_id,
      card_id: order.cards?.[0]?.id,
      custom_envelope_id: order.custom_envelope_id,
      date_created: unixTimestamp(order.date_created),
      date_modified: unixTimestamp(order.date_modified),
      expected_delivery_date: dateTimestamp(order.expected_delivery_date),
      extra_service: order.extra_service,
      id: order.id,
      mail_type: order.mail_type,
      mode: order.mode,
      object_type: order.object_type,
      pages: order.pages,
      partner_id: order.partner_id,
      product_id: order.product_id,
      return_envelope_id: order.return_envelope_id,
      send_date: dateTimestamp(order.send_date),
      target_delivery_date: dateTimestamp(order.target_delivery_date),
      size: order.size,
      status: order.status,
      use_type: order.use_type,
      vendor: order.vendor,
      'to/name': order.to?.name,
      'to/company': order.to?.company,
      'to/line1': order.to?.address_line1,
      'to/line2': order.to?.address_line2,
      'to/city': order.to?.address_city,
      'to/state': order.to?.address_state,
      'to/zip': order.to?.address_zip,
      'to/country': order.to?.address_country,
    });

    await this.meshData.exec({
      entity: this.getEntity(),
      args: [],
      options: {
        id: order.id,
        search: { data },
        namespace: this.getNamespace(),
        taskQueue: this.getTaskQueue(),
        ttl: '100 years',
      },
    });

    return await this.retrieve(order.id);
  }
}

export { Order };
