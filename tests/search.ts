import { Pluck } from '@hotmeshio/pluck';

type TestType = {
  userId: string;
  planId: string;
  plan: string;
  cycle: string;
  timestamp: string;
  memo: string;
};

const doOnce = async (...args: any[]) => {
  //perform an idempotent operation (the result is persisted)
}

const create = async ({ userId, planId, plan, cycle, timestamp, memo }: TestType): Promise<string> => {
  //persist the billing plan details (test impact of search on DB throughput and size)
  const search = await Pluck.workflow.search();
  await search.set(
    '$entity', 'test',
    'userId', userId.toString(),
    'planId', planId.toString(),
    'plan', plan.toString(),
    'cycle', cycle.toString(),
    'timestamp', timestamp.toString(),
    'memo', memo,
  );

  //call a function (it will be called once and only once)
  //NOTE: this test can be modified to call `proxyActivities` instead
  Pluck.workflow.once(doOnce, userId, planId, plan, cycle, timestamp);
  return timestamp;
};

export { create };
