//USAGE            `DEMO_DB=valkey npm run demo:js:meshflow`
//                 `DEMO_DB=dragonfly npm run demo:js:meshflow`
//                 `npm run demo:js:meshflow` //default is redis

console.log('initializing meshflow demo ...\n');

require('dotenv').config();
const { MeshFlow, HotMesh } = require('@hotmeshio/hotmesh');
const { getRedisConfig } = require('../config');
const workflows = require('./workflows');
const { setupTelemetry, shutdownTelemetry, getTraceUrl } = require('../tracer');

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
      connection: getRedisConfig(),
    });

    //3) start a new workflow
    const workflowId = `default-${HotMesh.guid()}`;
    const handle = await client.workflow.start({
      namespace: 'meshflow', //the app name in Redis
      taskQueue: 'default',
      workflowName: 'example',
      workflowId,
      args: ['HotMesh', 'es'],
      expire: 3_600,
      //add searchable, indexed data
      search: {
        data: {
          '$entity': 'default',
          id : workflowId,
        },
      },
    });

    //4) subscribe to the eventual result
    console.log('\nRESPONSE', await handle.result(), '\n');
    const jobState = await handle.state(true);

    //5) Shutdown (typically on sigint/sigterm)
    await MeshFlow.shutdown();
    await shutdownTelemetry();
    console.log('\n\nTELEMETRY', getTraceUrl(jobState.metadata.trc), '\n');

    process.exit(0);
  } catch (error) {
    console.error('An error occurred:', error);

    // Shutdown and exit with error code
    await MeshFlow.shutdown();
    process.exit(1);
  }
})();
