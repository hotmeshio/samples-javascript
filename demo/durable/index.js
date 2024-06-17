//USAGE            `npm demo:durable`        ///////

//0) Import Durable and Redis and workflow
console.log('initializing durable demo ...\n');
const { Durable, HotMesh } = require('@hotmeshio/pluck');
const Redis = require('redis');
const workflows = require('./workflows');

(async () => {
  try {
    //1) Initialize the worker; this is typically done in
    //   another file, but is done here for convenience.
    //   The worker will stay open, listening to its
    //   task queue until Durable.shutdown is called.
    await Durable.Worker.create({
      connection: {
        class: Redis,
        options: { url: 'redis://:key_admin@redis:6379' }
      },
      taskQueue: 'default',
      namespace: 'durable',
      workflow: workflows.example,
      options: {
        backoffCoefficient: 2,
        maximumAttempts: 1_000,
        maximumInterval: '5 seconds'
      }
      
    });

    //2) initialize the client; this is typically done in
    //   another file, but is done here for convenience
    const client = new Durable.Client({
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
      namespace: 'durable', //the app name in Redis
    });

    //4) subscribe to the eventual result; if a random
    //   error is encountered, the system will retry in 5s
    console.log('\nRESPONSE', await handle.result(), '\n');
    //logs '¡Hola, HotMesh!'

    //5) Shutdown (typically on sigint)
    await Durable.shutdown();

    // Exit the process
    process.exit(0);
  } catch (error) {
    console.error('An error occurred:', error);

    // Shutdown and exit with error code
    await Durable.shutdown();
    process.exit(1);
  }
})();
