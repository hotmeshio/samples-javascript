//USAGE            `npm demo:durable`        ///////

//0) Import Durable and Redis and workflow
console.log('initializing durable demo ...\n');
const { Durable, HotMesh } = require('@hotmeshio/pluck');
const Redis = require('redis');
const workflows = require('./workflows');

(async () => {
  try {
    //1) initialize the worker; this is typically done in
    //   another file, but is done here for convenience
    await Durable.Worker.create({
      connection: {
        class: Redis,
        options: { url: 'redis://:key_admin@redis:6379' }
      },
      taskQueue: 'default',
      namespace: 'temporal',
      workflow: workflows.example,
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
      namespace: 'temporal',
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
