//USAGE            `DEMO_DB=valkey npm run cron:stop my-cron-123`
//                 `DEMO_DB=dragonfly npm run cron:stop my-cron-123`
//                 `npm run cron:stop my-cron-123` //default is redis

import { MeshCall } from "@hotmeshio/hotmesh";
import { stopMyCron } from ".";

(async () => {
  const [id] = process.argv.slice(2);
  await stopMyCron(id ?? 'my-123-cron', 'my.demo.cron');
  await MeshCall.shutdown();
})();