//USAGE            `DEMO_DB=valkey FTS=false npm run demo:js:meshdata bronze silver gold`
//                 `DEMO_DB=dragonfly npm run demo:js:meshdata bronze silver gold`
//                 `npm run demo:js:meshdata bronze silver gold` //default is redis

console.log('\n* initializing meshdata demo ...\n');

const { MeshData } = require('@hotmeshio/hotmesh');
const { getRedisConfig } = require('../config');

(async () => {
  const redisConfig = getRedisConfig();
  try {
    let userIDs = process.argv.slice(2);
    if (!userIDs.length) {
      userIDs = ['bronze', 'silver', 'gold'];
    }

    //1) Define a search schema
    const schema = {
      schema: {
        id: { type: 'TAG', sortable: true },
        plan: { type: 'TAG', sortable: true },
        active: { type: 'TEXT', sortable: false },
      },
      index: 'default',    //the index name in Redis is 'default'
      prefix: ['default'], //only index documents with keys that begin with 'default'
    };

    //2) Initialize MeshData and Redis
    const meshData = new MeshData(
      redisConfig.class,
      redisConfig.options,
      schema,
    );

    //3) Connect a 'default' worker function; call 'default' so it has a namespace we've declared with the manifest
    //   (lets us see the data in the dashboard )
    console.log('\n* connecting workers ...\n');
    await meshData.connect({
      entity: 'default',
      target: async function(userID) {

        const search = await MeshData.workflow.search();
        await search.set('active', 'yes');

        //simulate a database call
        return `Welcome, ${userID}.`;
      },
      options: { namespace: 'meshdata' },
    });

    // Loop; call the 'default' worker for each user
    console.log('\n\n* inserting messages ...\n');
    for (const userID of userIDs) {

      //4) Call the 'default' worker function; include search data
      const response = await meshData.exec({
        entity: 'default',
        args: [userID],
        options: {
          ttl: '45 minutes',
          id: userID,
          search: {
            data: { id: userID, plan: 'pro' }
          },
          namespace: 'meshdata', //redis app name (default is 'durable')
        },
      });

      //5) Read data (by field name) directly from Redis
      const data = await meshData.get(
        'default',
        userID,
        { 
          fields: ['plan', 'id', 'active'],
          namespace: 'meshdata'
        },
      );

      console.log(`${userID === userIDs[0] ? '\n' : ''}* UserID: ${userID}, function response =>`, response, 'function state =>', data);
    }

    //when testing valkey, elasticache, etc skip search to avoid errors in testing
    if (process.env.FTS === 'false') {
      console.log('\n* Full Text Search Unsupported.skipping search index creation and search\n');
    } else {
      //6) Create a search index
      console.log('\n\n* creating search index ...');
      await meshData.createSearchIndex('default', { namespace: 'meshdata' }, schema);

      //7) Full Text Search for records
      const results = await meshData.findWhere('default', {
        query: [{ field: 'id', is: '=', value: userIDs[userIDs.length - 1] }],
        limit: { start: 0, size: 100 },
        return: ['plan', 'id', 'active']
      });
      console.log(`\n\n* matching message (${userIDs[userIDs.length - 1]}) ...\n`, results, '\n');
    }

    //8) Shutdown MeshData
    await MeshData.shutdown();

    console.log('\n* shutting down...press ctrl+c to exit early\n');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
