//USAGE            `DEMO_DB=valkey npm run cron:start my-cron-123`
//                 `DEMO_DB=dragonfly npm run cron:start my-cron-123`
//                 `npm run cron:start my-cron-123` //default is redis

import 'dotenv/config';
import { MeshCall } from "@hotmeshio/hotmesh";
import { startMyCron } from ".";
import { setupTelemetry, shutdownTelemetry } from '../modules/tracer';

(async () => {
  //init telemetry so a trace is assigned
  setupTelemetry();

  //let user override the cron id
  let [id = 'my-123-cron'] = process.argv.slice(2);

  await startMyCron(
    id ?? 'my-123-cron',
    'my.demo.cron',
    null,
    [id ?? 'my-123-cron', 'CoolMesh'],
  );

  //exit after starting; other workers/engines will do the rest
  await MeshCall.shutdown();
  await shutdownTelemetry();
})();