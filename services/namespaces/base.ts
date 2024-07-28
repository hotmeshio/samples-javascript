import { MeshData, Types } from '@hotmeshio/hotmesh';
import * as Redis from 'redis';

import { arrayToHash } from '../utils/meshDataUtils';
import { DBConfig } from '../../types/manifest';

abstract class BaseEntity {
  meshData: MeshData;
  connected: boolean = false;
  namespace: string;
  namespaceType: string;

  constructor(namespace: string, namespaceType: string, config: DBConfig) {
    this.namespace = namespace;         //'s'
    this.namespaceType = namespaceType; //'sandbox'
    this.meshData = this.initializeMeshData(config);
  }

  protected abstract getEntity(): string;
  abstract getSearchOptions(): Types.WorkflowSearchOptions;
  protected abstract getTaskQueue(): string;

  private initializeMeshData(db_config: DBConfig): MeshData {
    return new MeshData(
      Redis,
      this.getRedisUrl(db_config),
      this.getSearchOptions()
    );
  }

  protected async defaultTargetFn(id: string): Promise<string> {
    return 'OK';
  }

  getNamespace() {
    return this.namespace;
  }

  getRedisUrl = (config: DBConfig) => {
    return { url: `redis${config.REDIS_USE_TLS ? 's' : ''}://${config.REDIS_USERNAME ?? ''}:${config.REDIS_PASSWORD}@${config.REDIS_HOST}:${config.REDIS_PORT}` };
  }

  //******************* ON-CONTAINER-STARTUP COMMANDS ********************

  async init(search = true) {
    await this.connect();
    //Redis backends with the FT.SEARCH module support search
    if (search) {
      await this.index();
    }
  }

  async connect() {
    this.connected = await this.meshData.connect({
      entity: this.getEntity(),
      target: this.defaultTargetFn,
      options: {
        namespace: this.getNamespace(),
        taskQueue: this.getTaskQueue(),
        ttl: '100 years',
      },
    });
  }

  /**
   * Create the search index
   */
  async index() {
    await this.meshData.createSearchIndex(this.getEntity(), { namespace: this.getNamespace() }, this.getSearchOptions());
  }

  //******************* ON-CONTAINER-SHUTDOWN COMMANDS ********************

  async shutdown() {
    await MeshData.shutdown();
  }

  /**
   * Safely serialize order data for storage in Redis
   * @param obj
   */
  safeData(obj: Record<string, any>) {
    return Object.keys(obj).reduce((acc, key: string) => {
      if (obj[key] !== undefined && obj[key] !== null) {
        acc[key as string] = obj[key].toString();
      }
      return acc;
    }, {} as Record<string, any>);
  }

  getIndexName() {
    return this.getSearchOptions().index;
  }

  /**
    * Retrieve entity by id
    * @param id
    * @returns
    * @throws
    */
  async retrieve(id: string, sparse = false) {
    const opts = this.getSearchOptions();
    const fields = sparse ? ['id'] : Object.keys(opts?.schema || {});

    const result = await this.meshData.get(this.getEntity(), id, { fields, namespace: this.getNamespace() });
    if (!result?.id) throw new Error(`${this.getEntity()} not found`);
    return result;
  }


  async update(id: string, body: Record<string, any>) {
    await this.retrieve(id);
    await this.meshData.set(
      this.getEntity(),
      id,
      {
        search: { data: body },
        namespace: this.getNamespace(),
      }
    );
    return await this.retrieve(id);
  }

  async delete(id: string) {
    await this.retrieve(id);
    await this.meshData.flush(this.getEntity(), id, this.getNamespace());
    return true;
  }

  async find(query: { field: string, is: '=' | '[]' | '>=' | '<=', value: string }[] = [], start = 0, size = 100): Promise<{ count: number; query: string; data: Types.StringStringType[]; }> {
    const opts = this.getSearchOptions();
    const response = await this.meshData.findWhere(
      this.getEntity(),
      {
        query,
        return: Object.keys(opts?.schema || {}),
        limit: { start, size },
        options: { namespace: this.getNamespace() },
      },
    ) as { count: number; query: string; data: Types.StringStringType[]; };
    return response;
  }

  /**
   * Count data
   */
  async count(query: { field: string, is: '=' | '[]' | '>=' | '<=', value: string }[]): Promise<number> {
    return await this.meshData.findWhere(
      this.getEntity(),
      {
        query,
        count: true,
        options: { namespace: this.getNamespace() },
      }) as number;
  }

  /**
   * Aggregate data
   */

  // TODO: replace size/start parameters with cursor API
  async aggregate(filter: { field: string, is: '=' | '[]' | '>=' | '<=', value: string }[] = [], apply: { expression: string, as: string }[] = [], rows: string[] = [], columns: string[] = [], reduce: { operation: string, as: string }[] = [], sort: { field: string, order: 'ASC' | 'DESC' }[] = [], start = 0, size = 100): Promise<any> {
    let command = ['FT.AGGREGATE', this.getIndexName() || 'default'];

    if (filter.length == 0) {
      command.push('*')
    } else {
      const opts = this.getSearchOptions();
      filter.forEach((q: any) => {
        const type: 'TAG' | 'NUMERIC' | 'TEXT' = opts?.schema?.[q.field]?.type ?? 'TEXT';
        switch (type) {
          case 'TAG':
            command.push(`@_${q.field}:{${q.value}}`);
            break;
          case 'TEXT':
            command.push(`@_${q.field}:${q.value}`);
            break;
          case 'NUMERIC':
            command.push(`@_${q.field}:[${q.start} ${q.end}]`);
            break;
        }
      });
    }

    apply.forEach((a: any) => {
      command.push('APPLY', a.expression, 'AS', a.as);
    });

    const groupBy = rows.concat(columns);

    if (groupBy.length > 0) {
      const opts = this.getSearchOptions();
      command.push('GROUPBY', `${groupBy.length}`);
      groupBy.forEach((g: any) => {
        if (opts?.schema?.[g]) {
          command.push(`@_${g}`);
        } else {
          command.push(`@${g}`);
        }
      });
    }

    const opts = this.getSearchOptions();
    reduce.forEach((r: any) => {
      const op = r.operation.toUpperCase();
      if (op == 'COUNT') {
        command.push('REDUCE', op, '0', 'AS', r.as ?? 'count');
      } else if (['COUNT_DISTINCT', 'COUNT_DISTINCTISH', 'SUM', 'AVG', 'MIN', 'MAX', 'STDDEV', 'TOLIST'].includes(op)) {
        const property = opts?.schema?.[r.property] ? `@_${r.property}` : `@${r.property}`;
        command.push('REDUCE', op, '1', property, 'AS', r.as ?? `${r.operation}_${r.property}`);
      }
    });

    if (sort.length > 0) {
      command.push('SORTBY', `${2 * sort.length}`);
      sort.forEach((s: any) => {
        const field = opts?.schema?.[s.field] ? `@_${s.field}` : `@${s.field}`;
        command.push(field, s.order.toUpperCase() || 'DESC');
      });
    }

    try {
      const results = await this.meshData.find(
        this.getEntity(),
        { 
          index: this.getIndexName(),
          namespace: this.getNamespace(),
          taskQueue: this.getTaskQueue(),
          search: this.getSearchOptions()
        },
        ...command,
      );

      return {
        count: results[0],
        query: command.join(' '),
        data: arrayToHash(results as [number, ...(string | string[])[]])
      };
    } catch (e) {
      console.error({ query: command.join(' '), error: e.message });

      throw e;
    }
  }

  /**
   * Transforms the keys of a flat JSON object using a provided symbol mapping.
   * @param obj The object to transform.
   * @param sym The symbol mapping object that maps shorthand keys to their full names.
   * @returns A new object with transformed keys.
   */
  transformKeys(obj: any, sym: Record<string, string>): any {
    const reversedSym = {};
    for (const key in sym) {
      if (sym.hasOwnProperty(key)) {
        reversedSym[sym[key]] = key; // Reverse the key-value pair
      }
    }
    const transformed = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const expandedKey = reversedSym[key] || key;  // Use the expanded key if available, else use the original key
        if (expandedKey.includes('/')) {
          // Handle nested keys
          const parts = expandedKey.split('/');
          let current = transformed;
          for (let i = 0; i < parts.length - 1; i++) {
            current[parts[i]] = current[parts[i]] || {}; // Create nested object if it doesn't exist
            current = current[parts[i]];
          }
          current[parts[parts.length - 1]] = obj[key];
        } else {
          transformed[expandedKey] = obj[key];
        }
      }
    }
    return transformed;
  }

  workflow = {}
}

export { BaseEntity };
