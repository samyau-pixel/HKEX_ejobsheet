import request from 'supertest';
import app from '../../src/app.js';
import { initializeDatabase } from '../../src/db/schema.js';
import { seedDatabase } from '../../src/db/seed.js';
import { AuthService } from '../../src/services/auth.service.js';

beforeAll(async () => {
  await initializeDatabase();
  await seedDatabase();
});

describe('Contract: Template Creation', () => {
  let managerToken: string;

  beforeAll(async () => {
    const manager = { id: 'user-manager-001', email: 'manager@test.com', name: 'Jane Manager', role: 'Manager' };
    const operator = { id: 'user-operator-001', email: 'operator@test.com', name: 'Alice Operator', role: 'Operator' };
    managerToken = AuthService.generateToken(manager as any);
    AuthService.generateToken(operator as any);
  });

  test('requires authorization', async () => {
    const res = await request(app).post('/api/templates').send({});
    expect(res.status).toBe(401);
  });

  test('requires valid template data', async () => {
    const res = await request(app)
      .post('/api/templates')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({});

    expect(res.status).toBe(422);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  test('requires at least one job', async () => {
    const res = await request(app)
      .post('/api/templates')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ name: 'Test Template', jobs: [] });

    expect(res.status).toBe(422);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  test('requires at least one procedure per job', async () => {
    const res = await request(app)
      .post('/api/templates')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ 
        name: 'Test Template', 
        jobs: [{ name: 'Job 1', order: 1, procedures: [] }] 
      });

    expect(res.status).toBe(422);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  test('creates template successfully with valid data', async () => {
    const createInput = {
      name: 'Contract Test Template',
      description: 'Test template for contract validation',
      jobs: [
        { 
          name: 'Job 1', 
          order: 1, 
          procedures: [{ name: 'Procedure 1', order: 1, description: 'Test procedure' }] 
        },
        { 
          name: 'Job 2', 
          order: 2, 
          procedures: [
            { name: 'Procedure 2.1', order: 1 },
            { name: 'Procedure 2.2', order: 2 }
          ] 
        }
      ]
    };

    const res = await request(app)
      .post('/api/templates')
      .set('Authorization', `Bearer ${managerToken}`)
      .send(createInput);

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Contract Test Template');
    expect(res.body.data.state).toBe('Pending');
    expect(res.body.data.jobs).toHaveLength(2);
    expect(res.body.data.jobs[0].procedures).toHaveLength(1);
    expect(res.body.data.jobs[1].procedures).toHaveLength(2);
  });
});

describe('Integration: Template Creation Workflow', () => {
  let managerToken: string;
  let operatorToken: string;
  let operatorLeaderToken: string;

  beforeAll(async () => {
    const manager = { id: 'user-manager-001', email: 'manager@test.com', name: 'Jane Manager', role: 'Manager' };
    const operator = { id: 'user-operator-001', email: 'operator@test.com', name: 'Alice Operator', role: 'Operator' };
    const operatorLeader = { id: 'user-leader-001', email: 'leader@test.com', name: 'John Leader', role: 'OperatorLeader' };
    managerToken = AuthService.generateToken(manager as any);
    operatorToken = AuthService.generateToken(operator as any);
    operatorLeaderToken = AuthService.generateToken(operatorLeader as any);
  });

  test('Manager can create template', async () => {
    const createInput = {
      name: 'Manager Created Template',
      jobs: [
        { 
          name: 'Job 1', 
          order: 1, 
          procedures: [{ name: 'Proc 1', order: 1 }] 
        }
      ]
    };

    const res = await request(app)
      .post('/api/templates')
      .set('Authorization', `Bearer ${managerToken}`)
      .send(createInput);

    expect(res.status).toBe(201);
    expect(res.body.data.user_id).toBe('user-manager-001');
  });

  test('OperatorLeader can create template', async () => {
    const createInput = {
      name: 'OperatorLeader Created Template',
      jobs: [
        { 
          name: 'Job 1', 
          order: 1, 
          procedures: [{ name: 'Proc 1', order: 1 }] 
        }
      ]
    };

    const res = await request(app)
      .post('/api/templates')
      .set('Authorization', `Bearer ${operatorLeaderToken}`)
      .send(createInput);

    expect(res.status).toBe(201);
    expect(res.body.data.user_id).toBe('user-leader-001');
  });

  test('Operator cannot create template - returns 403', async () => {
    const createInput = {
      name: 'Operator Template',
      jobs: [
        { 
          name: 'Job 1', 
          order: 1, 
          procedures: [{ name: 'Proc 1', order: 1 }] 
        }
      ]
    };

    const res = await request(app)
      .post('/api/templates')
      .set('Authorization', `Bearer ${operatorToken}`)
      .send(createInput);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  test('template persists with correct state', async () => {
    const createInput = {
      name: 'Persistence Test Template',
      jobs: [
        { 
          name: 'Job 1', 
          order: 1, 
          procedures: [{ name: 'Proc 1', order: 1 }] 
        }
      ]
    };

    const createRes = await request(app)
      .post('/api/templates')
      .set('Authorization', `Bearer ${managerToken}`)
      .send(createInput);

    const templateId = createRes.body.data.id;

    const getRes = await request(app)
      .get(`/api/templates/${templateId}`)
      .set('Authorization', `Bearer ${managerToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.state).toBe('Pending');
    expect(getRes.body.data.jobs[0].procedures[0].name).toBe('Proc 1');
  });
});
