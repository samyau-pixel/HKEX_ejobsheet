import { v4 as uuidv4 } from 'uuid';
import { Template } from '../types/index.js';
import { getDatabase } from '../db/schema.js';

const db = getDatabase();

export class TemplateModel {
  static async createTemplate(
    userId: string,
    name: string,
    description?: string
  ): Promise<Template> {
    const id = uuidv4();
    const now = new Date().toISOString();

    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO templates (id, user_id, name, description, state, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'Pending', ?, ?)`,
        [id, userId, name, description || null, now, now],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve({
              id,
              user_id: userId,
              name,
              description,
              state: 'Pending',
              created_at: now,
              updated_at: now,
            });
          }
        }
      );
    });
  }

  static async getTemplate(id: string): Promise<Template | null> {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM templates WHERE id = ?',
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

  static async listTemplates(
    userId?: string,
    state?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Template[]> {
    return new Promise((resolve, reject) => {
      let query = 'SELECT * FROM templates WHERE 1=1';
      const params: any[] = [];

      if (userId) {
        query += ' AND user_id = ?';
        params.push(userId);
      }

      if (state) {
        query += ' AND state = ?';
        params.push(state);
      }

      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      db.all(query, params, (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  static async updateState(id: string, state: 'Pending' | 'Approved'): Promise<void> {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();

      db.run(
        'UPDATE templates SET state = ?, updated_at = ? WHERE id = ?',
        [state, now, id],
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

  static async countByState(state: string): Promise<number> {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT COUNT(*) as count FROM templates WHERE state = ?',
        [state],
        (err, row: any) => {
          if (err) {
            reject(err);
          } else {
            resolve(row?.count || 0);
          }
        }
      );
    });
  }
}
