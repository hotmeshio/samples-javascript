//USAGE            `npm test cat dog mouse`        ///////

//0) Import Pluck and Redis
console.log('initializing pluck demo ...\n');
const { Pluck } = require('@hotmeshio/pluck');
const Redis = require('redis');

(async () => {
  const userIDs = process.argv.slice(2);

  //1) Define a search schema
  const schema = {
    schema: {
      id: { type: 'TAG', sortable: true },
      plan: { type: 'TAG', sortable: true },
      active: { type: 'TEXT', sortable: false },
    },
    index: 'greeting',    //the index ID is 'greeting'
    prefix: ['greeting'], //index documents that begin with 'greeting'
  };


  //2) Initialize Pluck and Redis
  const pluck = new Pluck(
    Redis,
    { url: 'redis://:key_admin@redis:6379' },
    schema
  );


  //3) Connect a 'greeting' worker function
  console.log('connecting workers ...\n');
  await pluck.connect({
    entity: 'greeting',
    target: async function(userID) {

      const search = await Pluck.workflow.search();
      await search.set('active', 'yes');

      //simulate a database call
      return `Welcome, ${userID}.`;
    }
  });


  // Loop; call the 'greeting' worker for each user
  console.log('\n\ninserting messages ...');
  for (const userID of userIDs) {

  

    //4) Call the 'greeting' worker function; include search data
    const response = await pluck.exec({
      entity: 'greeting',
      args: [userID],
      options: {
        //cache for 3 minutes
        ttl: '3 minutes',
        id: userID,
        search: {
          data: { id: userID, plan: 'pro' }
        }
      },
    });

    //5) Read search data
    const data = await pluck.get(
      'greeting',
      userID,
      { fields: ['plan', 'id', 'active'] }
    );

    console.log(`UserID: ${userID}, function response =>`, response, 'function state =>', data);
  }


  //6) Create a search index
  console.log('\n\ncreating search index ...');
  await pluck.createSearchIndex('greeting', {}, schema);


  //7) Full Text Search for records
  const results = await pluck.findWhere('greeting', {
    query: [{ field: 'id', is: '=', value: userIDs[userIDs.length - 1] }],
    limit: { start: 0, size: 100 },
    return: ['plan', 'id', 'active']
   });
  console.log(`\n\nmatching message (${userIDs[userIDs.length - 1]}) ...`, results, '\n');


  //8) Shutdown Pluck
  await Pluck.shutdown();
})();
