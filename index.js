const express = require('express');

//1) Import Pluck and Redis
const { Pluck, MeshOS } = require('@hotmeshio/pluck');
const Redis = require('ioredis');

(async function init() {
  //2) Initialize Pluck with a Redis backend (see docker-compose.yml for the Redis configuration)
  const pluck = new Pluck(Redis, { host: 'redis', port: 6379, password: 'key_admin' });

  //3) Connect a worker function (this one returns `Welcome, ${first}.`)
  await pluck.connect('greeting', async (first) => {
    console.log('Could fetch from the database...')
    return `Welcome, ${first}.`;
  });

  const app = express();
  app.get('/', async (req, res) => {

    //4) call/exec a worker function (cache the response for 3 minutes)
    const response = await pluck.exec(
      'greeting',
      [req.query.first],
      { ttl: '3 minutes', id: req.query.first },
    );

    //return the response
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
  await MeshOS.stopWorkers();
  process.exit(0);
}
process.on('SIGINT', async () => {
  await shutdown('SIGINT');
});
process.on('SIGTERM', async () => {
  await shutdown('SIGTERM');
});
