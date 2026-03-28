'use strict';

const repo = require('../repositories/diagram.admin.repo');
const { NotFoundError, BadRequestError } = require('../../utils/errors');

module.exports = async (fastify) => {
  const auth = { preHandler: [fastify.verifyAdminKey] };

  // GET /v1/admin/diagrams?search=jvm&type=svg
  fastify.get('/', auth, async (req) => {
    const { search, type } = req.query ?? {};
    const diagrams = await repo.findAll(fastify.db, { search, type });
    return { diagrams: diagrams.map(formatDiagram) };
  });

  // GET /v1/admin/diagrams/:key
  fastify.get('/:key', auth, async (req) => {
    const d = await repo.findByKey(fastify.db, req.params.key);
    if (!d) throw new NotFoundError(`Diagram not found: ${req.params.key}`);
    return { diagram: formatDiagram(d) };
  });

  // POST /v1/admin/diagrams
  // Body: { diagramKey, title, type, data: { svg | source | url } }
  fastify.post('/', auth, async (req, reply) => {
    const { diagramKey, title, type, data } = req.body ?? {};
    if (!diagramKey) throw new BadRequestError('diagramKey is required');
    if (!type || !['svg', 'mermaid', 'png'].includes(type)) {
      throw new BadRequestError('type must be svg | mermaid | png');
    }
    if (!data || typeof data !== 'object') {
      throw new BadRequestError('data object is required');
    }
    const d = await repo.create(fastify.db, { diagramKey, title, type, data });
    return reply.status(201).send({ diagram: formatDiagram(d) });
  });

  // PUT /v1/admin/diagrams/:key
  fastify.put('/:key', auth, async (req) => {
    const d = await repo.update(fastify.db, req.params.key, req.body ?? {});
    if (!d) throw new NotFoundError(`Diagram not found: ${req.params.key}`);
    return { diagram: formatDiagram(d) };
  });

  // DELETE /v1/admin/diagrams/:key
  fastify.delete('/:key', auth, async (req) => {
    const d = await repo.remove(fastify.db, req.params.key);
    if (!d) throw new NotFoundError(`Diagram not found: ${req.params.key}`);
    return { deleted: d.diagram_key };
  });
};

const formatDiagram = (r) => ({
  id: r.id, diagramKey: r.diagram_key, title: r.title,
  type: r.type, data: r.data, meta: r.meta,
  createdAt: r.created_at, updatedAt: r.updated_at,
});
