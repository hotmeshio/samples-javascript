//import entity classes
import { Bill } from '../namespaces/sandbox/bill';
import { Test } from '../namespaces/sandbox/test';
import { User } from '../namespaces/sandbox/user';
import { Order as BillingOrder } from '../namespaces/billing/order';
import { Order as RoutingOrder } from '../namespaces/routing/order';
import { Inventory } from '../namespaces/inventory';
import { DefaultEntity } from '../namespaces/default';

//import entity schemas
import { schema as BillingOrderSchema } from '../namespaces/billing/order/schema';
import { schema as RoutingOrderSchema } from '../namespaces/routing/order/schema';
import { schema as SandboxUserSchema } from '../namespaces/sandbox/user/schema';
import { schema as SandboxBillSchema } from '../namespaces/sandbox/bill/schema';
import { schema as SandboxTestSchema } from '../namespaces/sandbox/test/schema';
import { schema as InventorySchema } from '../namespaces/inventory/schema';
import { EntityInstanceTypes, Namespaces, Profiles } from '../../types/manifest';
import { Types } from '@hotmeshio/hotmesh';

/**
 * The dashboard will only load those backend dbs where the environment
 * variable is set to 'true'. This allows selective deployment of
 * the backend databases (app servers) being tested. Use the .env file for
 * setting locally.
 */
const USE_REDIS = process.env.USE_REDIS !== 'false'; //default to true
const USE_DRAGONFLY = process.env.USE_DRAGONFLY === 'true';
const USE_VALKEY = process.env.USE_VALKEY === 'true';

/**
 * The dashboard service can surface multiple databases, each of which may
 * have multiple namespaces, each of which has separate entities.
 */
export const dbs = {
  redis: {
    name: 'Redis',
    label: 'redis/redis-stack7.2.0',
    search: true,
    config: {
      REDIS_DATABASE: 0,
      REDIS_HOST: USE_REDIS && 'redis' || undefined,
      REDIS_PORT: 6379,
      REDIS_USERNAME: '',
      REDIS_PASSWORD: 'key_admin',
      REDIS_USE_TLS: false,
    }
  },
  valkey: {
    name: 'ValKey',
    label: 'ValKey',
    search: false,
    config: {
      REDIS_DATABASE: 0,
      REDIS_HOST: USE_VALKEY && 'valkey' || undefined,
      REDIS_PORT: 6379,
      REDIS_USERNAME: '',
      REDIS_PASSWORD: 'key_admin',
      REDIS_USE_TLS: false,
    }
  },
  dragonfly: {
    name: 'Dragonfly',
    label: 'DragonflyDB',
    search: true,
    config: {
      REDIS_DATABASE: 0,
      REDIS_HOST: USE_DRAGONFLY && 'dragonflydb' || undefined,
      REDIS_PORT: 6379,
      REDIS_USERNAME: '',
      REDIS_PASSWORD: 'key_admin',
      REDIS_USE_TLS: false,
    }
  }
};

export const entities = {
  'billing-order': {
    name: 'order',
    label: 'Order',
    schema: BillingOrderSchema,
    class: BillingOrder,
  },
  'sandbox-user': {
    name: 'user',
    label: 'User',
    schema: SandboxUserSchema,
    class: User,
  },
  'sandbox-bill': {
    name: 'bill',
    label: 'Bill',
    schema: SandboxBillSchema,
    class: Bill,
  },
  'sandbox-test': {
    name: 'test',
    label: 'Test',
    schema: SandboxTestSchema,
    class: Test,
  },
  'inventory': {
    name: 'inventory',
    label: 'Inventory',
    schema: InventorySchema,
    class: Inventory,
  },
  'routing-order': {
    name: 'order',
    label: 'Order',
    schema: RoutingOrderSchema,
    class: RoutingOrder,
  },
  'default': {
    name: 'default',
    label: 'Default',
    schema: InventorySchema,
    class: DefaultEntity,
  },
};

export const namespaces: Namespaces = {
  sandbox: {
    name: 'Sandbox',
    type: 'sandbox',
    label: 'Sandbox Playground',
    entities: [
      entities['sandbox-user'],
      entities['sandbox-bill'],
      entities['sandbox-test']
    ],
  },
  routing: {
    name: 'Routing',
    type: 'routing',
    label: 'Order Routing',
    entities: [
      entities['routing-order'],
    ],
  },
  billing: {
    name: 'Billing',
    type: 'billing',
    label: 'Order Billing',
    entities: [
      entities['billing-order'],
    ],
  },
  inventory: {
    name: 'Inventory',
    type: 'inventory',
    label: 'Inventory',
    entities: [
      entities['inventory'],
    ],
  },
  meshdata: {
    name: 'MeshData Demo',
    type: 'meshdata',
    label: 'MeshData Demo',
    entities: [
      entities['default'],
    ],
  },
  meshflow: {
    name: 'MeshFlow Demo',
    type: 'meshflow',
    label: 'MeshFlow Demo',
    entities: [
      entities['default'],
    ],
  },
};

//associates each database with the app (namespaces) we wish to deploy
//these will be installed once the points of presence connect and
//it is discovered by one of the engines that the backend hasn't been set up 
export const profiles: Profiles = {
  redis: {
    db: dbs.redis,
    namespaces: {
      sandbox: namespaces.sandbox,
      routing: namespaces.routing,
      billing: namespaces.billing,
      inventory: namespaces.inventory,
      meshdata: namespaces.meshdata,
      meshflow: namespaces.meshflow,
    }
  },
  valkey: {
    db: dbs.valkey,
    namespaces: {
      sandbox: namespaces.sandbox,
      routing: namespaces.routing,
      billing: namespaces.billing,
      inventory: namespaces.inventory,
      meshdata: namespaces.meshdata,
      meshflow: namespaces.meshflow,
    }
  },
  dragonfly: {
    db: dbs.dragonfly,
    namespaces: {
      sandbox: namespaces.sandbox,
      routing: namespaces.routing,
      billing: namespaces.billing,
      inventory: namespaces.inventory,
      meshdata: namespaces.meshdata,
      meshflow: namespaces.meshflow,
    }
  },
};

/**
 * Initialize each profile (p) with a db that is properly configured,
 * with a valid (non-empty) 'REDIS_HOST' property. For each db, the set of namespaces
 * declared in the profile will be initialized, using the abbreviation in Redis
 * to save space (e.g., 's' for Sandbox).
 * @param p - the profiles to initialize
 */
export const init = async (p = profiles) => {
  for(let key in p) {
    const profile = p[key];
    if (profile.db.config.REDIS_HOST) {
      console.log(`!!Initializing ${profile.db.name} [${key}]...`);
      profile.instances = {};
      for(let ns in profile.namespaces) {
        const namespace = profile.namespaces[ns];
        console.log(`  - ${ns}: ${namespace.label}`);
        let pinstances = profile.instances[ns];
        if (!pinstances) {
          pinstances = {};
          profile.instances[ns] = pinstances;
        }
        for(let entity of namespace.entities) {
          console.log(`    - ${entity.name}: ${entity.label}`);
          const instance = pinstances[entity.name] = new entity.class(ns, namespace.type, profile.db.config);
          await instance.init(profile.db.search);
        }
      }
    }
  }
};

/**
 * Find the entity class instance by database, namespace, and entity name. The database
 * is required, but the namespace and entity name are optional, depending on the use case.
 * 
 * @param {string} database - For example, 'valkey'
 * @param {string} namespace - For example, 's' for 'sandbox'
 * @param {string} entity - For example, 'order'
 * @returns {EntityInstanceTypes | undefined}
 */
export const findEntity = (database: string, namespace: string, entity: string): EntityInstanceTypes | undefined => {
  if (!database || !profiles[database] || !profiles[database]?.db?.config?.REDIS_HOST) {
    const activeProfiles = Object.keys(profiles).filter((key) => profiles[key]?.db?.config?.REDIS_HOST);
    throw new Error(`The database query parameter [${database}] was not found. Use one of: ${activeProfiles.join(', ')}`);
  }

  if (!namespace || !profiles[database]?.instances?.[namespace]) {
    const activeNamespaces = Object.keys(profiles[database]?.instances ?? {});
    throw new Error(`The namespace query parameter [${namespace}] was not found. Use one of: ${activeNamespaces.join(', ')}`);
  }

  const entities = profiles[database]?.instances?.[namespace] ?? {};
  if (!entity || entity?.startsWith('-') || entity === '*') {
    entity = Object.keys(entities)[0];
  } else if (entity?.endsWith('*')) {
    entity = entity.slice(0, -1);
  }

  const target = profiles[database]?.instances?.[namespace]?.[entity] as EntityInstanceTypes | undefined;
  if (!target) {
    console.error(`Entity not found: ${database}.${namespace}.${entity}`);
    entity = Object.keys(entities)[0];
    return profiles[database]?.instances?.[namespace]?.[entity] as EntityInstanceTypes | undefined;
  }
  return target;
};

export const findSchemas = (database: string, ns: string): Record<string, Types.WorkflowSearchSchema> => {
  if (!database || !profiles[database] || !profiles[database]?.db?.config?.REDIS_HOST) {
    const activeProfiles = Object.keys(profiles).filter((key) => profiles[key]?.db?.config?.REDIS_HOST);
    throw new Error(`The database query parameter [${database}] was not found. Use one of: ${activeProfiles.join(', ')}`);
  }
  const profile = profiles[database];
  const namespacedInstance = profile.instances[ns];
  const schemas: Record<string, Types.WorkflowSearchSchema> = {};
  for(let entityName in namespacedInstance) {
    const entityInstance = namespacedInstance[entityName];
    const opts = entityInstance.getSearchOptions();
    schemas[opts.index ?? entityName] = opts.schema;
  }
  return schemas;
}

/**
 * Safely serialize the manifest for transmission to the client.
 */
export const toJSON = (p: Profiles = profiles): any => {
  const result: any = {};
  for(let key in p) {
    const profile = p[key];
    if (!profile.db.config.REDIS_HOST) {
      continue;
    } else {
      result[key] = {
        db: { ...profile.db, config: undefined },
        namespaces: {},
      };
    }
    for(let ns in profile.namespaces) {
      const namespace = profile.namespaces[ns];
      result[key].namespaces[ns] = {
        name: namespace.name,
        label: namespace.label,
        entities: [],
      };
      for(let entity of namespace.entities) {
        result[key].namespaces[ns].entities.push({
          name: entity.name,
          label: entity.label,
        });
      }
    }
  }
  return result;
};
