import { HotMesh, Types, MeshData } from '@hotmeshio/hotmesh';

import { BaseEntity } from '../../base';

import { schema as UserSchema } from './schema';
import * as workflows from './workflows'
import * as hooks from './hooks';

/**
 * The 'User' entity. Shows how Redis-backed governance is able to
 * create durable, transactional workflows using a reentrant
 * process architecture. While the main function stays open and
 * is actively part of the operational data layer (ODL), hook functions
 * can be interleaved that transactionally update primary state.
 * 
 */
class User extends BaseEntity {

  getEntity(): string {
    return 'user';
  }

  getTaskQueue(): string {
    return 'v1'
  }

  getSearchOptions(): Types.WorkflowSearchOptions {
    return {
      index: `${this.getNamespace()}-${this.getEntity()}`,
      prefix: [this.getEntity()],
      schema: UserSchema,
    };
  }

  /**
   * Connect workflow and hook functions (user and user.bill)
   */
  async connect() {
    //connect the 'user' transactional workflow
    await this.meshData.connect({
      entity: this.getEntity(),
      target: workflows.create,
      options: {
        namespace: this.getNamespace(),
        taskQueue: this.getTaskQueue(),
      },
    });

    //connect the 'user.bill' transactional hook
    await this.meshData.connect({
      entity: 'user.bill',
      target: hooks.bill,
      options: {
        namespace: this.getNamespace(),
        taskQueue: this.getTaskQueue(),
      },
    });
  }

  /**
   * Create User
   */
  async create(body: Record<string, any>) {
    const { id, email, first, last, plan, cycle } = body;

    //call the 'user' transactional workflow
    await this.meshData.exec<string>({
      entity: this.getEntity(),
      args: [id],
      options: {
        id,
        search: {
          data: {
            '$entity': this.getEntity(),
            active: 'true',
            id,
            email,
            first,
            last,
            plan: plan ?? 'starter',
            cycle: cycle ?? 'monthly',
            discount: '0',
          }
        },
        namespace: this.getNamespace(),
        taskQueue: this.getTaskQueue(),
        ttl: '100 years',
      }
    });

    //echo the job state (the created user)
    return await this.retrieve(id);
  }

  /**
   * Update user plan; spawns the 'user.bill' transactional hook (a
   * recurring monthly/yearly process)
   */
  async plan(id: string, data: { plan: string, cycle: string }): Promise<Record<string, any>> {
    //exit early if user not found
    await this.retrieve(id, true);
    const state = await this.meshData.get(
      this.getEntity(),
      id,
      {
        fields: ['plan', 'cycle'],
        namespace: this.getNamespace(),
      }
    );

    //exit early if no change
    if (state?.plan === data.plan && state?.cycle === data.cycle) {
      return {
        existing: state
      };
    }

    //run the 'user.bill' transactional hook workflow
    await this.meshData.hook({
      entity: this.getEntity(),
      id,
      hookEntity: `${this.getEntity()}.bill`,
      hookArgs: [HotMesh.guid(), data.plan, data.cycle],
      options: {
        namespace: this.getNamespace(),
        taskQueue: this.getTaskQueue(),
      },
    });

    return data;
  }
}

export { User, MeshData };
