import { MeshData } from "@hotmeshio/hotmesh";

/**
 * Bill the user for a plan. NOTE: This is a recurring billing process
 * that will continue until the user cancels the plan. As this is
 * a 'hook' function, it targets state in the bound user entity.
 * All read/write actions are transactional and durable and are persisted
 * on the user entity.
 */
export const bill = async(planId: string, plan: string, cycle: string) => {
  //persist the indexed, searchable billing plan details
  const userId = MeshData.workflow.getContext().workflowId;
  const search = await MeshData.workflow.search();
  await search.set('userId', userId, 'planId', planId, 'plan', plan, 'cycle', cycle, 'version', 'v1');
  let currentPlanId = await search.get('planId');
  let isActive = currentPlanId === planId;

  //send a recurring bill
  do {
    const timestamp = Date.now();
    await MeshData.workflow.execChild<number>({
      entity: 'bill',
      args: [{ userId, planId, plan, cycle, timestamp }],
      taskQueue: 'v1',
      signalIn: false,
    });

    //note: cycles are hourly/daily for demo purposes
    const duration = cycle === 'monthly' ? '1 hour' : '1 day';
    await MeshData.workflow.sleepFor(duration);
  } while (isActive);
};
