//USAGE            `npm run demo:js:meshflow`        ///////

console.log('initializing meshflow demo ...\n');

const { MeshFlow, HotMesh } = require('@hotmeshio/hotmesh');
const Redis = require('redis');
const workflows = require('./workflows');

(async () => {
  try {
    //1) Initialize the worker; this is typically done in
    //   another file, but is done here for convenience.
    //   The worker will stay open, listening to its
    //   task queue until MeshFlow.shutdown is called.
    await MeshFlow.Worker.create({
      connection: {
        class: Redis,
        options: { url: 'redis://:key_admin@redis:6379' }
      },
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
      connection: {
        class: Redis,
        options: { url: 'redis://:key_admin@redis:6379' }
      }
    });

    //3) start a new workflow
    const handle = await client.workflow.start({
      args: ['HotMesh', 'es'],
      taskQueue: 'default',
      workflowName: 'example',
      workflowId: HotMesh.guid(),
      namespace: 'meshflow', //the app name in Redis
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
