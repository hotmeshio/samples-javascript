import 'dotenv/config';
import { MeshCall } from '@hotmeshio/hotmesh';
import { getRedisConfig } from '../meshdata/config';

/**
 * Start an idempotent cron job
 */
export const startMyCron = async (
  id: string,
  topic: string,
  callback: (...args: any[]) => Promise<any> | null,
  args: any[] = [],
) => {
  const success = await MeshCall.cron( {
    namespace: 'meshcall',
    args,
    topic,
    callback,
    redis: getRedisConfig(),
    options: { id, interval: '5 seconds', maxCycles: 10 },
  });
  console.log('cron was started!', success);
};

/**
 * Stop a cron; returns false if cron was not actively running
 */
export const stopMyCron = async (id: string, topic: string) => {
  const success = await MeshCall.interrupt( {
    namespace: 'meshcall',
    topic,
    redis: getRedisConfig(),
    options: { id },
  });
  console.log('cron was stopped!', success);
};