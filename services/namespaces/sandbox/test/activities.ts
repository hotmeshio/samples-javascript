import { Order } from '../order';
import OrderJSON from './seed.json';
import { findEntity } from '../../manifest';
 
/**
 * This proxied activity will call the order service.
 * This helps to distribute the load when seeding.
 */
const runTest = async (args: { count: number, groupId: string, database: string, namespace: string }): Promise<boolean> => {
  const { count, groupId, database, namespace } = args;

  for (let i = 0; i < count; i++) {
    const id = `ord_${groupId}.${i}`;
    const color = Math.random() > .25 ? true : false;
    const bleed = Math.random() > .75 ? true : false;
    try {
      const order = { ...OrderJSON, id, color, bleed };
      const orderInstance = findEntity(database, namespace, 'order') as Order;
      //const orderInstance = profiles.local.instances?.[namespace]?.['order'] as Order;
      await orderInstance?.add(order, false);
    } catch (error) {
      //assume the error is 404 due to crash and then resuming
      //not expensive as hsetnx will fail quickly
      console.error(`Error adding order ${id}: ${error.message}`)
    }
  }
  return true;
};

export { runTest };
