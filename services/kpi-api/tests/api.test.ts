import request from 'supertest';
import { describe, it, expect } from 'vitest';
import { createApp } from '../src/app.js';

// Supertest envía peticiones a la app en memoria, sin abrir un puerto real (spec 001, sección 9.2).
const app = createApp();

describe('GET /health', () => {
  it('responde 200 con status "ok"', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(Number.isInteger(res.body.uptimeSeconds)).toBe(true);
  });
});

describe('Cabeceras de respuesta', () => {
  it('no incluye X-Powered-By (sección 6.7)', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});
