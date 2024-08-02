import { Router } from 'express';

import { Socket } from '../utils/socket';
import { findEntity } from '../../meshdata/manifest';
import { User } from '../../meshdata/namespaces/sandbox/user';

const router = Router();

// Fetch search spec
router.get('/schema', async (req, res) => {
  try {
    const query = req.query as {database: string, namespace: string};
    const user = findEntity(query.database, query.namespace, 'user') as User;
    res.json(user.getSearchOptions());
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// Add a new user
router.post('/', async (req, res) => {
  try {
    const query = req.query as {database: string, namespace: string};
    const user = findEntity(query.database, query.namespace, 'user') as User;
    res.json(await user.create(req.body as Body));
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// Fetch all users (pagination)
router.get('/', async (req, res) => {
  try {
    const query = req.query as {database: string, namespace: string};
    const user = findEntity(query.database, query.namespace, 'user') as User;
    res.status(200).send(await user.find([], 0, 100));
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// Fetch a user
router.get('/:userId', async (req, res) => {
  try {
    const query = req.query as {database: string, namespace: string};
    const user = findEntity(query.database, query.namespace, 'user') as User;
    const { userId } = req.params;
    res.status(200).send(await user.retrieve(userId));
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

//sets the user's plan; establishes transactional recurring billing
router.patch('/:userId/plans', async (req, res) => {
  try {
    const query = req.query as {database: string, namespace: string};
    const user = findEntity(query.database, query.namespace, 'user') as User;
    const { userId } = req.params;
    res.status(200).send(await user.plan(userId, req.body));
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// Update a user
router.patch('/:userId', async (req, res) => {
  const { userId } = req.params;
  const updates = { ...req.body };
  let updatedUser: Record<string, any>;
  try {
    const query = req.query as {database: string, namespace: string};
    const user = findEntity(query.database, query.namespace, 'user') as User;
    updatedUser = await user.update(userId, req.body);
  } catch (err) {
    return res.status(500).send({ error: err.message });
  }

  Socket.broadcast('mesh.planes.control', {
    data: updatedUser,
    metadata: {
      timestamp: Date.now(),
      statusCode: 200,
      status: 'success'
    }
  });

  res.status(200).send({ id: userId, ...updates });
});

// Delete a user
router.delete('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const query = req.query as {database: string, namespace: string};
    const user = findEntity(query.database, query.namespace, 'user') as User;
    await user.delete(userId);
    res.json({ status: 'success' });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// Aggregate users
router.post('/aggregate', async (req, res) => {
  try {
    const query = req.query as {database: string, namespace: string};
    const user = findEntity(query.database, query.namespace, 'user') as User;
    res.json(await user.aggregate(req.body.filter, req.body.apply, req.body.rows, req.body.columns, req.body.reduce, req.body.sort, req.body.start, req.body.size));
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

export { router };
