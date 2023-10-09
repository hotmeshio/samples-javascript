const { Durable } = require('@hotmeshio/hotmesh');
const Redis = require('ioredis');
const activities = require('./helloworld/activities');

async function initDurableWorker(workflowName = 'helloworld') {
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
    namespace: `${workflowName}Example`,
    taskQueue: workflowName,
    workflowsPath: require.resolve(`./${workflowName}/workflows`),
    activities,
  });
  await worker.run();
  console.log('worker running,', require.resolve(`./${workflowName}/workflows`));
}

module.exports = initDurableWorker;
