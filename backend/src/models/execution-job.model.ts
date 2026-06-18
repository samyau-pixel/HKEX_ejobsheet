import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../db/schema.js';
import { ExecutionJob } from '../types/index.js';

const db = getDatabase();

export class ExecutionJobModel {
  static async createExecutionJob(
    executionId: string,
    jobId: string,
    expectedStart?: string,
    expectedEnd?: string
  ): Promise<ExecutionJob> {
    const id = uuidv4();
    const now = new Date().toISOString();

    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO execution_jobs (id, execution_id, job_id, expected_start, expected_end, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, executionId, jobId, expectedStart || null, expectedEnd || null, now, now],
        function (err) {
          if (err) reject(err);
          else
            resolve({
              id,
              execution_id: executionId,
              job_id: jobId,
              expected_start: expectedStart || undefined,
              expected_end: expectedEnd || undefined,
              actual_start: undefined,
              actual_end: undefined,
              created_at: now,
              updated_at: now,
            });
        }
      );
    });
  }

  static async setActualTimes(id: string, actualStart?: string | null, actualEnd?: string | null): Promise<void> {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      db.run(
        'UPDATE execution_jobs SET actual_start = ?, actual_end = ?, updated_at = ? WHERE id = ?',
        [actualStart || null, actualEnd || null, now, id],
        function (err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  static async getJobsByExecution(executionId: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT ej.*, j.name as job_name, j.job_order FROM execution_jobs ej JOIN jobs j ON ej.job_id = j.id WHERE ej.execution_id = ? ORDER BY j.job_order ASC`,
        [executionId],
        (err, rows: any[]) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  }
}
