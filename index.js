const express = require('express');
const { Durable } = require('@hotmeshio/hotmesh');
const executeDurableWorkflow = require('./durable/client');
const initDurableWorker = require('./durable/worker');

//startup
(async function init() {
  await initDurableWorker('helloworld');
  const app = express();
  app.get('/', async (req, res) => {
    const response = await executeDurableWorkflow('helloworld');
    return res.send(response);
  });
  const PORT = 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
})();

//shutdown
async function shutdown(signal) {
  console.log(`Received ${signal}. Shutting down...`);
  await Durable.Worker.shutdown();
  await Durable.Client.shutdown();
  process.exit(0);
}
process.on('SIGINT', async () => {
  await shutdown('SIGINT');
});
process.on('SIGTERM', async () => {
  await shutdown('SIGTERM');
});
