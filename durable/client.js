const {Durable} = require('@hotmeshio/hotmesh');
const Redis = require('ioredis');

async function executeDurableWorkflow(workflowName = 'helloworld') {
  const connection = await Durable.Connection.connect({
    class: Redis,
    options: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      // password: config.REDIS_PASSWORD,
      // db: config.REDIS_DATABASE,
    },
  });
  const client = new Durable.Client({
    connection,
  });
  const handle = await client.workflow.start({
    args: ['HotMesh'],
    taskQueue: workflowName,
    workflowName: `${workflowName}Example`,
    workflowId: `${workflowName}-${Math.random()}`,
  });
  console.log(`Started ${workflowName} ==> ${handle.workflowId}`);
  const output = await handle.result();
  console.log(output);
  return await output;
}

module.exports = executeDurableWorkflow;
