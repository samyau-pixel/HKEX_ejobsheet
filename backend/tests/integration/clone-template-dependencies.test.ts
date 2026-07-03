describe.skip('clone template dependencies (integration)', () => {
  test('cloned execution jobs should include resolved prerequisite_job_ids', async () => {
    // Integration test placeholder - requires DB and server environment
  });
});
import request from 'supertest';
import app from '../../src/app.js';
import { initializeDatabase } from '../../src/db/schema.js';
import { seedDatabase } from '../../src/db/seed.js';
import { AuthService } from '../../src/services/auth.service.js';
import { TemplateService } from '../../src/services/template.service.js';

beforeAll(async () => {
  await initializeDatabase();
  await seedDatabase();
  // Disable foreign key checks for tests that create dynamic data
  const db = require('../../src/db/schema.js').getDatabase();
  db.run('PRAGMA foreign_keys = OFF');
});

describe('Integration: clone template dependencies', () => {
  test('execution jobs preserve prerequisite template job ids', async () => {
    const manager = { id: 'user-manager-002', email: 'mgr2@test.com', name: 'Mgr Two', role: 'Manager' };
    const operator = { id: 'user-operator-002', email: 'op2@test.com', name: 'Op Two', role: 'Operator' };

    const createInput = {
      name: 'Dep Template',
      jobs: [
        { name: 'Job A', order: 1, procedures: [{ name: 'Proc A1', order: 1 }] },
        { name: 'Job B', order: 2, prerequisiteOrders: [1], procedures: [{ name: 'Proc B1', order: 1 }] },
      ],
    };

    // Create template as manager
    const template = await TemplateService.createTemplate(manager.id, createInput);
    // Approve template
    await TemplateService.approveTemplate(template.id);

    const operatorToken = AuthService.generateToken(operator as any);

    const res = await request(app)
      .post('/api/execution-sheets')
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({ templateId: template.id, name: 'Execution from Dep Template' });

    expect(res.status).toBe(201);
    const execution = res.body.data;

    const detailResp = await request(app)
      .get(`/api/execution-sheets/${execution.id}`)
      .set('Authorization', `Bearer ${operatorToken}`);

    expect(detailResp.status).toBe(200);
    const jobs = detailResp.body.data.jobs;
    
    // Find job B in the execution
    const jobBTemplateId = template.jobs?.find((j: any) => j.job_order === 2)?.id;
    const jobAId = template.jobs?.find((j: any) => j.job_order === 1)?.id;

    const jobB = jobs.find((j: any) => j.job_id === jobBTemplateId);
    expect(jobB).toBeDefined();
    const prereqRaw = jobB.prerequisite_job_ids || jobB.prerequisiteJobIds || null;
    let prereq: string[] = [];
    if (prereqRaw) {
      try { prereq = Array.isArray(prereqRaw) ? prereqRaw : JSON.parse(prereqRaw); } catch (e) { prereq = []; }
    }

    expect(prereq).toContain(jobAId);
  });
});
