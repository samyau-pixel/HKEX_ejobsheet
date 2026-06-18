import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../db/schema.js';
import { JobCompletion } from '../types/index.js';

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
}
