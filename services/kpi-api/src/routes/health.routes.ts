import { Router } from 'express';

export const healthRouter = Router();

// GET /health: indica que el servicio está activo. Lo usará el HEALTHCHECK de Docker.
healthRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptimeSeconds: Math.floor(process.uptime()) });
});
