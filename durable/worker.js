const { Durable } = require('@hotmeshio/hotmesh');
const Redis = require('ioredis');
const helloworldExample = require('./helloworld/workflows');

async function initDurableWorker() {
  const connection = await Durable.NativeConnection.connect({
    class: Redis,
    options: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      // password: config.REDIS_PASSWORD,
      // db: config.REDIS_DATABASE,
    },
  });
  const worker = await Durable.Worker.create({
    connection,
    namespace: 'helloworldExample',
    taskQueue: 'helloworld',
    workflow: helloworldExample,
  });
  await worker.run();
  console.log('worker running,', require.resolve('./helloworld/workflows'));
}

module.exports = initDurableWorker;
