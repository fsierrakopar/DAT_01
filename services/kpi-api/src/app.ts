import express from 'express';
import { healthRouter } from './routes/health.routes.js';

// Crea la app sin abrir un puerto, para que las pruebas puedan usarla directamente.
export function createApp() {
  const app = express();
  app.use(healthRouter);
  return app;
}
