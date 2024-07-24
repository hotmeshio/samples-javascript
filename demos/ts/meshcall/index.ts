//USAGE            `npm run demo:ts:meshcall cat dog mouse`        ///////

console.log('\n* initializing meshcall demo ...\n');


import 'dotenv/config';
import { MeshCall } from '@hotmeshio/hotmesh';
import * as Redis from 'redis';
import { setupTelemetry } from '../../../telemetry/index';

setupTelemetry();

(async () => {
  try {
    //1) Connect a worker function
    console.log('\n* connecting worker ...\n');
    await MeshCall.connect({
      namespace: 'meshcall',
      topic: 'my.function',
      redis: {
        class: Redis,
        options: { url: 'redis://:key_admin@redis:6379' },
      },
      callback: async function(userID: string): Promise<string> {
        //do stuff...
        console.log('callback was called >', userID);
        return `Welcome, ${userID}.`;
      },
    });

    //2) Call the worker function 
    console.log('\n* calling worker through the mesh ...\n');
    const response = await MeshCall.exec({
      namespace: 'meshcall',
      topic: 'my.function',
      args: ['CoolMesh'],
      redis: {
        class: Redis,
        options: { url: 'redis://:key_admin@redis:6379' },
      },
    });
    console.log('\n* worker response >', response);

    //3) Clear the cached response (in case any exist)
    console.log('\n* clearing the cache ...\n');
    await MeshCall.flush({
      namespace: 'meshcall',
      topic: 'my.function',
      id: 'mycached123',
      redis: {
        class: Redis,
        options: { url: 'redis://:key_admin@redis:6379' },
      },
      options: { id: 'mycached123' }, //this format also works
    });

    //4) Loop 4 times
    //     the callback function will have been called 1 time
    //     even though the response is returned 4 times
    for (let i = 0; i < 4; i++) {
      //only the first iteration is called
      const cached = await MeshCall.exec({
        namespace: 'meshcall',
        topic: 'my.function',
        args: ['CachedMesh'],
        redis: {
          class: Redis,
          options: { url: 'redis://:key_admin@redis:6379' },
        },
        options: { id: 'mycached123', ttl: '1 day' },
      });
      console.log('* cached response for 1 day>', cached);
    }

    //4) Shutdown MeshCall
    await MeshCall.shutdown();

    console.log('\n* shutting down...\n');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
