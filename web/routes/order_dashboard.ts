import { Router } from 'express';
import { Order } from '../../services/namespaces/sandbox/order';
import { findEntity } from '../../services/namespaces/manifest';

const router = Router();

// Fetch search spec
router.get('/schema', async (req, res) => {
  try {
    const query = req.query as {database: string, namespace: string};
    const order = findEntity(query.database, query.namespace, 'order') as Order;
    res.json(order.getSearchOptions());
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// Add a new order
router.post('/', async (req, res) => {
  try {
    const query = req.query as {database: string, namespace: string};
    const order = findEntity(query.database, query.namespace, 'order') as Order;
    res.json(await order.add(req.body as Body));
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// Fetch all Orders (pagination)
router.get('/', async (req, res) => {
  try {
    const query = req.query as {database: string, namespace: string};
    const order = findEntity(query.database, query.namespace, 'order') as Order;
    res.status(201).send(await order.find([], 0, 100));
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// Fetch order
router.get('/:orderId', async (req, res) => {
  try {
    const query = req.query as {database: string, namespace: string};
    const order = findEntity(query.database, query.namespace, 'order') as Order;
    const { orderId } = req.params;
    res.status(200).send(await order.retrieve(orderId));
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// Update order
router.patch('/:orderId', async (req, res) => {
  const { orderId } = req.params;
  const updates = { ...req.body };
  let updatedUser: Record<string, any>;
  try {
    const query = req.query as {database: string, namespace: string};
    const order = findEntity(query.database, query.namespace, 'order') as Order;
    updatedUser = await order.update(orderId, req.body);
  } catch (err) {
    return res.status(500).send({ error: err.message });
  }
  res.status(200).send({ id: orderId, ...updates });
});


// Delete order
router.delete('/:orderId', async (req, res) => {
  try {
    const query = req.query as {database: string, namespace: string};
    const order = findEntity(query.database, query.namespace, 'order') as Order;
    const { orderId } = req.params;
    await order.delete(orderId);
    res.json({ status: 'success' });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// Aggregate orders
router.post('/aggregate', async (req, res) => {
  try {
    const query = req.query as {database: string, namespace: string};
    const order = findEntity(query.database, query.namespace, 'order') as Order;
    res.json(await order.aggregate(req.body.filter, req.body.apply, req.body.rows, req.body.columns, req.body.reduce, req.body.sort, req.body.start, req.body.size));
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

export { router };
