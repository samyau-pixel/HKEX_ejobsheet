import { v4 as uuidv4 } from 'uuid';
import { Procedure } from '../types/index.js';
import { getDatabase } from '../db/schema.js';

const db = getDatabase();

export class ProcedureModel {
  static async createProcedure(
    jobId: string,
    name: string,
    procedureOrder: number,
    description?: string
  ): Promise<Procedure> {
    const id = uuidv4();
    const now = new Date().toISOString();

    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO procedures (id, job_id, name, description, procedure_order, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, jobId, name, description || null, procedureOrder, now, now],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve({
              id,
              job_id: jobId,
              name,
              description,
              procedure_order: procedureOrder,
              created_at: now,
              updated_at: now,
            });
          }
        }
      );
    });
  }

  static async getProcedure(id: string): Promise<Procedure | null> {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM procedures WHERE id = ?',
        [id],
        (err, row: any) => {
          if (err) {
            reject(err);
          } else {
            resolve(row || null);
          }
        }
      );
    });
  }

  static async getProceduresByJob(jobId: string): Promise<Procedure[]> {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM procedures WHERE job_id = ? ORDER BY procedure_order ASC',
        [jobId],
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

  static async deleteProceduresByJob(jobId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM procedures WHERE job_id = ?',
        [jobId],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }
}
