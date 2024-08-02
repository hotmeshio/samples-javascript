import { HotMesh, Types, MeshData } from '@hotmeshio/hotmesh';

import { BaseEntity } from '../../base';

import { schema as UserSchema } from './schema';
import * as workflows from './workflows'

/**
 * The 'User' entity. Shows how Redis-backed governance is able to
 * create durable, transactional workflows using a reentrant
 * process architecture. While the main function stays open and
 * is actively part of the operational data layer (ODL), hook functions
 * can be interleaved that transactionally update primary state.
 * 
 */
class User extends BaseEntity {

  static getTaskQueue(): string {
    return 'v1';
  }

  protected getTaskQueue(): string {
    return User.getTaskQueue();
  }

  static getEntity(): string {
    return 'user';
  }

  getEntity(): string {
    return User.getEntity();
  }

  getSearchOptions(): Types.WorkflowSearchOptions {
    return {
      index: `${this.getNamespace()}-${User.getEntity()}`,
      prefix: [User.getEntity()],
      schema: UserSchema,
    };
  }

  /**
   * Connect workflow and hook functions (user and user.bill)
   */
  async connect() {
    await this.meshData.connect({
      entity: User.getEntity(),
      target: workflows.create,
      options: {
        namespace: this.getNamespace(),
        taskQueue: 'v1',
      },
    });

    await this.meshData.connect({
      entity: `${User.getEntity()}.bill`,
      target: workflows.bill,
      options: {
        namespace: this.getNamespace(),
        taskQueue: 'v1',
      },
    });
  }

  //********** Web API Entry points ******************

  /**
   * Create User
   */
  async create(body: Record<string, any>) {
    const { id, email, first, last, plan, cycle } = body;

    await this.meshData.exec<string>({
      entity: User.getEntity(),
      args: [id],
      options: {
        id,
        search: {
          data: {
            '$entity': User.getEntity(),
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
        taskQueue: User.getTaskQueue(),
        ttl: '100 years',
      }
    });

    //echo the job state (the created user)
    return await this.retrieve(id);
  }

  /**
   * Save the user's chosen plan; trigger the `user.bill` hook (a 
   * recurring process that sends a bill every month or year, depending)
   */
  async plan(id: string, data: { plan: string, cycle: string }): Promise<Record<string, any>> {
    //exit early if user not found
    await this.retrieve(id, true);
    const state = await this.meshData.get(
      User.getEntity(),
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
      entity: User.getEntity(),
      id,
      hookEntity: `${User.getEntity()}.bill`,
      hookArgs: [HotMesh.guid(), data.plan, data.cycle],
      options: {
        namespace: this.getNamespace(),
        taskQueue: User.getTaskQueue(),
      },
    });

    return data;
  }
}

export { User, MeshData };
