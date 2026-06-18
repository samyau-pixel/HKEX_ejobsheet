import request from 'supertest';
import app from '../../src/app.js';
import { initializeDatabase } from '../../src/db/schema.js';
import { seedDatabase } from '../../src/db/seed.js';
import { AuthService } from '../../src/services/auth.service.js';

beforeAll(async () => {
  await initializeDatabase();
  await seedDatabase();
});

describe('Contract: POST /api/execution-sheets validation', () => {
  test('requires authorization', async () => {
    const res = await request(app).post('/api/execution-sheets').send({});
    expect(res.status).toBe(401);
  });

  test('missing templateId returns validation error 422', async () => {
    const operator = { id: 'user-operator-001', email: 'operator@test.com', name: 'Alice Operator', role: 'Operator' };
    const token = AuthService.generateToken(operator as any);

    const res = await request(app)
      .post('/api/execution-sheets')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(422);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });
});
