//USAGE            `node test.js John Jane Jim`        ///////

//1) Import Pluck and Redis
const { Pluck } = require('@hotmeshio/pluck');
const Redis = require('ioredis');

(async () => {
  const userIDs = process.argv.slice(2);


  //2) Initialize Pluck and Redis (include a search schema)
  const pluck = new Pluck(
    Redis,
    {
      host: 'redis',
      port: 6379,
      password: 'key_admin'
    },
    null,
    //schema for searching
    {
      schema: {
        plan: { type: 'TAG', sortable: true },
        country: { type: 'TAG', sortable: true },
        active: { type: 'TEXT', sortable: false },
      },
      index: 'greeting',    //the index ID is 'greeting'
      prefix: ['greeting'], //index documents that begin with 'greeting'
    }
  );



  //3) Connect the 'greeting' worker function
  await pluck.connect('greeting', async (userID) => {
    return `Welcome, ${userID}.`;
  });



  // Loop; call the 'greeting' worker for each user
  for (const userID of userIDs) {

  

    //4) Call the 'greeting' worker function; include search data
    const response = await pluck.exec(
      'greeting',
      [userID],
      {
        //cache for 3 minutes
        ttl: '3 minutes',
        id: userID,
        search: {
          data: { plan: 'pro', country: 'ca', active: 'true' }
        }
      },
    );



    //5) Read search data
    const data = await pluck.get(
      'greeting',
      userID,
      { fields: ['plan', 'country', 'active'] }
    );

    console.log(`UserID: ${userID}, function response =>`, response, 'function state =>', data);
  }


  //6) Create a search index
  const schema = {
    schema: {
      plan: { type: 'TAG', sortable: true },
      country: { type: 'TAG', sortable: true },
      active: { type: 'TEXT', sortable: false },
    },
    index: 'greeting',    //the index ID is 'greeting'
    prefix: ['greeting'], //index documents that begin with 'greeting'
  };
  await pluck.createSearchIndex('greeting', {}, schema);


  //7) Full Text Search for records
  const results = await pluck.findWhere('greeting', {
    query: [{ field: 'country', is: '=', value: 'ca' }],
    limit: { start: 0, size: 100 },
    return: ['plan', 'country', 'active']
   });
  console.log('Search results =>', results);
  console.log('\n\nCLOSING STREAMS...\n\nPRESS `CTRL+C` TO EXIT IMMEDIATELY\n\n');


  //8) Shutdown Pluck
  await Pluck.shutdown();
})();