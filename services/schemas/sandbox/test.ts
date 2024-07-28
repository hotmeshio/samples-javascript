import { Types } from '@hotmeshio/hotmesh';

export const schema: Types.WorkflowSearchSchema = {
    $entity: { type: 'TAG', indexed: false, primitive: 'string', required: true },
    id: { type: 'TAG', primitive: 'string', required: true },
    type: { type: 'TAG', sortable: true, primitive: 'string', required: true, examples: ['ok', 'error', 'random'] },
    timestamp: { type: 'NUMERIC', sortable: true, primitive: 'number', required: true, examples: ['1612345678'] },
    width: { type: 'NUMERIC', sortable: true, primitive: 'number', required: true, examples: ['1', '2', '3'] },
    depth: { type: 'NUMERIC', sortable: true, primitive: 'number', required: true, examples: ['1', '2', '3'] },
    count: { type: 'NUMERIC', sortable: true, primitive: 'number', required: false, examples: ['1', '2', '3'] },
    duration: { type: 'NUMERIC', sortable: true, primitive: 'number', required: false, examples: ['1', '2', '3'] }, //milliseconds
    randomId: { type: 'NUMERIC', primitive: 'string', required: false, examples: ['randomId'], indexed: false }
};
