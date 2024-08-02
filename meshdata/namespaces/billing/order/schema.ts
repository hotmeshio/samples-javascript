import { Types } from '@hotmeshio/hotmesh';

export const schema: Types.WorkflowSearchSchema = {
  $entity: {
    type: 'TAG',
    indexed: false,
    primitive: 'string',
    required: true,
  },
  account_id: {
    type: 'TAG',
    sortable: true,
  },
  billing_group_id: {
    type: 'TAG',
    sortable: false,
  },
  booklet: {
    type: 'TAG',
  },
  campaign_id: {
    type: 'TAG',
    sortable: false,
  },
  bleed: {
    type: 'TAG',
    sortable: true,
  },
  card_id: {
    type: 'TEXT',
    indexed: false,
  },
  color: {
    type: 'TAG',
    sortable: true,
  },
  custom_envelope_id: {
    type: 'TAG',
    sortable: true,
  },
  date_created: {
    type: 'TAG',
    indexed: false,
  },
  date_modified: {
    type: 'TAG',
    indexed: false,
  },
  double_sided: {
    type: 'TAG',
    sortable: true,
  },
  id: {
    type: 'TAG',
    sortable: true,
  },
  object: {
    type: 'TAG',
    sortable: true,
  },
  pages: {
    type: 'NUMERIC',
    sortable: true,
  },
  partner_id: {
    type: 'TAG',
    sortable: true,
  },
  perforated_page: {
    type: 'TAG',
    indexed: false,
  },
  perforation_placement: {
    type: 'TAG',
    sortable: true,
  },
  product_id: {
    type: 'TAG',
    sortable: false,
  },
  mail_type: {
    type: 'TAG',
    sortable: true,
  },
  return_envelope_id: {
    type: 'TAG',
    sortable: false,
  },
  send_date: {
    type: 'TAG',
    sortable: true,
  },
  target_delivery_date: {
    type: 'TAG',
    sortable: true,
  },
  size: {
    type: 'TAG',
    sortable: true,
  },
  sla: {
    type: 'TAG',
    sortable: true,
  },
  use_type: {
    type: 'TAG',
    indexed: false,
    primitive: 'string',
    examples: ['marketing', 'operational'],
  },
  'to/name': {
    type: 'TEXT',
    indexed: false,
    primitive: 'string',
    required: true,
  },
  'to/company': {
    type: 'TEXT',
    indexed: false,
    primitive: 'string',
  },
  'to/address_line1': {
    type: 'TEXT',
    indexed: false,
    primitive: 'string',
    required: true,
  },
  'to/address_line2': {
    type: 'TEXT',
    indexed: false,
    primitive: 'string',
  },
  'to/address_city': {
    type: 'TEXT',
    indexed: false,
    primitive: 'string',
    required: true,
  },
  'to/address_state': {
    type: 'TEXT',
    indexed: false,
    primitive: 'string',
    required: true,
  },
  'to/address_zip': {
    type: 'TEXT',
    indexed: false,
    primitive: 'string',
    required: true,
  },
  'from/name': {
    type: 'TEXT',
    indexed: false,
    primitive: 'string',
  },
  'from/company': {
    type: 'TEXT',
    indexed: false,
    primitive: 'string',
  },
  'from/address_line1': {
    type: 'TEXT',
    indexed: false,
    primitive: 'string',
  },
  'from/address_line2': {
    type: 'TEXT',
    indexed: false,
    primitive: 'string',
  },
  'from/address_city': {
    type: 'TEXT',
    indexed: false,
    primitive: 'string',
  },
  'from/address_state': {
    type: 'TEXT',
    indexed: false,
    primitive: 'string',
  },
  'from/address_zip': {
    type: 'TEXT',
    indexed: false,
    primitive: 'string',
  },
};
