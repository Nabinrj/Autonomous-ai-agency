import assert from 'node:assert/strict';
import test from 'node:test';
import { buildApp } from '../src/app.js';

test('GET /health returns service health', async () => {
  const app = buildApp();

  const response = await app.inject({
    method: 'GET',
    url: '/health'
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), {
    data: {
      status: 'ok',
      service: 'autonomous-ai-agency-backend'
    }
  });

  await app.close();
});

test('GET /api/v1 returns API metadata', async () => {
  const app = buildApp();

  const response = await app.inject({
    method: 'GET',
    url: '/api/v1'
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json().data.version, 'v1');

  await app.close();
});
