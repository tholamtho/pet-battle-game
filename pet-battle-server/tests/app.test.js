import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

// These run without a database: they only hit code paths that stop before any query.
describe('http layer', () => {
  it('GET /health', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('rejects protected routes without a token', async () => {
    const res = await request(app).get('/api/v1/pets');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('validates register body', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({ username: 'a', password: 'short' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns JSON 404 for unknown routes', async () => {
    const res = await request(app).get('/nope');
    expect(res.status).toBe(404);
  });
});
