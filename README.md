# samples-javascript
This repo demonstrates the use of HotMesh, Durable, and Pluck in a JavaScript environment, providing examples for caching, executing, indexing, and searching transactional workflows.

## Table of Contents
1. [HotMesh](#hotmesh)
   - [Distributed Orchestration](#distributed-orchestration)
   - [Control Without a Controller](#control-without-a-controller)
   - [Model-driven Development](#model-driven-development)
2. [Durable](#durable)
   - [High-speed, Serverless Temporal](#high-speed-serverless-temporal)
   - [Activities](#activities)
   - [Workflows](#workflows)
   - [Client](#client)
   - [Worker](#worker)
3. [Pluck](#pluck)
   - [Hybrid Transactional Analytical Processing (HTAP)](#hybrid-transactional-analytical-processing-htap)
   - [Ad hoc Operational Networks](#ad-hoc-operational-networks)
   - [Connect Your Functions](#connect-your-functions)
   - [Execute](#execute)
   - [Execute and Cache](#execute-and-cache)
   - [Execute and Operationalize](#execute-and-operationalize)
4. [Build](#build)
5. [Run/Demo HotMesh](#rundemo-hotmesh)
6. [Run/Demo Durable](#rundemo-durable)
7. [Run/Demo Pluck](#rundemo-pluck)

## HotMesh

### Distributed Orchestration
*HotMesh* is a distributed modeling and orchestration system capable of encapsulating existing systems like Business Process Management (BPM) and Enterprise Application Integration (EAI). The central innovation is its ability to compile its models into Distributed Executables, replacing a traditional Application Server with a network of Decentralized Message Routers.

The following depicts the mechanics of the approach, and describes what is essentially a *sequence engine*. Time is an event source in the system, while sequence is the final arbiter. This allows the system to use Redis like a balloon, flexibly expanding and deflating as the network adjusts to its evolving workload.

<img src="./img/stream_driven_workflow_with_redis.png" alt="A stream-driven workflow engine" style="max-width:100%;width:800px;">

>Process orchestration is emergent within HotMesh and occurs naturally as a result of routing messages. While the reference implementation targets Redis+TypeScript, any multimodal database (ValKey, DragonFly, etc) can be leveraged to deliver serverless workflows.

### Control Without a Controller
HotMesh is designed as a distributed quorum of engines where each member adheres to the principles of CQRS. According to CQRS, *consumers* are instructed to read events from assigned topic queues while *producers* write to said queues. This division of labor is essential to the smooth running of the system. HotMesh leverages this principle to drive the perpetual behavior of engines and workers (along with other advantages described [here](https://github.com/hotmeshio/sdk-typescript/blob/main/docs/distributed_orchestration.md)). 

As long as their assigned topic queue has items, consumers will read exactly one item and then journal the result to another queue. And as long as all consumers (engines and workers) adhere to this principle, sophisticated workflows emerge.

### Model-driven Development
The following YAML represents a HotMesh workflow; it includes a *trigger* and a linked *worker* function. The Sequence Engine will step through these instructions one step at a time once deployed.

```yaml
# myfirstapp.1.yaml
app:
  id: myfirstapp
  version: '1'
  graphs:
    - subscribes: myfirstapp.test
      activities:
        t1:
          type: trigger
        w1:
          type: worker
          topic: work.do
      transitions:
        mytrigger:
          - to: w1
```

>The `work.do` *topic* identifies the worker function to execute. This name is arbitrary and should match the semantics of your use case or your own personal preference.

Call `HotMesh.init` to register a *worker* and *engine*. As HotMesh is a distributed orchestration platform, initializing a point of presence like this serves to give the engine another distributed node. If spare CPU is available on the host machine, the *engine role* will be called upon to coordinate the overall workflow. Similarly, invoking the linked worker function, involves the *worker role*.

```javascript
import * as Redis from 'redis';
import { HotMesh } from '@hotmeshio/hotmesh';

const hotMesh = await HotMesh.init({
  appId: 'myfirstapp',

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
          data: { } //optionally process inputs, return output
        };
      }
    }
  ]
});

await hotMesh.deploy('./myfirstapp.1.yaml');
await hotMesh.activate('1');
const response = await hotMesh.pubsub('myfirstapp.test', {});
//returns {}
```

## Durable

### High-speed, Serverless Temporal Clone
HotMesh's *Durable* module (included alongside HotMesh in the same NPM package) is modeled after TemporalIO's developer-friendly SDK. It is included to help developers get the benefits of HotMesh without learning the YAML syntax. If you're familiar with Temporal's TypeScript SDK, the principles are exactly the same. But because it's backed by an in-memory data store (Redis), its millisecond-level performance might be better suited for those transactions requiring millisecond execution times.

The [HotMesh Durable module](https://github.com/hotmeshio/sdk-typescript/tree/main/services/durable) is a behavioral clone of **both** the Temporal TypeScript SDK and the Temporal backend application server. HotMesh's Kafka-like approach to event streams enables it to mimic the behavior of traditional application servers but without requiring the physical server. Passing messages is sufficient to produce the same outcomes without additional infrastructure, borrowing CPU from the distributed containers messages are sent.

This [single YAML file](https://github.com/hotmeshio/sdk-typescript/blob/main/services/durable/schemas/factory.ts) is HotMesh's Kafka-like description of Temporal's application server. The YAML can be difficult to read, so the following is a visual depiction of its various activities and transitions. Developers familiar with Temporal will easily make sense of various activities like reentry, collation, composition, throttling, etc. Even though this file is < 100KB, it produces behavioral fidelity indistinguishable from Temporal.

<img src="./img/temporal_state_machine.png" alt="Temporal reentrant workflow execution as a finite state machine" style="max-width:100%;width:800px;">

>HotMesh's mimicry of Temporal's server is nothing more than a finite state instruction set. And the principles can be applied to mimic any other system including integration platforms like MuleSoft.

For those familiar with Temporal, the included example targets the standard top-level constructs: `activities`, `workflows`, `workers` and `clients`. 

### Activities
Start by defining **activities**. They can be written in any style, using any framework, and can even be legacy functions you've already written. *Note how the `saludar` example throws an error 50% of the time. It doesn't matter how unpredictable your functions are, HotMesh will retry as necessary until they succeed.*

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

### Workflows
Define **workflow** logic. Include conditional branching, loops, etc to control activity execution. It's vanilla code written in your own coding style. The only requirement is to use `proxyActivities`, ensuring your activities are executed with HotMesh's durability guarantee.

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

### Client
Instance a HotMesh **client** to invoke the workflow.

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

### Worker
Create a **worker** and link your workflow function. Workers listen for tasks on their assigned Redis stream and invoke your workflow function each time they receive an event.

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

## Pluck
### Hybrid Transactional Analytical Processing (HTAP)
For those deployments with the Redis `FT.SEARCH` module enabled, it's possible to deploy [HTAP](https://en.wikipedia.org/wiki/Hybrid_transactional/analytical_processing) solutions using the Pluck, enabling millisecond-level *transactional processing* with *real-time analytics*. Even without `FT.SEARCH` enabled, Pluck's easy-to-use, functional style makes it an excellent starting point for both new development and refactoring. Key features include:

- `Easy Integration`: Seamlessly integrates into existing code bases, allowing for the refactoring of legacy systems without extensive overhaul.
- `Ad Hoc Network Creation`: Facilitates the creation of an operational data layer by connecting functions into a single, manageable mesh.
- `Durable Workflow Support`: Supports the transformation of functions into durable workflows with Redis-backed persistence.
- `Flexible Function Invocation`: Functions can be called remotely with ease, supporting both cached and uncached execution modes.
- `Workflow Extensions`: Offers a suite of workflow extension methods including hooks for extending functionality, signal handling for inter-process communication, and sleep for delaying execution.
- `Search and Indexing`: Provides tools for managing workflow state and leveraging Redis' search capabilities to query operational data.

### Ad hoc Operational Networks
The following is a typical microservices network, with a tangled mess of services and functions. There's important business logic in there (functions *A*, *B* and *C* are critical), but it's hard to find and access.

<img src="./img/operational_data_layer.png" alt="A Tangled Microservices Network with 3 valuable functions buried within" style="max-width:100%;width:600px;">

Pluck creates an *ad hoc*, Redis-backed network of functions (an "operational data layer"). It's a simple, yet powerful, way to expose and unify your most important functions into a single mesh.

*Any service with access to Redis can join in the network, bypassing the legacy clutter.*

### Connect Your Functions
Easily expose your target functions. Here the legacy `getUser` function is registered as `user`.

```javascript
import * as Redis from 'redis'; //or `import Redis from 'ioredis'`
import { Pluck } from '@hotmeshio/pluck'

const pluck = new Pluck(Redis, { url: 'redis://:key_admin@localhost:6379' });

const getUser = async (id: string) => {
  //...fetch user from DB: { id: 'jsmith123', name: 'Jan Smith', ... }
  return user;
}

pluck.connect({
  entity: 'user',
  target: getUser,
});
```

### Execute
Call connected functions from anywhere on the network with a connection to Redis.

```javascript
import * as Redis from 'redis';
import { Pluck } from '@hotmeshio/pluck'

const pluck = new Pluck(Redis, { url: 'redis://:key_admin@localhost:6379' });

const response = await pluck.exec({
  entity: 'user',
  args: ['jsmith123'],
});

//returns { id: 'jsmith123', name: 'Jan Smith', ... }
```

### Execute and Cache
Provide an `id` and `ttl` flag in the format `1 minute`, `2 weeks`, `3 months`, etc to cache the function response. This is a great way to alleviate an overburdened database...and it's a familiar pattern for those who already use Redis as a cache.

```javascript
const response = await pluck.exec({
  entity: 'user',
  args: ['jsmith123'],
  options: { id: 'jsmith123', ttl: '15 minutes' },
});

//returns cached { id: 'jsmith123', name: 'Jan Smith', ... }
```

### Execute and Operationalize
Provide a `ttl` of `infinity` to operationalize the function. It's now a **durable workflow** with all the benefits of Redis-backed governance.

```javascript
const response = await pluck.exec({
  entity: 'user',
  args: ['jsmith123'],
  options: { id: 'jsmith123', ttl: 'infinity' },
});

//returns cached { id: 'jsmith123', name: 'Jan Smith', ... }
// AND REMAINS ACTIVE!
```

Refer to the [SDK/Docs](https://hotmeshio.github.io/pluck-typescript/index.html) for a full overview of Pluck's features.

## Build
The application includes a docker-compose file that spins up one Redis instance and one Node instance. To build the application, run the following command:

```bash
docker-compose up --build -d
```

## Run/Demo HotMesh
This demo deploys a custom YAML model and a linked worker function to demonstrate the full end-to-end lifecycle.
```bash
npm run demo:hotmesh greetings
```

## Run/Demo Durable
This demo shows a basic durable workflow with support for *retry*. It throws errors 50% of the time and eventually recovers, logging the result of the workflow execution to the log. The retry cycle is set at 5 seconds.

```bash
npm run demo:durable
```

## Run/Demo Pluck
This demo runs a few workflows (one for every term you add when starting the test). The app auto-deploys, creates an index, and searches for workflow records based upon terms. The following will create 3 searchable workflows: cat, dog, mouse. The last term entered will be used to drive the FT.SEARCH query. (The following would search for the 'mouse' record after all workflows (cat, dog, and mouse) have started.)

```bash
npm run demo:pluck cat dog mouse
```