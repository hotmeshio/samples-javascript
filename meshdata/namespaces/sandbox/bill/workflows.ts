import { MeshData } from "@hotmeshio/hotmesh";
import * as activities from './activities';

/**
 * Proxy idempotent activities for retry and backoff.
 */
const { doSendBill } = MeshData.proxyActivities<typeof activities>({
  activities,
  retryPolicy: {
    backoffCoefficient: 2,
    maximumInterval: '1 minute',
    maximumAttempts: 10,
  }
});

/**
 * Create a bill.
 */
export const create = async ({ userId, planId, plan, cycle, timestamp }): Promise<number> => {
  const search = await MeshData.workflow.search();
  await search.set(
    '$entity', 'bill',
    'userId', userId,
    'planId', planId,
    'plan', plan,
    'cycle', cycle,
    'timestamp', timestamp
  );

  //send the bill via a proxy activity (the call is idempotent)
  await doSendBill(userId, planId, plan, cycle, timestamp);
  return timestamp;
};
