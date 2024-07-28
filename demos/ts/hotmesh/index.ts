//USAGE            `DEMO_DB=dragonfly npm run demo:ts:hotmesh howdy`
//                 `DEMO_DB=valkey npm run demo:ts:hotmesh hi`
//                 `npm run demo:ts:hotmesh` //default is hello

console.log('initializing hotmesh demo ...\n');

import 'dotenv/config';
import { HotMesh } from '@hotmeshio/hotmesh';
import { setupTelemetry } from '../../../telemetry';
import { getRedisConfig } from '../config';
setupTelemetry();

(async () => {

  //init an engine and worker
  const hotMesh = await HotMesh.init({
    appId: 'hotmesh',
    engine: { redis: getRedisConfig() },

    workers: [
      { 
        topic: 'work.do',
        redis: getRedisConfig(),
        callback: async function (data) {
          return {
            metadata: { ...data.metadata },
            data: { y: `${data?.data?.x} world` }
          };
        }
      }
    ]
  });

  //3) compile and deploy the app (distributed executable) to Redis 
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
            a:
              type: string

      output:
        schema:
          type: object
          properties:
            b:
              type: string

      activities:
        t1:
          type: trigger
        a1:
          type: worker
          topic: work.do
          input:
            schema:
              type: object
              properties:
                x:
                  type: string
            maps:
              x: '{t1.output.data.a}'
          output:
            schema:
              type: object
              properties:
                y:
                  type: string
          job:
            maps:
              b: '{$self.output.data.y}'
      transitions:
        t1:
          - to: a1`);

  //4) re/activate the app across the quorum (happens simultaneously network wide)
  await hotMesh.activate('1');

  //5) run a test
  const [greeting, ..._rest] = process.argv.slice(2);
  const response = await hotMesh.pubsub('hotmesh.test', { a : greeting ?? 'hello' });
  console.log('\nRESPONSE', response.data.b, '\n');
  // returns: `hello world` (or echoes `${greeting} world`)

  //6) Shutdown HotMesh
  hotMesh.stop();
  await HotMesh.stop();

  // Exit the process
  process.exit(0);
})();
