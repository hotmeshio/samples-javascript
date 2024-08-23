import { Types } from "@hotmeshio/hotmesh";

export const schema : Types.WorkflowSearchSchema = {
  $entity: {
    type: 'TAG',
    indexed: false,
    primitive: 'string',
    required: true,
  },
  id: {
    type: 'TAG',
    sortable: false,
  },
  plan: {
    type: 'TAG',
    sortable: true,
  },
  active: {
    type: 'TEXT',
    sortable: false,
  },
};
