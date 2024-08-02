import { Router } from 'express';

import { findEntity } from '../../meshdata/manifest';
import { Bill } from '../../meshdata/namespaces/sandbox/bill';

const router = Router();

// Fetch search spec
router.get('/schema', async (req, res) => {
  try {
    const query = req.query as {database: string, namespace: string};
    const bill = findEntity(query.database, query.namespace, 'bill') as Bill;
    res.json(bill.getSearchOptions());
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// Fetch all bills (pagination)
router.get('/', async (req, res) => {
  try {
    const query = req.query as {database: string, namespace: string};
    const bill = findEntity(query.database, query.namespace, 'bill') as Bill;
    res.status(201).send(await bill.find([], 0, 100));
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// Fetch a bill
router.get('/:billId', async (req, res) => {
  try {
    const { billId } = req.params;
    const query = req.query as {database: string, namespace: string};
    const bill = findEntity(query.database, query.namespace, 'bill') as Bill;
    res.status(200).send(await bill.retrieve(billId));
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// Aggregate bills
router.post('/aggregate', async (req, res) => {
  try {
    const query = req.query as {database: string, namespace: string};
    const bill = findEntity(query.database, query.namespace, 'bill') as Bill;
    res.json(await bill.aggregate(req.body.filter, req.body.apply, req.body.rows, req.body.columns, req.body.reduce, req.body.sort, req.body.start, req.body.size));
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

export { router };
