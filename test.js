//USAGE            `npm test John Jane Jim`        ///////

//0) Import Pluck and Redis
console.log('IMPORTING REDIS/PLUCK ...');
const { Pluck } = require('@hotmeshio/pluck');
const Redis = require('ioredis');

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
  console.log('INITIALIZING REDIS/PLUCK ...');
  const pluck = new Pluck(
    Redis,
    {
      host: 'redis',
      port: 6379,
      password: 'key_admin'
    },
    null,
    schema
  );



  //3) Connect a 'greeting' worker function
  console.log('CONNECTING WORKERS ...');
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
  console.log('\n\n\nINSERTING MESSAGES ...');
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
  console.log('\n\n\nCREATING SEARCH INDEX ...');
  await pluck.createSearchIndex('greeting', {}, schema);


  //7) Full Text Search for records
  const results = await pluck.findWhere('greeting', {
    query: [{ field: 'id', is: '=', value: 'cat' }],
    limit: { start: 0, size: 100 },
    return: ['plan', 'id', 'active']
   });
  console.log('\n\n\nMATCHING USER MESSAGES ...', results, '\n');


  //8) Shutdown Pluck
  await Pluck.shutdown();
})();
