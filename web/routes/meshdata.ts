import { Router, Request, Response } from 'express';
import { Types } from '@hotmeshio/hotmesh';

import { GPT } from '../../services/ai/gpt'
import { findEntity, toJSON } from '../../services/namespaces/manifest';
const router = Router();

/**
 * Fetch the dashboard manifest. NOTE: The dashboard client surfaces multiple databases;
 * and each database can have multiple namespaces; and each namespace can have multiple entities.
 */
const getDashboardManifest = async (_: Request, res: Response) => {
  try {
    res.status(200).send({ manifest: toJSON() });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
};

router.get('/getManifest', getDashboardManifest);
router.post('/getManifest', getDashboardManifest);

router.post('/:method', async (req, res) => {
  const params = req.params as Types.StringAnyType;
  const data = req.body?.data;

  if (params.method === 'ask' && process.env.OPENAI_API_KEY) {
    try {
      const response = await GPT.ask(data.messages);
      return res.status(200).send(response);
    } catch (e) {
      return res.status(500).send({ error: e.message });
    }
  }

  const md = req.body?.metadata;
  const bAwait = md?.await ?? true;

  try {
    //resolve the target entity class (use namespace if provided)
    const entity = findEntity(md?.database, md?.namespace, md?.entity);

    //now that the target entity class is resolved, call the MeshData method (get, exec, etc)
    const meshDataMethod = entity?.meshData[params.method];
    if (!meshDataMethod) {
      return res.status(404).send({ error: `Method [meshData.${params.method}] not found` });
    }

    const args: any | Array<any> = Array.isArray(data) ? data : [data];
    const meshDataResponse = meshDataMethod.apply(entity.meshData, args);
    if (!bAwait) {
      return res.status(202).send({ status: 'accepted', method: params.method });
    }
    res.status(200).send(await meshDataResponse);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

export { router };
