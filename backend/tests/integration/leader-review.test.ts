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

describe('Integration: Leader Review API', () => {
  let operatorToken: string;
  let leaderToken: string;
  let executionId: string;
  let jobId: string;

  beforeAll(async () => {
    // Get operator and leader tokens
    const operator = { id: 'user-operator-001', email: 'operator@test.com', name: 'Alice Operator', role: 'Operator' };
    const leader = { id: 'user-manager-001', email: 'manager@test.com', name: 'Jane Manager', role: 'Manager' };

    operatorToken = AuthService.generateToken(operator as any);
    leaderToken = AuthService.generateToken(leader as any);

    // Create an execution sheet
    const createInput = {
      name: 'Integration Test Template',
      jobs: [
        { name: 'Job 1', order: 1, procedures: [{ name: 'Procedure 1', order: 1 }] },
        { name: 'Job 2', order: 2, procedures: [{ name: 'Procedure 2', order: 1 }] },
      ],
    };

    const template = await TemplateService.createTemplate(operator.id, createInput);
    await TemplateService.approveTemplate(template.id);

    const execRes = await request(app)
      .post('/api/execution-sheets')
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({ templateId: template.id, name: 'Test Execution' });

    executionId = execRes.body.data.id;
    
    // Get job ID from execution
    const detailRes = await request(app)
      .get(`/api/execution-sheets/${executionId}`)
      .set('Authorization', `Bearer ${operatorToken}`);

    jobId = detailRes.body.data.jobs[0].job_id;
  });

  describe('POST /api/execution-sheets/:id/jobs/:jobId/leader-review', () => {
    test('should successfully submit leader review with valid credentials', async () => {
      // First mark job as complete by operator
      await request(app)
        .post(`/api/execution-sheets/${executionId}/jobs/${jobId}/complete`)
        .set('Authorization', `Bearer ${operatorToken}`);

      const res = await request(app)
        .post(`/api/execution-sheets/${executionId}/jobs/${jobId}/leader-review`)
        .set('Authorization', `Bearer ${leaderToken}`)
        .send({
          userId: 'user-manager-001',
          password: 'password123'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.success).toBe(true);
      expect(res.body.message).toBe('Leader review recorded successfully');
    });

    test('should reject leader review with invalid password', async () => {
      const res = await request(app)
        .post(`/api/execution-sheets/${executionId}/jobs/${jobId}/leader-review`)
        .set('Authorization', `Bearer ${leaderToken}`)
        .send({
          userId: 'user-manager-001',
          password: 'wrongpassword'
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('AUTH_FAILED');
      expect(res.body.message).toBe('Invalid password');
    });

    test('should reject leader review without authentication', async () => {
      const res = await request(app)
        .post(`/api/execution-sheets/${executionId}/jobs/${jobId}/leader-review`)
        .send({
          userId: 'user-manager-001',
          password: 'password123'
        });

      expect(res.status).toBe(401);
    });

    test('should reject leader review for non-completed job', async () => {
      // Create a new job completion that's not marked complete
      const newJobId = 'test-job-not-complete';
      
      const res = await request(app)
        .post(`/api/execution-sheets/${executionId}/jobs/${newJobId}/leader-review`)
        .set('Authorization', `Bearer ${leaderToken}`)
        .send({
          userId: 'user-manager-001',
          password: 'password123'
        });

      // Should fail because job is not completed
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('GET /api/execution-sheets/:id/jobs/:jobId/leader-review', () => {
    test('should return leader review status for reviewed job', async () => {
      const res = await request(app)
        .get(`/api/execution-sheets/${executionId}/jobs/${jobId}/leader-review`)
        .set('Authorization', `Bearer ${operatorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.leader_reviewed).toBeDefined();
      expect(res.body.data.leader_reviewed_by).toBeDefined();
      expect(res.body.data.leader_reviewed_at).toBeDefined();
    });

    test('should return not reviewed status for unreviewed job', async () => {
      // Create a new job
      const newJobId = 'test-job-new';
      
      const res = await request(app)
        .get(`/api/execution-sheets/${executionId}/jobs/${newJobId}/leader-review`)
        .set('Authorization', `Bearer ${operatorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.leader_reviewed).toBe(false);
      expect(res.body.data.leader_reviewed_by).toBeNull();
      expect(res.body.data.leader_reviewed_at).toBeNull();
    });
  });

  describe('GET /api/execution-sheets/:id/leader-review-summary', () => {
    test('should return summary with all jobs reviewed', async () => {
      // Review all jobs first
      const detailRes = await request(app)
        .get(`/api/execution-sheets/${executionId}`)
        .set('Authorization', `Bearer ${operatorToken}`);

      const jobs = detailRes.body.data.jobs;
      
      for (const job of jobs) {
        // Mark complete
        await request(app)
          .post(`/api/execution-sheets/${executionId}/jobs/${job.job_id}/complete`)
          .set('Authorization', `Bearer ${operatorToken}`);
        
        // Review
        await request(app)
          .post(`/api/execution-sheets/${executionId}/jobs/${job.job_id}/leader-review`)
          .set('Authorization', `Bearer ${leaderToken}`)
          .send({
            userId: 'user-manager-001',
            password: 'password123'
          });
      }

      const res = await request(app)
        .get(`/api/execution-sheets/${executionId}/leader-review-summary`)
        .set('Authorization', `Bearer ${operatorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.allReviewed).toBe(true);
      expect(res.body.data.pendingCount).toBe(0);
      expect(res.body.data.reviewedCount).toBe(jobs.length);
      expect(res.body.data.reviews.length).toBe(jobs.length);
    });

    test('should return summary with pending reviews', async () => {
      // Create a new execution with multiple jobs
      const createInput = {
        name: 'Test Template for Pending',
        jobs: [
          { name: 'Job A', order: 1, procedures: [{ name: 'Proc A', order: 1 }] },
          { name: 'Job B', order: 2, procedures: [{ name: 'Proc B', order: 1 }] },
        ],
      };

      const operator = { id: 'user-operator-001', email: 'operator@test.com', name: 'Alice Operator', role: 'Operator' };
      const template = await TemplateService.createTemplate(operator.id, createInput);
      await TemplateService.approveTemplate(template.id);

      const execRes = await request(app)
        .post('/api/execution-sheets')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ templateId: template.id, name: 'Test Pending' });

      const testExecId = execRes.body.data.id;
      const testJobs = (await request(app)
        .get(`/api/execution-sheets/${testExecId}`)
        .set('Authorization', `Bearer ${operatorToken}`)).body.data.jobs;

      // Mark both complete
      for (const job of testJobs) {
        await request(app)
          .post(`/api/execution-sheets/${testExecId}/jobs/${job.job_id}/complete`)
          .set('Authorization', `Bearer ${operatorToken}`);
      }

      // Review only first job
      await request(app)
        .post(`/api/execution-sheets/${testExecId}/jobs/${testJobs[0].job_id}/leader-review`)
        .set('Authorization', `Bearer ${leaderToken}`)
        .send({
          userId: 'user-manager-001',
          password: 'password123'
        });

      const res = await request(app)
        .get(`/api/execution-sheets/${testExecId}/leader-review-summary`)
        .set('Authorization', `Bearer ${operatorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.allReviewed).toBe(false);
      expect(res.body.data.pendingCount).toBe(1);
      expect(res.body.data.reviewedCount).toBe(1);
    });
  });

  describe('POST /api/execution-sheets/:id/complete (with leader review validation)', () => {
    test('should block completion when leader reviews pending', async () => {
      // Create new execution
      const createInput = {
        name: 'Test Block Completion',
        jobs: [
          { name: 'Job Block 1', order: 1, procedures: [{ name: 'Proc Block 1', order: 1 }] },
          { name: 'Job Block 2', order: 2, procedures: [{ name: 'Proc Block 2', order: 1 }] },
        ],
      };

      const operator = { id: 'user-operator-001', email: 'operator@test.com', name: 'Alice Operator', role: 'Operator' };
      const template = await TemplateService.createTemplate(operator.id, createInput);
      await TemplateService.approveTemplate(template.id);

      const execRes = await request(app)
        .post('/api/execution-sheets')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ templateId: template.id, name: 'Test Block' });

      const blockExecId = execRes.body.data.id;
      const blockJobs = (await request(app)
        .get(`/api/execution-sheets/${blockExecId}`)
        .set('Authorization', `Bearer ${operatorToken}`)).body.data.jobs;

      // Mark both complete but don't review
      for (const job of blockJobs) {
        await request(app)
          .post(`/api/execution-sheets/${blockExecId}/jobs/${job.job_id}/complete`)
          .set('Authorization', `Bearer ${operatorToken}`);
      }

      // Try to complete execution - should fail
      const res = await request(app)
        .post(`/api/execution-sheets/${blockExecId}/complete`)
        .set('Authorization', `Bearer ${operatorToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('PENDING_LEADER_REVIEWS');
      expect(res.body.message).toContain('pending review');
    });

    test('should allow completion when all leader reviews complete', async () => {
      // Create new execution
      const createInput = {
        name: 'Test Allow Completion',
        jobs: [
          { name: 'Job Allow 1', order: 1, procedures: [{ name: 'Proc Allow 1', order: 1 }] },
        ],
      };

      const operator = { id: 'user-operator-001', email: 'operator@test.com', name: 'Alice Operator', role: 'Operator' };
      const template = await TemplateService.createTemplate(operator.id, createInput);
      await TemplateService.approveTemplate(template.id);

      const execRes = await request(app)
        .post('/api/execution-sheets')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ templateId: template.id, name: 'Test Allow' });

      const allowExecId = execRes.body.data.id;
      const allowJobs = (await request(app)
        .get(`/api/execution-sheets/${allowExecId}`)
        .set('Authorization', `Bearer ${operatorToken}`)).body.data.jobs;

      // Mark complete and review
      await request(app)
        .post(`/api/execution-sheets/${allowExecId}/jobs/${allowJobs[0].job_id}/complete`)
        .set('Authorization', `Bearer ${operatorToken}`);

      await request(app)
        .post(`/api/execution-sheets/${allowExecId}/jobs/${allowJobs[0].job_id}/leader-review`)
        .set('Authorization', `Bearer ${leaderToken}`)
        .send({
          userId: 'user-manager-001',
          password: 'password123'
        });

      // Complete execution - should succeed
      const res = await request(app)
        .post(`/api/execution-sheets/${allowExecId}/complete`)
        .set('Authorization', `Bearer ${operatorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.state).toBe('Completed');
    });
  });

  describe('Leader review invalidation on job uncomplete', () => {
    test('should invalidate leader review when job is unmarked', async () => {
      const detailRes = await request(app)
        .get(`/api/execution-sheets/${executionId}`)
        .set('Authorization', `Bearer ${operatorToken}`);

      const testJobId = detailRes.body.data.jobs[1].job_id;

      // Mark complete and review
      await request(app)
        .post(`/api/execution-sheets/${executionId}/jobs/${testJobId}/complete`)
        .set('Authorization', `Bearer ${operatorToken}`);

      await request(app)
        .post(`/api/execution-sheets/${executionId}/jobs/${testJobId}/leader-review`)
        .set('Authorization', `Bearer ${leaderToken}`)
        .send({
          userId: 'user-manager-001',
          password: 'password123'
        });

      // Verify reviewed
      let statusRes = await request(app)
        .get(`/api/execution-sheets/${executionId}/jobs/${testJobId}/leader-review`)
        .set('Authorization', `Bearer ${operatorToken}`);

      expect(statusRes.body.data.leader_reviewed).toBe(true);

      // Unmark complete
      await request(app)
        .post(`/api/execution-sheets/${executionId}/jobs/${testJobId}/uncomplete`)
        .set('Authorization', `Bearer ${operatorToken}`);

      // Verify invalidated
      statusRes = await request(app)
        .get(`/api/execution-sheets/${executionId}/jobs/${testJobId}/leader-review`)
        .set('Authorization', `Bearer ${operatorToken}`);

      expect(statusRes.body.data.leader_reviewed).toBe(false);
      expect(statusRes.body.data.leader_reviewed_by).toBeNull();
    });
  });
});
