//USAGE            `DEMO_DB=valkey npm run demo:ts:meshflow`
//                 `DEMO_DB=dragonfly npm run demo:ts:meshflow`
//                 `npm run demo:ts:meshflow` //default is redis

console.log('initializing meshflow demo ...\n');

import 'dotenv/config';
import { MeshFlow, HotMesh } from '@hotmeshio/hotmesh';
import { getRedisConfig } from '../config';
import * as workflows from './workflows';
import { setupTelemetry } from '../../../telemetry';
setupTelemetry();

(async () => {
  try {
    //1) Initialize the worker; this is typically done in
    //   another file, but is done here for convenience.
    //   The worker will stay open, listening to its
    //   task queue until MeshFlow.shutdown is called.
    await MeshFlow.Worker.create({
      connection: getRedisConfig(),
      taskQueue: 'default',
      namespace: 'meshflow',
      workflow: workflows.example,
      options: {
        backoffCoefficient: 2,
        maximumAttempts: 1_000,
        maximumInterval: '5 seconds'
      }
      
    });

    //2) initialize the client; this is typically done in
    //   another file, but is done here for convenience
    const client = new MeshFlow.Client({
      connection: getRedisConfig()
    });

    //3) start a new workflow
    const handle = await client.workflow.start({
      namespace: 'meshflow', //the app name in Redis
      taskQueue: 'default',
      workflowName: 'example',
      workflowId: `default-${HotMesh.guid()}`,
      args: ['HotMesh', 'es'],
      expire: 3_600,
      search: {
        data: {
          a: 'hello',
          b: 'world',
        },
      },
    });

    //4) subscribe to the eventual result; if a random
    //   error is encountered, the system will retry in 5s
    console.log('\nRESPONSE', await handle.result(), '\n');
    //logs '¡Hola, HotMesh!'

    //5) Shutdown (typically on sigint)
    await MeshFlow.shutdown();

    // Exit the process
    process.exit(0);
  } catch (error) {
    console.error('An error occurred:', error);

    // Shutdown and exit with error code
    await MeshFlow.shutdown();
    process.exit(1);
  }
})();
