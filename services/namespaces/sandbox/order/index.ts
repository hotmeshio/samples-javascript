import { Types } from '@hotmeshio/hotmesh';
import { BaseEntity } from '../../base';

import { unixTimestamp, dateTimestamp } from '../../../utils/datetime';
import { SandboxOrderSchema } from '../../../schemas';
import { OrderSymbols as SYM } from '../../../symbols/sandbox/order';

/**
 * The 'order' entity, representing a single mail piece.
 */
class Order extends BaseEntity {

  protected getTaskQueue(): string {
    return 'v1';
  }

  getEntity(): string {
    return 'order';
  }

  getSearchOptions(): Types.WorkflowSearchOptions {
    return {
      index: `${this.getNamespace()}-${this.getEntity()}`,
      prefix: [this.getEntity()],
      schema: SandboxOrderSchema,
    };
  }

  async add(order: Types.StringAnyType, waitForResponse = true) {
    const data = this.safeData({
      [SYM.account_id]: order.account_id,
      [SYM.billing_group_id]: order.billing_group_id,
      [SYM.buckslip_id]: order.buckslips?.[0]?.id,
      [SYM.campaign_id]: order.campaign_id,
      [SYM.card_id]: order.cards?.[0]?.id,
      [SYM.custom_envelope_id]: order.custom_envelope?.id,
      [SYM.date_created]: unixTimestamp(order.date_created),
      [SYM.date_modified]: unixTimestamp(order.date_modified),
      [SYM.expected_delivery_date]: dateTimestamp(order.expected_delivery_date),
      [SYM.extra_service]: order.extra_service,
      [SYM.id]: order.id,
      [SYM.mail_type]: order.mail_type,
      [SYM.mode]: order.mode,
      [SYM.object_type]: order.object_type,
      [SYM.pages]: order.pages,
      [SYM.partner_id]: order.partner_id,
      [SYM.product_id]: order.product_id,
      [SYM.return_envelope_id]: order.return_envelope?.id,
      [SYM.send_date]: dateTimestamp(order.send_date),
      [SYM.target_delivery_date]: dateTimestamp(order.target_delivery_date),
      [SYM.size]: order.size,
      [SYM.status]: order.status,
      [SYM.use_type]: order.use_type,
      [SYM.vendor]: order.vendor,
      [SYM['to/name']]: order.to?.name,
      [SYM['to/company']]: order.to?.company,
      [SYM['to/line1']]: order.to?.address_line1,
      [SYM['to/line2']]: order.to?.address_line2,
      [SYM['to/city']]: order.to?.address_city,
      [SYM['to/state']]: order.to?.address_state,
      [SYM['to/zip']]: order.to?.address_zip,
      [SYM['to/country']]: order.to?.address_country,
    });

    await this.meshData.exec({
      entity: this.getEntity(),
      args: [],
      options: {
        id: order.id,
        search: { data },
        await: waitForResponse,
        namespace: this.getNamespace(),
        taskQueue: this.getTaskQueue(),
        pending: process.env.EXPIRE_SECONDS ? Number(process.env.EXPIRE_SECONDS) : 1800, // 30 minutes until scrubbing (rename to 'pending')
      },
    });

    return waitForResponse ? await this.retrieve(order.id) : { id: order.id };
  }

  /**
    * Retrieve entity by id
    * @param id
    * @returns
    * @throws
    */
  async retrieve(id: string, sparse = false) {
    const opts = this.getSearchOptions();
    const fields = sparse ? ['id'] : Object.keys(opts?.schema ?? {});

    const result = await this.meshData.get(this.getEntity(), id, { fields, namespace: this.getNamespace() });
    if (!result?.i1) throw new Error(`${this.getEntity()} not found`);
    return this.transformKeys(result, SYM);
  }
}

export { Order };
