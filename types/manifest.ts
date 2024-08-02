import { Types } from '@hotmeshio/hotmesh';

import { Bill } from '../meshdata/namespaces/sandbox/bill';
import { Test } from '../meshdata/namespaces/sandbox/test';
import { User } from '../meshdata/namespaces/sandbox/user';
import { Order as BillingOrder } from '../meshdata/namespaces/billing/order';
import { Order as RoutingOrder } from '../meshdata/namespaces/routing/order';
import { Inventory } from '../meshdata/namespaces/inventory';
import { DefaultEntity } from '../meshdata/namespaces/default';

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

export type EntityClassTypes = typeof BillingOrder | typeof RoutingOrder | typeof Inventory | typeof User | typeof Bill | typeof Test | typeof DefaultEntity;
export type EntityInstanceTypes = BillingOrder | RoutingOrder | Inventory | User | Bill | Test;

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
