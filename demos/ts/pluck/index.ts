//USAGE            `npm run demo:ts:pluck cat dog mouse`        ///////

console.log('\n* initializing pluck demo ...\n');

import 'dotenv/config';
import { HotMeshTypes, Pluck } from '@hotmeshio/pluck';
import * as Redis from 'redis';
import { setupTelemetry } from '../../../telemetry/index';

setupTelemetry();

(async () => {
  try {
    const userIDs = process.argv.slice(2);

    //1) Define a search schema
    const schema = {
      schema: {
        id: { type: 'TAG', sortable: true },
        plan: { type: 'TAG', sortable: true },
        active: { type: 'TEXT', sortable: false },
      },
      index: 'greeting',    //the index name in Redis is 'greeting'
      prefix: ['greeting'], //only index documents with keys that begin with 'greeting'
    } as unknown as HotMeshTypes.WorkflowSearchOptions;

    //2) Initialize Pluck and Redis
    const pluck = new Pluck(
      Redis,
      { url: 'redis://:key_admin@redis:6379' },
      schema,
    );

    //3) Connect a 'greeting' worker function
    console.log('\n* connecting workers ...\n');
    await pluck.connect({
      entity: 'greeting',
      target: async function(userID: string): Promise<string> {

        const search = await Pluck.workflow.search();
        await search.set('active', 'yes');

        //simulate a database call
        return `Welcome, ${userID}.`;
      },
      options: { namespace: 'pluck' },
    });

    // Loop; call the 'greeting' worker for each user
    console.log('\n\n* inserting messages ...\n');
    for (const userID of userIDs) {

      //4) Call the 'greeting' worker function; include search data
      const response = await pluck.exec({
        entity: 'greeting',
        args: [userID],
        options: {
          ttl: 'infinity', //the function call is now a persistent, 'live' record
          id: userID,
          search: {
            data: { id: userID, plan: 'pro' }
          },
          namespace: 'pluck', //redis app name (default is 'durable')
        },
      });

      //5) Read data (by field name) directly from Redis
      const data = await pluck.get(
        'greeting',
        userID,
        { 
          fields: ['plan', 'id', 'active'],
          namespace: 'pluck'
        },
      );

      console.log(`${userID === userIDs[0] ? '\n' : ''}* UserID: ${userID}, function response =>`, response, 'function state =>', data);
    }

    //6) Create a search index
    console.log('\n\n* creating search index ...');
    await pluck.createSearchIndex('greeting', { namespace: 'pluck' }, schema);

    //7) Full Text Search for records
    const results = await pluck.findWhere('greeting', {
      query: [{ field: 'id', is: '=', value: userIDs[userIDs.length - 1] }],
      limit: { start: 0, size: 100 },
      return: ['plan', 'id', 'active']
    });
    console.log(`\n\n* matching message (${userIDs[userIDs.length - 1]}) ...\n`, results, '\n');

    //8) Shutdown Pluck
    await Pluck.shutdown();

    console.log('\n* shutting down...press ctrl+c to exit early\n');
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
