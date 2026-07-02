import { v4 as uuidv4 } from 'uuid';
import { Job } from '../types/index.js';
import { getDatabase } from '../db/schema.js';

const db = getDatabase();

export class JobModel {
  static async createJob(
    templateId: string,
    name: string,
    jobOrder: number,
    description?: string,
    expectedStart?: string,
    expectedEnd?: string,
    timeDependency?: string,
    prerequisiteJobIds?: string[]
  ): Promise<Job> {
    const id = uuidv4();
    const now = new Date().toISOString();

    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO jobs (id, template_id, name, description, job_order, expected_start, expected_end, time_dependency, prerequisite_job_ids, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          templateId,
          name,
          description || null,
          jobOrder,
          expectedStart || null,
          expectedEnd || null,
          timeDependency || null,
          prerequisiteJobIds ? JSON.stringify(prerequisiteJobIds) : null,
          now,
          now,
        ],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve({
              id,
              template_id: templateId,
              name,
              description,
              job_order: jobOrder,
              expected_start: expectedStart,
              expected_end: expectedEnd,
              timeDependency: timeDependency,
              prerequisiteJobIds: prerequisiteJobIds,
              created_at: now,
              updated_at: now,
            });
          }
        }
      );
    });
  }

  static async getJob(id: string): Promise<Job | null> {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM jobs WHERE id = ?', [id], (err, row: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(row || null);
        }
      });
    });
  }

  static async getJobsByTemplate(templateId: string): Promise<Job[]> {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM jobs WHERE template_id = ? ORDER BY job_order ASC',
        [templateId],
        (err, rows: any[]) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows || []);
          }
        }
      );
    });
  }

  static async deleteJobsByTemplate(templateId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM jobs WHERE template_id = ?', [templateId], function (err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  static async setPrerequisites(jobId: string, prerequisiteIds: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      db.run('UPDATE jobs SET prerequisite_job_ids = ?, updated_at = ? WHERE id = ?', [JSON.stringify(prerequisiteIds), now, jobId], function (err) {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}
