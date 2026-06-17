import { v4 as uuidv4 } from 'uuid';
import bcryptjs from 'bcryptjs';
import { getDatabase } from './schema.js';

const db = getDatabase();

interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: 'Manager' | 'OperatorLeader' | 'Operator';
}

const saltRounds = 10;

export const seedDatabase = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Seed users
      const users: User[] = [
        {
          id: 'user-manager-001',
          email: 'manager@test.com',
          password: bcryptjs.hashSync('Password123!', saltRounds),
          name: 'Jane Manager',
          role: 'Manager',
        },
        {
          id: 'user-leader-001',
          email: 'leader@test.com',
          password: bcryptjs.hashSync('Password123!', saltRounds),
          name: 'John Leader',
          role: 'OperatorLeader',
        },
        {
          id: 'user-operator-001',
          email: 'operator@test.com',
          password: bcryptjs.hashSync('Password123!', saltRounds),
          name: 'Alice Operator',
          role: 'Operator',
        },
      ];

      users.forEach((user) => {
        db.run(
          `INSERT OR IGNORE INTO users (id, email, password, name, role) 
           VALUES (?, ?, ?, ?, ?)`,
          [user.id, user.email, user.password, user.name, user.role]
        );
      });

      // Seed sample templates
      const templateId = uuidv4();
      db.run(
        `INSERT OR IGNORE INTO templates (id, user_id, name, description, state) 
         VALUES (?, ?, ?, ?, ?)`,
        [templateId, 'user-operator-001', 'Daily Maintenance', 'Standard daily maintenance checklist', 'Pending'],
        (err) => {
          if (err) {
            reject(err);
          } else {
            // Seed sample jobs
            const jobId1 = uuidv4();
            const jobId2 = uuidv4();

            db.run(
              `INSERT OR IGNORE INTO jobs (id, template_id, name, job_order, expected_start, expected_end) 
               VALUES (?, ?, ?, ?, ?, ?)`,
              [
                jobId1,
                templateId,
                'Oil Change',
                1,
                new Date().toISOString(),
                new Date(Date.now() + 3600000).toISOString(),
              ]
            );

            db.run(
              `INSERT OR IGNORE INTO jobs (id, template_id, name, job_order, expected_start, expected_end) 
               VALUES (?, ?, ?, ?, ?, ?)`,
              [
                jobId2,
                templateId,
                'Filter Replacement',
                2,
                new Date(Date.now() + 3600000).toISOString(),
                new Date(Date.now() + 7200000).toISOString(),
              ],
              (err) => {
                if (err) {
                  reject(err);
                } else {
                  // Seed procedures for job 1
                  const proc1 = uuidv4();
                  const proc2 = uuidv4();

                  db.run(
                    `INSERT OR IGNORE INTO procedures (id, job_id, name, description, procedure_order) 
                     VALUES (?, ?, ?, ?, ?)`,
                    [proc1, jobId1, 'Drain old oil', 'Locate drain plug, place container, unscrew plug', 1]
                  );

                  db.run(
                    `INSERT OR IGNORE INTO procedures (id, job_id, name, description, procedure_order) 
                     VALUES (?, ?, ?, ?, ?)`,
                    [proc2, jobId1, 'Refill with new oil', 'Insert new oil, check level, close cap', 2],
                    (err) => {
                      if (err) {
                        reject(err);
                      } else {
                        resolve();
                      }
                    }
                  );
                }
              }
            );
          }
        }
      );
    });
  });
};
