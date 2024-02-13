const express = require('express');

//1) Import Pluck and Redis
const { Pluck } = require('@hotmeshio/pluck');
const Redis = require('ioredis');

(async function init() {
  //2) Initialize Pluck (see docker-compose.yml)
  const pluck = new Pluck(Redis, {
    host: 'redis',
    port: 6379,
    password: 'key_admin'
  });

  //3) Connect a worker function
  await pluck.connect('greeting', async (first) => {
    console.log('Could fetch from the database...')
    return `Welcome, ${first}.`;
  });

  const app = express();
  app.get('/', async (req, res) => {

    //4) call/exec the worker function (cache for 3 minutes)
    const response = await pluck.exec(
      'greeting',
      [req.query.first],
      {
        ttl: '3 minutes',
        id: req.query.first,
        search: {
          data: {
            //seed the record with search data
            plan: 'pro',
            country: 'us',
            active: 'true'
          }
        }
      },
    );

    //5) return the response
    return res.send(response);
  });

  const PORT = 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}?first=John`);
  });
})();

//shutdown
async function shutdown(signal) {
  console.log(`Received ${signal}. Shutting down...`);
  await Pluck.shutdown();
  process.exit(0);
}
process.on('SIGINT', async () => {
  await shutdown('SIGINT');
});
process.on('SIGTERM', async () => {
  await shutdown('SIGTERM');
});
