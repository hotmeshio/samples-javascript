import { MeshData } from "@hotmeshio/hotmesh";

export const create = async(id: string): Promise<string> =>{
  return id;
};

export const bill = async(planId: string, plan: string, cycle: string) => {
  //persist the billing plan details
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
    });

    //reduce to shorter cycles to test load on server
    const duration = cycle === 'monthly' ? '1 hour' : '1 day';
    await MeshData.workflow.sleepFor(duration);
  } while (isActive);
};
