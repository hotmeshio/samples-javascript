//USAGE            `npm test cat dog mouse`        ///////

//0) Import Pluck and Redis
console.log('IMPORTING REDIS/HOTMESH ...');
const { HotMesh } = require('@hotmeshio/pluck');
const Redis = require('redis');

(async () => {
  //init the engine and worker
  const hotMesh = await HotMesh.init({
    appId: 'abc',
    engine: {
      redis: {
        class: Redis,
        options: {
          socket: {
            host: 'redis',
            port: 6379,
          },
          password: 'key_admin'
        }
      }
    },

    workers: [
      { 
        topic: 'work.do',
        redis: {
          class: Redis,
          options: {
            socket: {
              host: 'redis',
              port: 6379,
            },
            password: 'key_admin'
          }
        },

        //linked function (will echo hello world)
        callback: async (data) => {
          return {
            metadata: { ...data.metadata },
            data: { y: `${data?.data?.x} world` }
          };
        }
      }
    ]
  });

  await hotMesh.deploy(`app:
  id: abc
  version: '1'
  graphs:
    - subscribes: abc.test

      input:
        schema:
          type: object
          properties:
            a:
              type: string

      output:
        schema:
          type: object
          properties:
            b:
              type: string

      activities:
        t1:
          type: trigger
        a1:
          type: worker
          topic: work.do
          input:
            schema:
              type: object
              properties:
                x:
                  type: string
            maps:
              x: '{t1.output.data.a}'
          output:
            schema:
              type: object
              properties:
                y:
                  type: string
          job:
            maps:
              b: '{$self.output.data.y}'
      transitions:
        t1:
          - to: a1`);

  await hotMesh.activate('1');
  const response5 = await hotMesh.pubsub('abc.test', { a : 'hello' });
  console.log(response5.data.b); // hello world

  //8) Shutdown Pluck
  hotMesh.stop();
  await HotMesh.stop();
})();
