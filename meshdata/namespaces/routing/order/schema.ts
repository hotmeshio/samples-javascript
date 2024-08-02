import { Types } from '@hotmeshio/hotmesh';

export const schema: Types.WorkflowSearchSchema = {
  account_id: {
    type: 'TAG',
    sortable: true,
  },
  billing_group_id: {
    type: 'TAG',
    sortable: false,
  },
  campaign_id: {
    type: 'TAG',
    sortable: false,
  },
  custom_envelope_id: {
    type: 'TAG',
    sortable: true,
  },
  id: {
    type: 'TAG',
    sortable: true,
  },
  object_type: {
    type: 'TAG',
    sortable: false,
  },
  pages: {
    type: 'NUMERIC',
    sortable: false,
  },
  partner_id: {
    type: 'TAG',
    sortable: false,
  },
  product_id: {
    type: 'TAG',
    sortable: false,
  },
  return_envelope_id: {
    type: 'TAG',
    sortable: false,
  },
  send_date: {
    type: 'NUMERIC',
    sortable: true,
  },
  target_delivery_date: {
    type: 'NUMERIC',
    sortable: true,
  },
  size: {
    type: 'TAG',
    sortable: true,
  },
  status: {
    type: 'TAG',
    sortable: true,
  },
  use_type: {
    type: 'TAG',
    sortable: false,
  },
  'to/name': {
    type: 'TEXT',
    nostem: true,
    sortable: false,
  },
  'to/company': {
    type: 'TEXT',
    nostem: true,
    sortable: false,
  },
  'to/line1': {
    type: 'TEXT',
    nostem: true,
    sortable: false,
  },
  'to/line2': {
    type: 'TEXT',
    nostem: true,
    sortable: false,
  },
  'to/city': {
    type: 'TEXT',
    nostem: true,
    sortable: false,
  },
  'to/state': {
    type: 'TAG',
    sortable: false,
  },
  'to/zip': {
    type: 'TAG',
    sortable: false,
  },
  'to/country': {
    type: 'TAG',
    sortable: false,
  },
};
