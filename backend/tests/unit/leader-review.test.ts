import { JobCompletionModel } from '../../src/models/job-completion.model.js';
import { LeaderReviewService } from '../../src/services/leader-review.service.js';
import { initializeDatabase } from '../../src/db/schema.js';
import { seedDatabase } from '../../src/db/seed.js';

beforeAll(async () => {
  await initializeDatabase();
  await seedDatabase();
});

describe('Leader Review Model', () => {
  const executionId = 'test-exec-001';
  const jobId = 'test-job-001';
  const leaderId = 'user-manager-001';

  beforeEach(async () => {
    // Clean up test data
    await new Promise<void>((resolve, reject) => {
      const db = require('../../src/db/schema.js').getDatabase();
      db.run('DELETE FROM job_completions WHERE execution_id = ?', [executionId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });

  describe('recordLeaderReview', () => {
    test('should record leader review successfully', async () => {
      // First create a job completion
      await JobCompletionModel.createJobCompletion(executionId, jobId);
      await JobCompletionModel.markCompleted(executionId, jobId, 'user-operator-001');

      // Record leader review
      await JobCompletionModel.recordLeaderReview(executionId, jobId, leaderId);

      const status = await JobCompletionModel.getLeaderReviewStatus(executionId, jobId);
      
      expect(status.leader_reviewed).toBe(true);
      expect(status.leader_reviewed_by).toBe(leaderId);
      expect(status.leader_reviewed_at).toBeDefined();
    });

    test('should throw error for non-existent job completion', async () => {
      await expect(
        JobCompletionModel.recordLeaderReview('non-existent-exec', 'non-existent-job', leaderId)
      ).rejects.toThrow();
    });
  });

  describe('invalidateLeaderReview', () => {
    test('should invalidate leader review successfully', async () => {
      // Create and review
      await JobCompletionModel.createJobCompletion(executionId, jobId);
      await JobCompletionModel.markCompleted(executionId, jobId, 'user-operator-001');
      await JobCompletionModel.recordLeaderReview(executionId, jobId, leaderId);

      // Invalidate
      await JobCompletionModel.invalidateLeaderReview(executionId, jobId);

      const status = await JobCompletionModel.getLeaderReviewStatus(executionId, jobId);
      
      expect(status.leader_reviewed).toBe(false);
      expect(status.leader_reviewed_by).toBeNull();
      expect(status.leader_reviewed_at).toBeNull();
    });
  });

  describe('getLeaderReviewStatus', () => {
    test('should return not reviewed for unreviewed job', async () => {
      await JobCompletionModel.createJobCompletion(executionId, jobId);

      const status = await JobCompletionModel.getLeaderReviewStatus(executionId, jobId);
      
      expect(status.leader_reviewed).toBe(false);
      expect(status.leader_reviewed_by).toBeNull();
      expect(status.leader_reviewed_at).toBeNull();
    });

    test('should return reviewed status with details', async () => {
      await JobCompletionModel.createJobCompletion(executionId, jobId);
      await JobCompletionModel.markCompleted(executionId, jobId, 'user-operator-001');
      await JobCompletionModel.recordLeaderReview(executionId, jobId, leaderId);

      const status = await JobCompletionModel.getLeaderReviewStatus(executionId, jobId);
      
      expect(status.leader_reviewed).toBe(true);
      expect(status.leader_reviewed_by).toBe(leaderId);
      expect(status.leader_reviewed_at).toBeDefined();
    });
  });

  describe('getAllLeaderReviews', () => {
    test('should return empty array when no reviews', async () => {
      const reviews = await JobCompletionModel.getAllLeaderReviews(executionId);
      expect(reviews).toEqual([]);
    });

    test('should return all leader reviews for execution', async () => {
      // Create multiple job completions with reviews
      const jobs = ['job-1', 'job-2', 'job-3'];
      
      for (const jId of jobs) {
        await JobCompletionModel.createJobCompletion(executionId, jId);
        await JobCompletionModel.markCompleted(executionId, jId, 'user-operator-001');
      }

      await JobCompletionModel.recordLeaderReview(executionId, 'job-1', leaderId);
      await JobCompletionModel.recordLeaderReview(executionId, 'job-2', leaderId);

      const reviews = await JobCompletionModel.getAllLeaderReviews(executionId);
      
      expect(reviews.length).toBe(3);
      const reviewedCount = reviews.filter((r: any) => r.leader_reviewed === 1).length;
      expect(reviewedCount).toBe(2);
    });
  });

  describe('allJobsLeaderReviewed', () => {
    test('should return allReviewed false when no reviews', async () => {
      await JobCompletionModel.createJobCompletion(executionId, 'job-1');
      await JobCompletionModel.createJobCompletion(executionId, 'job-2');

      const result = await JobCompletionModel.allJobsLeaderReviewed(executionId);
      
      expect(result.allReviewed).toBe(false);
      expect(result.pendingCount).toBe(2);
      expect(result.reviewedCount).toBe(0);
    });

    test('should return allReviewed true when all jobs reviewed', async () => {
      await JobCompletionModel.createJobCompletion(executionId, 'job-1');
      await JobCompletionModel.createJobCompletion(executionId, 'job-2');
      await JobCompletionModel.markCompleted(executionId, 'job-1', 'user-operator-001');
      await JobCompletionModel.markCompleted(executionId, 'job-2', 'user-operator-001');
      
      await JobCompletionModel.recordLeaderReview(executionId, 'job-1', leaderId);
      await JobCompletionModel.recordLeaderReview(executionId, 'job-2', leaderId);

      const result = await JobCompletionModel.allJobsLeaderReviewed(executionId);
      
      expect(result.allReviewed).toBe(true);
      expect(result.pendingCount).toBe(0);
      expect(result.reviewedCount).toBe(2);
    });

    test('should return partial review status', async () => {
      await JobCompletionModel.createJobCompletion(executionId, 'job-1');
      await JobCompletionModel.createJobCompletion(executionId, 'job-2');
      await JobCompletionModel.markCompleted(executionId, 'job-1', 'user-operator-001');
      await JobCompletionModel.markCompleted(executionId, 'job-2', 'user-operator-001');
      
      await JobCompletionModel.recordLeaderReview(executionId, 'job-1', leaderId);
      // job-2 not reviewed

      const result = await JobCompletionModel.allJobsLeaderReviewed(executionId);
      
      expect(result.allReviewed).toBe(false);
      expect(result.pendingCount).toBe(1);
      expect(result.reviewedCount).toBe(1);
    });
  });
});

describe('Leader Review Service', () => {
  const executionId = 'test-exec-002';
  const jobId = 'test-job-002';
  const leaderId = 'user-manager-001';
  const leaderEmail = 'manager@test.com';

  beforeEach(async () => {
    // Clean up test data
    const db = require('../../src/db/schema.js').getDatabase();
    await new Promise<void>((resolve, reject) => {
      db.run('DELETE FROM job_completions WHERE execution_id = ?', [executionId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });

  describe('validateLeaderCredentials', () => {
    test('should validate correct credentials', async () => {
      const isValid = await LeaderReviewService.validateLeaderCredentials(leaderId, 'password123');
      expect(isValid).toBe(true);
    });

    test('should reject invalid password', async () => {
      const isValid = await LeaderReviewService.validateLeaderCredentials(leaderId, 'wrongpassword');
      expect(isValid).toBe(false);
    });

    test('should reject non-existent user', async () => {
      const isValid = await LeaderReviewService.validateLeaderCredentials('non-existent-user', 'password123');
      expect(isValid).toBe(false);
    });
  });

  describe('submitLeaderReview', () => {
    test('should submit successful leader review', async () => {
      // Create job completion
      await JobCompletionModel.createJobCompletion(executionId, jobId);
      await JobCompletionModel.markCompleted(executionId, jobId, 'user-operator-001');

      const result = await LeaderReviewService.submitLeaderReview(
        executionId,
        jobId,
        leaderId,
        'password123'
      );

      expect(result.success).toBe(true);
      expect(result.message).toBe('Leader review recorded successfully');

      const status = await JobCompletionModel.getLeaderReviewStatus(executionId, jobId);
      expect(status.leader_reviewed).toBe(true);
    });

    test('should reject invalid password', async () => {
      await JobCompletionModel.createJobCompletion(executionId, jobId);
      await JobCompletionModel.markCompleted(executionId, jobId, 'user-operator-001');

      const result = await LeaderReviewService.submitLeaderReview(
        executionId,
        jobId,
        leaderId,
        'wrongpassword'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('AUTH_FAILED');
      expect(result.message).toBe('Invalid password');

      const status = await JobCompletionModel.getLeaderReviewStatus(executionId, jobId);
      expect(status.leader_reviewed).toBe(false);
    });

    test('should handle non-existent job', async () => {
      const result = await LeaderReviewService.submitLeaderReview(
        'non-existent-exec',
        'non-existent-job',
        leaderId,
        'password123'
      );

      expect(result.success).toBe(false);
    });
  });

  describe('handleLeaderReviewTimeout', () => {
    test('should invalidate leader review on timeout', async () => {
      // Create and review
      await JobCompletionModel.createJobCompletion(executionId, jobId);
      await JobCompletionModel.markCompleted(executionId, jobId, 'user-operator-001');
      await JobCompletionModel.recordLeaderReview(executionId, jobId, leaderId);

      // Verify reviewed
      let status = await JobCompletionModel.getLeaderReviewStatus(executionId, jobId);
      expect(status.leader_reviewed).toBe(true);

      // Handle timeout
      await LeaderReviewService.handleLeaderReviewTimeout(executionId, jobId);

      // Verify invalidated
      status = await JobCompletionModel.getLeaderReviewStatus(executionId, jobId);
      expect(status.leader_reviewed).toBe(false);
      expect(status.leader_reviewed_by).toBeNull();
    });
  });

  describe('checkAllJobsReviewed', () => {
    test('should return correct review status', async () => {
      await JobCompletionModel.createJobCompletion(executionId, 'job-1');
      await JobCompletionModel.createJobCompletion(executionId, 'job-2');
      await JobCompletionModel.markCompleted(executionId, 'job-1', 'user-operator-001');
      await JobCompletionModel.markCompleted(executionId, 'job-2', 'user-operator-001');

      const result = await LeaderReviewService.checkAllJobsReviewed(executionId);
      
      expect(result.allReviewed).toBe(false);
      expect(result.pendingCount).toBe(2);
      expect(result.reviewedCount).toBe(0);
    });
  });

  describe('getJobReviewStatus', () => {
    test('should return job review status', async () => {
      await JobCompletionModel.createJobCompletion(executionId, jobId);

      const status = await LeaderReviewService.getJobReviewStatus(executionId, jobId);
      
      expect(status.leader_reviewed).toBe(false);
    });
  });

  describe('getExecutionReviews', () => {
    test('should return all execution reviews', async () => {
      await JobCompletionModel.createJobCompletion(executionId, 'job-1');
      await JobCompletionModel.createJobCompletion(executionId, 'job-2');
      await JobCompletionModel.markCompleted(executionId, 'job-1', 'user-operator-001');
      await JobCompletionModel.recordLeaderReview(executionId, 'job-1', leaderId);

      const reviews = await LeaderReviewService.getExecutionReviews(executionId);
      
      expect(reviews.length).toBe(2);
      const reviewedJob = reviews.find((r: any) => r.job_id === 'job-1');
      expect(reviewedJob.leader_reviewed).toBe(1);
    });
  });
});
