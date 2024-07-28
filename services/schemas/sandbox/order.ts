import { Types } from '@hotmeshio/hotmesh';
import { OrderSymbols as SYM } from '../../symbols/sandbox/order';

export const schema: Types.WorkflowSearchSchema = {
  [SYM.account_id]: {
    type: 'TAG',
    sortable: true,
  },
  [SYM.billing_group_id]: {
    type: 'TAG',
    sortable: false,
  },
  [SYM.buckslip_id]: {
    type: 'TAG',
    sortable: false,
  },
  [SYM.campaign_id]: {
    type: 'TAG',
    sortable: false,
  },
  [SYM.card_id]: {
    type: 'TAG',
    sortable: true,
  },
  [SYM.custom_envelope_id]: {
    type: 'TAG',
    sortable: true,
  },
  [SYM.id]: {
    type: 'TAG',
    sortable: true,
  },
  [SYM.object_type]: {
    type: 'TAG',
    sortable: false,
  },
  [SYM.pages]: {
    type: 'NUMERIC',
    sortable: false,
  },
  [SYM.partner_id]: {
    type: 'TAG',
    sortable: false,
  },
  [SYM.product_id]: {
    type: 'TAG',
    sortable: false,
  },
  [SYM.return_envelope_id]: {
    type: 'TAG',
    sortable: false,
  },
  [SYM.send_date]: {
    type: 'NUMERIC',
    sortable: true,
  },
  [SYM.target_delivery_date]: {
    type: 'NUMERIC',
    sortable: true,
  },
  [SYM.size]: {
    type: 'TAG',
    sortable: true,
  },
  [SYM.status]: {
    type: 'TAG',
    sortable: true,
  },
  [SYM.use_type]: {
    type: 'TAG',
    sortable: false,
  },
  [SYM['to/name']]: {
    type: 'TEXT',
    nostem: true,
    sortable: false,
  },
  [SYM['to/company']]: {
    type: 'TEXT',
    nostem: true,
    sortable: false,
  },
  [SYM['to/line1']]: {
    type: 'TEXT',
    nostem: true,
    sortable: false,
  },
  [SYM['to/line2']]: {
    type: 'TEXT',
    nostem: true,
    sortable: false,
  },
  [SYM['to/city']]: {
    type: 'TEXT',
    nostem: true,
    sortable: false,
  },
  [SYM['to/state']]: {
    type: 'TAG',
    sortable: false,
  },
  [SYM['to/zip']]: {
    type: 'TAG',
    sortable: false,
  },
  [SYM['to/country']]: {
    type: 'TAG',
    sortable: false,
  },
};
