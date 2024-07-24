//USAGE            `npm run demo:ts:meshdata cat dog mouse`        ///////

console.log('\n* initializing meshdata demo ...\n');

import 'dotenv/config';
import { Types, MeshData } from '@hotmeshio/hotmesh';
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
    } as unknown as Types.WorkflowSearchOptions;

    //2) Initialize MeshData and Redis
    const meshData = new MeshData(
      Redis,
      { url: 'redis://:key_admin@redis:6379' },
      schema,
    );

    //3) Connect a 'greeting' worker function
    console.log('\n* connecting workers ...\n');
    await meshData.connect({
      entity: 'greeting',
      target: async function(userID: string): Promise<string> {

        const search = await MeshData.workflow.search();
        await search.set('active', 'yes');

        //simulate a database call
        return `Welcome, ${userID}.`;
      },
      options: { namespace: 'meshdata' },
    });

    // Loop; call the 'greeting' worker for each user
    console.log('\n\n* inserting messages ...\n');
    for (const userID of userIDs) {

      //4) Call the 'greeting' worker function; include search data
      const response = await meshData.exec({
        entity: 'greeting',
        args: [userID],
        options: {
          ttl: 'infinity', //the function call is now a persistent, 'live' record
          id: userID,
          search: {
            data: { id: userID, plan: 'pro' }
          },
          namespace: 'meshdata', //redis app name (default is 'meshflow')
        },
      });

      //5) Read data (by field name) directly from Redis
      const data = await meshData.get(
        'greeting',
        userID,
        { 
          fields: ['plan', 'id', 'active'],
          namespace: 'meshdata'
        },
      );

      console.log(`${userID === userIDs[0] ? '\n' : ''}* UserID: ${userID}, function response =>`, response, 'function state =>', data);
    }

    //6) Create a search index
    console.log('\n\n* creating search index ...');
    await meshData.createSearchIndex('greeting', { namespace: 'meshdata' }, schema);

    //7) Full Text Search for records
    const results = await meshData.findWhere('greeting', {
      query: [{ field: 'id', is: '=', value: userIDs[userIDs.length - 1] }],
      limit: { start: 0, size: 100 },
      return: ['plan', 'id', 'active']
    });
    console.log(`\n\n* matching message (${userIDs[userIDs.length - 1]}) ...\n`, results, '\n');

    //8) Shutdown MeshData
    await MeshData.shutdown();

    console.log('\n* shutting down...press ctrl+c to exit early\n');
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
