import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../db/schema.js';
import { JobCompletion } from '../types/index.js';
import { ApiError } from '../middleware/error.middleware.js';
import pino from 'pino';

const logger = pino();

const db = getDatabase();

export class JobCompletionModel {
  static async createJobCompletion(
    executionId: string,
    jobId: string
  ): Promise<JobCompletion> {
    const id = uuidv4();
    const now = new Date().toISOString();

    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO job_completions (id, execution_id, job_id, completed, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?)`,
        [id, executionId, jobId, now, now],
        function (err) {
          if (err) reject(err);
          else
            resolve({
              id,
              execution_id: executionId,
              job_id: jobId,
              completed: false,
              completed_by: undefined,
              completed_at: undefined,
              notes: undefined,
              created_at: now,
              updated_at: now,
            });
        }
      );
    });
  }

  static async markCompleted(executionId: string, jobId: string, userId: string): Promise<void> {
    // Validate dependencies before marking completed
    // 1) Check execution job record for time_dependency and prerequisite_job_ids
    const execJob: any = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM execution_jobs WHERE execution_id = ? AND job_id = ?', [executionId, jobId], (err, row: any) => {
        if (err) reject(err);
        else resolve(row || null);
      });
    });

    if (!execJob) {
      throw new ApiError(404, 'EXECUTION_JOB_NOT_FOUND', `Execution job not found for execution ${executionId} and job ${jobId}`);
    }

    // Time dependency check
    if (execJob.time_dependency) {
      const now = new Date();
      const dep = new Date(execJob.time_dependency);
      if (now < dep) {
        logger.info({ executionId, jobId, timeDependency: execJob.time_dependency, now: now.toISOString() }, 'Time dependency not met');
        throw new ApiError(400, 'TIME_DEPENDENCY_NOT_MET', `Cannot complete before ${execJob.time_dependency}`);
      }
    }

    // Prerequisite jobs check (prereq ids are template job ids stored as JSON array)
    if (execJob.prerequisite_job_ids) {
      let prereq: string[] = [];
      try {
        prereq = Array.isArray(execJob.prerequisite_job_ids) ? execJob.prerequisite_job_ids : JSON.parse(execJob.prerequisite_job_ids);
      } catch (e) {
        prereq = [];
      }
      if (prereq.length > 0) {
        // Check completions for each prerequisite job id under this execution
        const placeholders = prereq.map(() => '?').join(',');
        const sql = `SELECT job_id, completed FROM job_completions WHERE execution_id = ? AND job_id IN (${placeholders})`;
        const rows: any[] = await new Promise((resolve, reject) => {
          db.all(sql, [executionId, ...prereq], (err, rows: any[]) => {
            if (err) reject(err);
            else resolve(rows || []);
          });
        });

        const incomplete = prereq.filter((pid) => {
          const r = rows.find((rr) => rr.job_id === pid);
          return !r || r.completed !== 1;
        });

        if (incomplete.length > 0) {
          logger.info({ executionId, jobId, prereq, incomplete }, 'Prerequisite jobs incomplete, blocking completion');
          throw new ApiError(400, 'PREREQUISITE_JOBS_INCOMPLETE', `Prerequisite jobs not completed: ${incomplete.join(',')}`);
        }
      }
    }

    // All checks passed; mark completed
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      db.run(
        'UPDATE job_completions SET completed = 1, completed_by = ?, completed_at = ?, updated_at = ? WHERE execution_id = ? AND job_id = ?',
        [userId, now, now, executionId, jobId],
        function (err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  static async unmarkCompleted(executionId: string, jobId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      db.run(
        'UPDATE job_completions SET completed = 0, completed_by = NULL, completed_at = NULL, updated_at = ? WHERE execution_id = ? AND job_id = ?',
        [now, executionId, jobId],
        function (err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  static async countCompleted(executionId: string): Promise<number> {
    return new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM job_completions WHERE execution_id = ? AND completed = 1', [executionId], (err, row: any) => {
        if (err) reject(err);
        else resolve(row?.count || 0);
      });
    });
  }

  static async countTotal(executionId: string): Promise<number> {
    return new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM job_completions WHERE execution_id = ?', [executionId], (err, row: any) => {
        if (err) reject(err);
        else resolve(row?.count || 0);
      });
    });
  }

  static async getCompletionsByExecution(executionId: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM job_completions WHERE execution_id = ?', [executionId], (err, rows: any[]) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  // Leader Review Methods
  static async recordLeaderReview(executionId: string, jobId: string, userId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      db.run(
        'UPDATE job_completions SET leader_reviewed = 1, leader_reviewed_by = ?, leader_reviewed_at = ?, updated_at = ? WHERE execution_id = ? AND job_id = ?',
        [userId, now, now, executionId, jobId],
        function (err) {
          if (err) reject(err);
          else if ((this as any).changes === 0) {
            reject(new ApiError(404, 'JOB_COMPLETION_NOT_FOUND', `Job completion not found for execution ${executionId} and job ${jobId}`));
          } else resolve();
        }
      );
    });
  }

  static async invalidateLeaderReview(executionId: string, jobId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      db.run(
        'UPDATE job_completions SET leader_reviewed = 0, leader_reviewed_by = NULL, leader_reviewed_at = NULL, updated_at = ? WHERE execution_id = ? AND job_id = ?',
        [now, executionId, jobId],
        function (err) {
          if (err) reject(err);
          else if ((this as any).changes === 0) {
            reject(new ApiError(404, 'JOB_COMPLETION_NOT_FOUND', `Job completion not found for execution ${executionId} and job ${jobId}`));
          } else resolve();
        }
      );
    });
  }

  static async getLeaderReviewStatus(executionId: string, jobId: string): Promise<{ leader_reviewed: boolean; leader_reviewed_by: string | null; leader_reviewed_at: string | null }> {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT leader_reviewed, leader_reviewed_by, leader_reviewed_at FROM job_completions WHERE execution_id = ? AND job_id = ?',
        [executionId, jobId],
        (err, row: any) => {
          if (err) reject(err);
          else if (!row) resolve({ leader_reviewed: false, leader_reviewed_by: null, leader_reviewed_at: null });
          else resolve({
            leader_reviewed: row.leader_reviewed === 1,
            leader_reviewed_by: row.leader_reviewed_by,
            leader_reviewed_at: row.leader_reviewed_at
          });
        }
      );
    });
  }

  static async getAllLeaderReviews(executionId: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT jc.job_id, jc.leader_reviewed, jc.leader_reviewed_by, u.name as leader_name, jc.leader_reviewed_at
         FROM job_completions jc
         LEFT JOIN users u ON jc.leader_reviewed_by = u.id
         WHERE jc.execution_id = ?
         ORDER BY jc.leader_reviewed_at DESC`,
        [executionId],
        (err, rows: any[]) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  }

  static async allJobsLeaderReviewed(executionId: string): Promise<{ allReviewed: boolean; pendingCount: number; reviewedCount: number }> {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT 
          COUNT(*) as total_jobs,
          SUM(CASE WHEN leader_reviewed = 1 THEN 1 ELSE 0 END) as reviewed_jobs
         FROM job_completions
         WHERE execution_id = ?`,
        [executionId],
        (err, row: any) => {
          if (err) reject(err);
          else if (!row) resolve({ allReviewed: false, pendingCount: 0, reviewedCount: 0 });
          else {
            const reviewedCount = row.reviewed_jobs || 0;
            const totalCount = row.total_jobs || 0;
            resolve({
              allReviewed: totalCount > 0 && reviewedCount === totalCount,
              pendingCount: totalCount - reviewedCount,
              reviewedCount
            });
          }
        }
      );
    });
  }
}
