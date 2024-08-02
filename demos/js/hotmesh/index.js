//USAGE            `DEMO_DB=dragonfly npm run demo:js:hotmesh howdy`
//                 `DEMO_DB=valkey npm run demo:js:hotmesh hi`
//                 `npm run demo:js:hotmesh` //default is hello

console.log('initializing hotmesh demo ...\n');

require('dotenv').config();
const { HotMesh } = require('@hotmeshio/hotmesh');
const { getRedisConfig } = require('../config');
const { setupTelemetry, shutdownTelemetry, getTraceUrl } = require('../tracer');

setupTelemetry();

(async () => {

  //init an engine and worker
  const hotMesh = await HotMesh.init({
    appId: 'hotmesh',
    logLevel: process.env.HMSH_LOG_LEVEL || 'debug',
    engine: {
      redis: getRedisConfig(),
    },

    workers: [
      { 
        topic: 'work.do',
        redis: getRedisConfig(),
        callback: async function (payload) {
          return {
            metadata: { ...payload.metadata },
            data: { workerOutput: `${payload?.data?.workerInput} world` }
          };
        }
      }
    ]
  });

  //3) compile and deploy the app to Redis (the distributed executable)
  await hotMesh.deploy(`app:
  id: hotmesh
  version: '1'
  graphs:
    - subscribes: hotmesh.test

      expire: 3600

      input:
        schema:
          type: object
          properties:
            input:
              type: string

      output:
        schema:
          type: object
          properties:
            output:
              type: string

      activities:
        trigger1:
          type: trigger
        worker1:
          type: worker
          topic: work.do
          input:
            schema:
              type: object
              properties:
                workerInput:
                  type: string
            maps:
              workerInput: '{trigger1.output.data.input}'
          output:
            schema:
              type: object
              properties:
                workerOutput:
                  type: string
          job:
            maps:
              output: '{$self.output.data.workerOutput}'
      transitions:
        trigger1:
          - to: worker1`);

  //4) activate the app (happens simultaneously network wide)
  await hotMesh.activate('1');

  //5) run input test
  const [greeting, ..._rest] = process.argv.slice(2);
  const response = await hotMesh.pubsub('hotmesh.test', { input : greeting ?? 'hello' });
  console.log('\nRESPONSE', response.data.output, '\n');

  //6) Shutdown
  hotMesh.stop();
  await HotMesh.stop();
  await shutdownTelemetry();
  console.log('\n\nTELEMETRY', getTraceUrl(response.metadata.trc), '\n');

  process.exit(0);
})();
