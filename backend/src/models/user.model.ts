import bcryptjs from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../types/index.js';
import { getDatabase } from '../db/schema.js';

const db = getDatabase();
const saltRounds = 10;

export class UserModel {
  static async createUser(
    email: string,
    password: string,
    name: string,
    role: 'Manager' | 'OperatorLeader' | 'Operator'
  ): Promise<User> {
    const id = uuidv4();
    const hashedPassword = await bcryptjs.hash(password, saltRounds);
    const now = new Date().toISOString();

    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO users (id, email, password, name, role, status, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, 'active', ?, ?)`,
        [id, email, hashedPassword, name, role, now, now],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve({
              id,
              email,
              name,
              role,
              status: 'active',
              created_at: now,
              updated_at: now,
            });
          }
        }
      );
    });
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM users WHERE email = ? AND status = "active"',
        [email],
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

  static async getUserById(id: string): Promise<User | null> {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM users WHERE id = ? AND status = "active"',
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

  static async verifyPassword(hashedPassword: string, plainPassword: string): Promise<boolean> {
    return await bcryptjs.compare(plainPassword, hashedPassword);
  }

  static async listUsers(role?: string): Promise<User[]> {
    return new Promise((resolve, reject) => {
      let query = 'SELECT id, email, name, role, status, created_at, updated_at FROM users WHERE status = "active"';
      const params: any[] = [];

      if (role) {
        query += ' AND role = ?';
        params.push(role);
      }

      db.all(query, params, (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }
}
