import request from 'supertest';
import app from '../../src/app.js';
import { initializeDatabase } from '../../src/db/schema.js';
import { seedDatabase } from '../../src/db/seed.js';
import { AuthService } from '../../src/services/auth.service.js';
import { TemplateService } from '../../src/services/template.service.js';

beforeAll(async () => {
  await initializeDatabase();
  await seedDatabase();
});

describe('Integration: Execution creation flow', () => {
  test('creates execution from approved template', async () => {
    const operator = { id: 'user-operator-001', email: 'operator@test.com', name: 'Alice Operator', role: 'Operator' };
    const manager = { id: 'user-manager-001', email: 'manager@test.com', name: 'Jane Manager', role: 'Manager' };

    const createInput = {
      name: 'Integration Template A',
      jobs: [
        { name: 'Job A1', order: 1, procedures: [{ name: 'Proc A1', order: 1 }] },
      ],
    };

    const template = await TemplateService.createTemplate(operator.id, createInput);
    await TemplateService.approveTemplate(template.id);

    const token = AuthService.generateToken(operator as any);

    const res = await request(app)
      .post('/api/execution-sheets')
      .set('Authorization', `Bearer ${token}`)
      .send({ templateId: template.id, name: 'Exec for ' + template.name });

    expect(res.status).toBe(201);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.template_id).toBe(template.id);
  });

  test('rejects creation from unapproved template', async () => {
    const operator = { id: 'user-operator-001', email: 'operator@test.com', name: 'Alice Operator', role: 'Operator' };

    const createInput = {
      name: 'Integration Template B',
      jobs: [
        { name: 'Job B1', order: 1, procedures: [{ name: 'Proc B1', order: 1 }] },
      ],
    };

    const template = await TemplateService.createTemplate(operator.id, createInput);

    const token = AuthService.generateToken(operator as any);

    const res = await request(app)
      .post('/api/execution-sheets')
      .set('Authorization', `Bearer ${token}`)
      .send({ templateId: template.id });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('TEMPLATE_NOT_APPROVED');
  });
});
