import { Types } from '@hotmeshio/hotmesh';

enum MailType {
  USPS_STANDARD = 'usps_standard',
  USPS_FIRST_CLASS = 'usps_first_class',
  EUROPEAN_CARRIER = 'european_carrier',
}

enum Mode {
  TEST = 'test',
  LIVE = 'live',
  PARTNER_TEST = 'partner_test',
}

enum InventoryStatus {
  CREATED = 'created',
  PENDING = 'pending',
  APPROVED = 'approved',
}

export const schema : Types.WorkflowSearchSchema = {
  $entity: {
    type: 'TAG',
    indexed: false,
    primitive: 'string',
    required: true,
  },
  account_id: {
    type: 'TAG',
    sortable: false,
  },
  auto_reorder: {
    type: 'TAG',
    sortable: false,
  },
  available_quantity: {
    type: 'NUMERIC',
    sortable: false,
  },
  back_creative_id: {
    type: 'TAG',
    sortable: false,
    indexed: false,
  },
  billing_group_id: {
    type: 'TAG',
    sortable: false,
    indexed: false,
  },
  component_back_id: {
    type: 'TAG',
    sortable: false,
    indexed: false,
  },
  component_front_id: {
    type: 'TAG',
    sortable: false,
    indexed: false,
  },
  component_type: {
    type: 'TAG',
    sortable: true,
  },
  date_created: {
    type: 'NUMERIC',
    sortable: true,
  },
  date_modified: {
    type: 'NUMERIC',
    sortable: true,
  },
  description: {
    type: 'TEXT',
    sortable: false,
  },
  design: {
    type: 'TAG',
    sortable: true,
  },
  front_creative_id: {
    type: 'TAG',
    sortable: false,
    indexed: false,
  },
  id: {
    type: 'TAG',
    sortable: false,
  },
  is_dashboard: {
    type: 'TAG',
    sortable: false,
  },
  mail_type: {
    type: 'TAG',
    sortable: true,
    examples: ['usps_first_class', 'usps_standard'],
    enum: Object.values(MailType),
  },
  mode: {
    type: 'TAG',
    sortable: true,
    enum: Object.values(Mode),
  },
  object: {
    type: 'TAG',
    sortable: false,
  },
  pending_quantity: {
    type: 'NUMERIC',
    sortable: false,
  },
  projected_quantity: {
    type: 'NUMERIC',
    sortable: false,
  },
  remaining_quantity: {
    type: 'NUMERIC',
    sortable: false,
  },
  reorder_quantity: {
    type: 'NUMERIC',
    sortable: false,
  },
  reserved_quantity: {
    type: 'NUMERIC',
    sortable: false,
  },
  threshold_amount: {
    type: 'NUMERIC',
    sortable: false,
  },
  size: {
    type: 'TAG',
    sortable: true,
  },
  status: {
    type: 'TAG',
    sortable: true,
    enum: Object.values(InventoryStatus),
  },
};
