//USAGE            `DEMO_DB=valkey npm run cron:start my-cron-123`
//                 `DEMO_DB=dragonfly npm run cron:start my-cron-123`
//                 `npm run cron:start my-cron-123` //default is redis

import 'dotenv/config';
import { MeshCall } from "@hotmeshio/hotmesh";
import { startMyCron } from ".";
import { setupTelemetry, shutdownTelemetry } from '../modules/tracer';

(async () => {
  setupTelemetry();
  const [id] = process.argv.slice(2);
  await startMyCron(
    id ?? 'my-custom-cron-123',
    'my.demo.cron',
    null, //don't register a callback. just start the cron
    ['CoolMesh'],
  );
  //exit after starting; other workers/engines will do the rest
  await MeshCall.shutdown();
  await shutdownTelemetry();
})();