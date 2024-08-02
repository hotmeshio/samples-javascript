import { MeshData } from "@hotmeshio/hotmesh";
import { testCount } from "../../../../modules/utils";
import { TestArgs } from "../../../../types/test";

/**
 * Recursive workflow test runner. Tests execChild (composition)
 * and full-text search and collation (Promise.all)
 */
export const startTest = async({ id, type, timestamp, width, depth, wait, memo = '', database }: TestArgs): Promise<number> => {
  //set indexed, searchable data
  const search = await MeshData.workflow.search();
  await search.set(
    '$entity', 'test',
    'id', id,
    'type', type,
    'timestamp', timestamp.toString(),
    'width', width.toString(),
    'depth', depth.toString(),
    'count', testCount(width, depth).toString(),
    'memo', memo.toString(),
  );

  if (depth > 1) {
    const childWorkflows: Array<Promise<string | number>> = [];
    for (let i = 0; i < width; i++) {
      childWorkflows.push(MeshData.workflow.execChild<number>({
        args: [{ id, type, timestamp, width, depth: depth - 1, wait, memo } as TestArgs],
        taskQueue: 'v1',
        entity: 'test', //use `workflowName` to disable Full-Text Search
      }));
    }
    await Promise.all(childWorkflows);
  }

  //set the duration in ms and return
  const duration = Date.now() - timestamp;
  const durationSearch = await MeshData.workflow.search();
  await durationSearch.incr('duration', duration);
  return duration;
};
