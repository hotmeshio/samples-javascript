import { Router } from 'express';

import { findEntity } from '../../meshdata/manifest';
import { Inventory } from '../../meshdata/namespaces/inventory';

const router = Router();

// Fetch search spec
router.get('/schema', async (req, res) => {
  try {
    const query = req.query as {database: string, namespace: string};
    const inventory = findEntity(query.database, query.namespace, 'inventory') as Inventory;
    res.json(inventory.getSearchOptions());
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// Add inventory
router.post('/', async (req, res) => {
  try {
    const query = req.query as {database: string, namespace: string};
    const inventory = findEntity(query.database, query.namespace, 'inventory') as Inventory;
    res.json(await inventory.add(req.body as Body));
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// Fetch all inventory (pagination)
router.get('/', async (req, res) => {
  try {
    const query = req.query as {database: string, namespace: string};
    const inventory = findEntity(query.database, query.namespace, 'inventory') as Inventory;
    res.status(201).send(await inventory.find([], 0, 100));
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// Fetch inventory
router.get('/:invtId', async (req, res) => {
  try {
    const { invtId } = req.params;
    const query = req.query as {database: string, namespace: string};
    const inventory = findEntity(query.database, query.namespace, 'inventory') as Inventory;
    res.status(200).send(await inventory.retrieve(invtId));
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// Update inventory
router.patch('/:invtId', async (req, res) => {
  const { invtId } = req.params;
  const updates = { ...req.body };
  let updatedUser: Record<string, any>;
  try {
    const query = req.query as {database: string, namespace: string};
    const inventory = findEntity(query.database, query.namespace, 'inventory') as Inventory;
    updatedUser = await inventory.update(invtId, req.body);
  } catch (err) {
    return res.status(500).send({ error: err.message });
  }
  res.status(200).send({ id: invtId, ...updates });
});


// Delete inventory
router.delete('/:invtId', async (req, res) => {
  try {
    const { invtId } = req.params;
    const query = req.query as {database: string, namespace: string};
    const inventory = findEntity(query.database, query.namespace, 'inventory') as Inventory;
    await inventory.delete(invtId);
    res.json({ status: 'success' });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// Aggregate inventory
router.post('/aggregate', async (req, res) => {
  try {
    const query = req.query as {database: string, namespace: string};
    const inventory = findEntity(query.database, query.namespace, 'inventory') as Inventory;
    res.json(await inventory.aggregate(req.body.filter, req.body.apply, req.body.rows, req.body.columns, req.body.reduce, req.body.sort, req.body.start, req.body.size));
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

export { router };
