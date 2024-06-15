# samples-javascript
This repo demonstrates the use of [HotMesh](./test/hotmesh.js), [Durable](./test/durable.js), and [Pluck](./test/pluck.js) in a JavaScript environment, providing examples in each environment for caching, executing, indexing, and searching transactional workflows.

 ## HotMesh 

*HotMesh* is a distributed modeling and orchestration system capable of encapsulating existing systems like Business Process Management (BPM) and Enterprise Application Integration (EAI). The central innovation is its ability to compile its models (authored in YAML) into Distributed Executables, replacing a traditional Application Server with a network of Decentralized Message Routers. *Process orchestration is emergent and occurs naturally as a result of routing messages.* The following depicts the mechanics of the underlying *sequence engine* that drives the overall process. Any multimodal database (Redis, ValKey, etc) can be used to drive serverless workflows.

<img src="./img/stream_driven_workflow_with_redis.png" alt="A stream-driven workflow engine" style="max-width:100%;width:800px;">

The following YAML represents a HotMesh *executable flow* (where actual work is performed by coordinating and executing functions on your network). The Sequence Engine steps through these instructions, one step at a time as it processes stream messages. Notice how activity, `a1`, has been defined as a `worker` type.

>The `work.do` *topic* identifies the worker function to execute. This name is arbitrary and should match the semantics of your use case and the *topic* space you define for your organization.

```yaml
# abc.1.yaml
app:
  id: abc
  version: '1'
  graphs:
    - subscribes: abc.test
      activities:
        t1:
          type: trigger
        a1:
          type: worker
          topic: work.do
      transitions:
        t1:
          - to: a1
```

The `HotMesh.init` call registers both a *worker* function and an *engine*. As HotMesh is a distributed orchestration platform, points of presence like this serve both roles. If spare CPU is available on the host machine, the *engine role* will be called upon to coordinate the overall workflow, obviating the need for a central application server.

```javascript
import * as Redis from 'redis';
import { HotMesh } from '@hotmeshio/hotmesh';

const hotMesh = await HotMesh.init({
  appId: 'abc',

  engine: {
    redis: {
      class: Redis,
      options: { host, port, password, db }
    }
  },

  workers: [
    { 
      topic: 'work.do',
      redis: {
        class: Redis,
        options: { host, port, password, db }
      }
      callback: async (data: StreamData) => {
        return {
          metadata: { ...data.metadata },
          data: { hello: 'world' }
        };
      }
    }
  ]
});

await hotMesh.deploy('./abc.1.yaml');
await hotMesh.activate('1');
const response = await hotMesh.pubsub('abc.test', {});
//returns { hello: 'world' }
```

## Durable
HotMesh's *Durable* module (included alongside HotMesh in the same NPM package) is modeled after Temporal.io's developer-friendly SDK. It was included to help developers use HotMesh without learning the YAML models. If you're familiar with Temporal's TypeScript SDK, the principles are exactly the same. But because it's backed by an in-memory data store (Redis), its millisecond-level performance might be better-suited for those transactions requiring millisecond execution times.

The [HotMesh Durable module](https://github.com/hotmeshio/sdk-typescript/tree/main/services/durable) is a behavioral clone of **both** the Temporal TypeScript SDK and the Temporal backend application server. HotMesh's Kafka-like approach to event-streams, enables it to mimic the behavior of traditional application servers but without requiring the physical server. Passing messages is sufficient to produce the same outcomes without additional infrastructure, borrowing CPU from the distributed containers messages are sent.

This [single YAML file](https://github.com/hotmeshio/sdk-typescript/blob/main/services/durable/schemas/factory.ts) is HotMesh's Kafka-like description of Temporal's application server. The YAML can be difficult to read, so the following is a visual depiction of its various activities and transitions. Developers familiar with Temporal will easily make sense of various activities like reentry, collation, composition, throttling, etc. Even though this file is < 100KB, it produces behavioral fidelity indisinguishable from Temporal.

<img src="./img/temporal_state_machine.png" alt="Temporal reentrant workflow execution as a finite state machine" style="max-width:100%;width:800px;">

>HotMesh's mimicry of Temporal's server is nothing more than a finite state instruction set. And the principles can be applied to mimic any other system including integration platforms like MuleSoft.

The included example is as follows.

1. Start by defining **activities**. They can be written in any style, using any framework, and can even be legacy functions you've already written. The only requirement is that they return a Promise. *Note how the `saludar` example throws an error 50% of the time. It doesn't matter how unpredictable your functions are, HotMesh will retry as necessary until they succeed.*
    ```javascript
    //activities.ts
    export async function greet(name: string): Promise<string> {
      return `Hello, ${name}!`;
    }

    export async function saludar(nombre: string): Promise<string> {
      if (Math.random() > 0.5) throw new Error('Random error');
      return `¡Hola, ${nombre}!`;
    }
    ```
2. Define your **workflow** logic. Include conditional branching, loops, etc to control activity execution. It's vanilla code written in your own coding style. The only requirement is to use `proxyActivities`, ensuring your activities are executed with HotMesh's durability guarantee.
    ```javascript
    //workflows.ts
    import { Durable } from '@hotmeshio/hotmesh';
    import * as activities from './activities';

    const { greet, saludar } = Durable.workflow
      .proxyActivities<typeof activities>({
        activities
      });

    export async function example(name: string, lang: string): Promise<string> {
      if (lang === 'es') {
        return await saludar(name);
      } else {
        return await greet(name);
      }
    }
    ```
3. Instance a HotMesh **client** to invoke the workflow.
    ```javascript
    //client.ts
    import { Durable, HotMesh } from '@hotmeshio/hotmesh';
    import Redis from 'ioredis'; //OR `import * as Redis from 'redis';`

    async function run(): Promise<string> {
      const client = new Durable.Client({
        connection: {
          class: Redis,
          options: { host: 'localhost', port: 6379 }
        }
      });

      const handle = await client.workflow.start({
        args: ['HotMesh', 'es'],
        taskQueue: 'default',
        workflowName: 'example',
        workflowId: HotMesh.guid()
      });

      return await handle.result();
      //returns '¡Hola, HotMesh!'
    }
    ```
4. Finally, create a **worker** and link your workflow function. Workers listen for tasks on their assigned Redis stream and invoke your workflow function each time they receive an event.
    ```javascript
    //worker.ts
    import { Durable } from '@hotmeshio/hotmesh';
    import Redis from 'ioredis';
    import * as workflows from './workflows';

    async function run() {
      const worker = await Durable.Worker.create({
        connection: {
          class: Redis,
          options: { host: 'localhost', port: 6379 },
        },
        taskQueue: 'default',
        workflow: workflows.example,
      });

      await worker.run();
    }
    ```
 
## Build
The application includes a docker-compose file that spins up one Redis instance and one Node instance. To build the application, run the following command:

```bash
docker-compose up --build -d
```

## Run/Test HotMesh
```bash
npm run test:hotmesh
```

## Run/Test Durable
```bash
npm run test:durable
```

## Run/Test Pluck
```bash
npm run test:pluck cat dog mouse
```