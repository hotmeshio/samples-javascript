import { Types } from '@hotmeshio/hotmesh';

import { Bill } from '../services/namespaces/sandbox/bill';
import { Test } from '../services/namespaces/sandbox/test';
import { User } from '../services/namespaces/sandbox/user';
import { Order as BillingOrder } from '../services/namespaces/billing/order';
import { Order as RoutingOrder } from '../services/namespaces/routing/order';
import { Order as SandboxOrder } from '../services/namespaces/sandbox/order';
import { Inventory } from '../services/namespaces/inventory';
import { DefaultEntity } from '../services/namespaces/default';

export type DBConfig = {
  REDIS_DATABASE: number,
  REDIS_HOST: string | undefined,
  REDIS_PORT: number,
  REDIS_USERNAME: string,
  REDIS_PASSWORD: string,
  REDIS_USE_TLS: boolean,
};

export type DB = {
  name: string,
  label: string,
  search: boolean,
  config: DBConfig,
};

export type EntityClassTypes = typeof BillingOrder | typeof RoutingOrder | typeof SandboxOrder | typeof Inventory | typeof User | typeof Bill | typeof Test | typeof DefaultEntity;
export type EntityInstanceTypes = BillingOrder | RoutingOrder | SandboxOrder | Inventory | User | Bill | Test;

export type Entity = {
  name: string,
  label: string,
  schema: Types.WorkflowSearchSchema,
  class: EntityClassTypes,
};

export type Namespace = {
  name: string,
  type: string,
  label: string,
  entities: Entity[],
};

export type Namespaces = {
  [key: string]: Namespace
};

export type Instance = {
  [key/*entity name*/: string]: EntityInstanceTypes,
};

export type Instances = {
  [key/*namespace abbreviation*/: string]: Instance,
};

export type Profile = {
  db: DB,
  namespaces: Namespaces,
  instances?: Instances,
};

export type Profiles = {
  [key: string]: Profile
};
