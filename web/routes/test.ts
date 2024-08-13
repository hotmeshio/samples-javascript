import { Router } from 'express';
import { findEntity } from '../../meshdata/manifest';
import { Test } from '../../meshdata/namespaces/sandbox/test';
import { TestInput } from '../../types/test';

const router = Router();

// Fetch search spec
router.get('/schema', async (req, res) => {
  try {
    const query = req.query as {database: string, namespace: string};
    const test = findEntity(query.database, query.namespace, 'test') as Test;
    res.json(test.getSearchOptions());
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// Add a new test
router.post('/', async (req, res) => {
  try {
    const query = req.query as {database: string, namespace: string};
    const test = findEntity(query.database, query.namespace, 'test') as Test;
    let body = req.body as Partial<TestInput>;
    body.database = query.database;
    res.json(await test.start(body as TestInput));
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// add new point/s of presence (worker/engine)
router.post('/swarm', async (req, res) => {
  try {
    const query = req.query as {database: string, namespace: string};
    const test = findEntity(query.database, query.namespace, 'test') as Test;
    let body = req.body as { type: 'worker' | 'engine', count?: number };
    if (body.type === 'worker') {
      for (let i = 0; i < (body.count || 1); i++) {
        res.json(await test.deployWorker());
      }
    } else {
      for (let i = 0; i < (body.count || 1); i++) {
        res.json(await test.deployEngine());
      }
    }
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// Fetch all tests (pagination)
router.get('/', async (req, res) => {
  try {
    const query = req.query as {database: string, namespace: string};
    const test = findEntity(query.database, query.namespace, 'test') as Test;
    res.status(200).send(await test.find([], 0, 100));
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// Fetch a test
router.get('/:testId', async (req, res) => {
  try {
    const query = req.query as {database: string, namespace: string};
    const test = findEntity(query.database, query.namespace, 'test') as Test;
    const { testId } = req.params;
    res.status(200).send(await test.retrieve(testId));
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// Delete a test
router.delete('/:testId', async (req, res) => {
  try {
    const query = req.query as {database: string, namespace: string};
    const test = findEntity(query.database, query.namespace, 'test') as Test;
    const { testId } = req.params;
    await test.delete(testId);
    res.json({ status: 'success' });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// Aggregate tests
router.post('/aggregate', async (req, res) => {
  try {
    const query = req.query as {database: string, namespace: string};
    const test = findEntity(query.database, query.namespace, 'test') as Test;
    res.json(await test.aggregate(req.body.filter, req.body.apply, req.body.rows, req.body.columns, req.body.reduce, req.body.sort, req.body.start, req.body.size));
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

export { router };
