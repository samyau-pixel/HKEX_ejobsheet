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

describe('Integration: execution dependency enforcement', () => {
  test('cannot complete dependent job before prerequisite', async () => {
    const operator = { id: 'user-operator-003', email: 'op3@test.com', name: 'Op Three', role: 'Operator' };

    const createInput = {
      name: 'Dep Exec Template',
      jobs: [
        { name: 'Job X', order: 1, procedures: [{ name: 'PX', order: 1 }] },
        { name: 'Job Y', order: 2, prerequisiteOrders: [1], procedures: [{ name: 'PY', order: 1 }] },
      ],
    };

    const template = await TemplateService.createTemplate(operator.id, createInput);
    await TemplateService.approveTemplate(template.id);

    const token = AuthService.generateToken(operator as any);

    const createRes = await request(app)
      .post('/api/execution-sheets')
      .set('Authorization', `Bearer ${token}`)
      .send({ templateId: template.id, name: 'Exec Dep Enforcement' });

    expect(createRes.status).toBe(201);
    const exec = createRes.body.data;

    // Check in to move state to Processing
    const checkInRes = await request(app)
      .post(`/api/execution-sheets/${exec.id}/check-in`)
      .set('Authorization', `Bearer ${token}`)
      .send();
    expect(checkInRes.status).toBe(200);

    // Attempt to complete Job Y (dependent) - should fail
    const jobYTemplateId = template.jobs?.find((j: any) => j.job_order === 2)?.id;
    const completeY = await request(app)
      .post(`/api/execution-sheets/${exec.id}/jobs/${jobYTemplateId}/complete`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(completeY.status).toBe(400);
    expect(completeY.body.code).toBe('PREREQUISITE_JOBS_INCOMPLETE');

    // Complete Job X first
    const jobXTemplateId = template.jobs?.find((j: any) => j.job_order === 1)?.id;
    const completeX = await request(app)
      .post(`/api/execution-sheets/${exec.id}/jobs/${jobXTemplateId}/complete`)
      .set('Authorization', `Bearer ${token}`)
      .send();
    expect(completeX.status).toBe(200);

    // Now complete Job Y
    const completeY2 = await request(app)
      .post(`/api/execution-sheets/${exec.id}/jobs/${jobYTemplateId}/complete`)
      .set('Authorization', `Bearer ${token}`)
      .send();
    expect(completeY2.status).toBe(200);
  });
});
