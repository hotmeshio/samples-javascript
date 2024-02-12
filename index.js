const express = require('express');
const { Pluck, MeshOS } = require('@hotmeshio/pluck');
const Redis = require('ioredis');


//startup
(async function init() {
  //initialize the pluck instance to connect to the redis server
  const pluck = new Pluck(Redis, { host: 'redis', port: 6379, password: 'key_admin' });

  //connect the worker (it returns `Welcome, ${first}.`)
  await pluck.connect('greeting', async (first) => {
    console.log('Could fetch from the database...')
    return `Welcome, ${first}.`;
  });

  //define the http route
  const app = express();
  app.get('/', async (req, res) => {

    //call the 'greeting' function and cache for 3 minutes
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
