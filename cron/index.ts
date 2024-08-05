import 'dotenv/config';
import { MeshCall } from '@hotmeshio/hotmesh';
import { getRedisConfig } from '../meshdata/config';
import { getTraceUrl } from '../modules/tracer';

/**
 * Start an idempotent cron job
 */
export const startMyCron = async (
  id: string,
  topic: string,
  callback: (...args: any[]) => Promise<any> | null,
  args: any[] = [],
) => {

  //START the cron
  const success = await MeshCall.cron({
    namespace: 'meshcall',
    args,
    topic,
    callback,
    redis: getRedisConfig(),
    options: { id, interval: '5 seconds', maxCycles: 10 },
  });

  //Log the telemetry trace URL
  console.log('new cron started >', success);
  const hotMesh = await MeshCall.getInstance('meshcall', getRedisConfig());
  const jobState = await hotMesh.getState('meshcall.cron', id);
  console.log('\n\nTELEMETRY', getTraceUrl(jobState.metadata.trc), '\n');
};

/**
 * Stop a cron; returns false if cron was not actively running
 */
export const stopMyCron = async (id: string, topic: string) => {
  //INTERRUPT the cron
  const success = await MeshCall.interrupt( {
    namespace: 'meshcall',
    topic,
    redis: getRedisConfig(),
    options: { id },
  });
  console.log('cron was stopped!', success);
};