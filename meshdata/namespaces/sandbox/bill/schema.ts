import { Types } from '@hotmeshio/hotmesh';

export const schema: Types.WorkflowSearchSchema = {
  $entity: {
    type: 'TAG',
    indexed: false,
    primitive: 'string',
    required: true
  },
  userId: {
    type: 'TAG',
    sortable: true,
    primitive: 'string',
    required: true,
    examples: ['user-jan.doe.1']
  },
  planId: {
    type: 'TAG',
    sortable: true,
    primitive: 'string',
    required: true,
    examples: ['567887654567']
  },
  plan: {
    type: 'TAG',
    sortable: true,
    primitive: 'string',
    required: true,
    examples: ['enterprise', 'pro']
  },
  cycle: {
    type: 'TAG',
    sortable: true,
    primitive: 'string',
    required: true,
    examples: ['monthly', 'yearly']
  },
  timestamp: {
    type: 'NUMERIC',
    sortable: true,
    primitive: 'number',
    required: true,
    examples: ['1612345678']
  }
};
