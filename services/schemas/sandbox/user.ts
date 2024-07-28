import { Types } from '@hotmeshio/hotmesh';

export const schema: Types.WorkflowSearchSchema = {
    $entity: { type: 'TAG', sortable: true, primitive: 'string', required: true, indexed: false },
    id: { type: 'TAG', sortable: true, primitive: 'string', required: true },
    first: { type: 'TEXT', sortable: true, primitive: 'string', required: true },
    last: { type: 'TEXT', sortable: true, primitive: 'string', required: true },
    email: { type: 'TAG', sortable: true, primitive: 'string', required: true },
    active: { type: 'TAG', sortable: true, primitive: 'boolean', required: true, examples: ['true', 'false'] },
    plan: { type: 'TAG', sortable: true, primitive: 'string', required: true, examples: ['starter', 'pro', 'enterprise'] },
    cycle: { type: 'TAG', sortable: true, primitive: 'string', required: true, examples: ['monthly', 'yearly'] }
};
