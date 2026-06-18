import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../db/schema.js';
import { ExecutionJobsheet } from '../types/index.js';

const db = getDatabase();

export class ExecutionModel {
  static async createExecutionSheet(
    templateId: string,
    userId: string,
    name: string
  ): Promise<ExecutionJobsheet> {
    const id = uuidv4();
    const now = new Date().toISOString();

    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO execution_jobsheets (id, template_id, user_id, name, state, created_at, updated_at) VALUES (?, ?, ?, ?, 'Pending', ?, ?)`,
        [id, templateId, userId, name, now, now],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve({
              id,
              template_id: templateId,
              user_id: userId,
              name,
              state: 'Pending',
              checked_in_by: undefined,
              checked_in_at: undefined,
              created_at: now,
              updated_at: now,
            });
          }
        }
      );
    });
  }

  static async getExecutionById(id: string) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM execution_jobsheets WHERE id = ?', [id], (err, row: any) => {
        if (err) reject(err);
        else resolve(row || null);
      });
    });
  }

  static async listExecutions(userId?: string, state?: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      let query = 'SELECT * FROM execution_jobsheets WHERE 1=1';
      const params: any[] = [];
      if (userId) {
        query += ' AND user_id = ?';
        params.push(userId);
      }
      if (state) {
        query += ' AND state = ?';
        params.push(state);
      }
      query += ' ORDER BY created_at DESC';
      db.all(query, params, (err, rows: any[]) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  static async setCheckedIn(id: string, userId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      db.run(
        'UPDATE execution_jobsheets SET checked_in_by = ?, checked_in_at = ?, state = ?, updated_at = ? WHERE id = ?',
        [userId, now, 'Processing', now, id],
        function (err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  static async updateState(id: string, state: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      db.run(
        'UPDATE execution_jobsheets SET state = ?, updated_at = ? WHERE id = ?',
        [state, now, id],
        function (err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }
}
