import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../../data/jobsheet.db');

// Ensure data directory exists
import { promises as fs } from 'fs';
const dataDir = path.join(__dirname, '../../data');
await fs.mkdir(dataDir, { recursive: true });

const db = new sqlite3.Database(dbPath);

export const initializeDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Enable foreign keys
      db.run('PRAGMA foreign_keys = ON');

      // Users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          name TEXT NOT NULL,
          role TEXT NOT NULL CHECK(role IN ('Manager', 'OperatorLeader', 'Operator')),
          status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Templates table
      db.run(`
        CREATE TABLE IF NOT EXISTS templates (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          state TEXT NOT NULL DEFAULT 'Pending' CHECK(state IN ('Pending', 'Approved')),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(user_id) REFERENCES users(id)
        )
      `);

      // Jobs table
      db.run(`
        CREATE TABLE IF NOT EXISTS jobs (
          id TEXT PRIMARY KEY,
          template_id TEXT NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          job_order INTEGER NOT NULL,
          expected_start TIMESTAMP,
          expected_end TIMESTAMP,
          time_dependency TIMESTAMP,
          prerequisite_job_ids TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(template_id, job_order),
          FOREIGN KEY(template_id) REFERENCES templates(id)
        )
      `);

      // Procedures table
      db.run(`
        CREATE TABLE IF NOT EXISTS procedures (
          id TEXT PRIMARY KEY,
          job_id TEXT NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          procedure_order INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(job_id, procedure_order),
          FOREIGN KEY(job_id) REFERENCES jobs(id)
        )
      `);

      // Execution Jobsheets table
      db.run(`
        CREATE TABLE IF NOT EXISTS execution_jobsheets (
          id TEXT PRIMARY KEY,
          template_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          name TEXT NOT NULL,
          state TEXT NOT NULL DEFAULT 'Pending' CHECK(state IN ('Pending', 'Approved', 'Processing', 'Completed')),
          checked_in_by TEXT,
          checked_in_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(template_id) REFERENCES templates(id),
          FOREIGN KEY(user_id) REFERENCES users(id),
          FOREIGN KEY(checked_in_by) REFERENCES users(id)
        )
      `);

      // Execution Jobs table
      db.run(`
        CREATE TABLE IF NOT EXISTS execution_jobs (
          id TEXT PRIMARY KEY,
          execution_id TEXT NOT NULL,
          job_id TEXT NOT NULL,
          expected_start TIMESTAMP,
          expected_end TIMESTAMP,
          time_dependency TIMESTAMP,
          prerequisite_job_ids TEXT,
          actual_start TIMESTAMP,
          actual_end TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(execution_id, job_id),
          FOREIGN KEY(execution_id) REFERENCES execution_jobsheets(id),
          FOREIGN KEY(job_id) REFERENCES jobs(id)
        )
      `);

      // Backfill/ensure columns exist for older DBs (no-op if columns already exist)
      try {
        db.run(`ALTER TABLE jobs ADD COLUMN time_dependency TIMESTAMP`);
      } catch (e) {
        // ignore - SQLite will error if column exists
      }
      try {
        db.run(`ALTER TABLE jobs ADD COLUMN prerequisite_job_ids TEXT`);
      } catch (e) {}
      try {
        db.run(`ALTER TABLE execution_jobs ADD COLUMN time_dependency TIMESTAMP`);
      } catch (e) {}
      try {
        db.run(`ALTER TABLE execution_jobs ADD COLUMN prerequisite_job_ids TEXT`);
      } catch (e) {}

      // Job Completions table
      db.run(`
        CREATE TABLE IF NOT EXISTS job_completions (
          id TEXT PRIMARY KEY,
          execution_id TEXT NOT NULL,
          job_id TEXT NOT NULL,
          completed INTEGER NOT NULL DEFAULT 0,
          completed_by TEXT,
          completed_at TIMESTAMP,
          notes TEXT,
          leader_reviewed INTEGER NOT NULL DEFAULT 0,
          leader_reviewed_by TEXT,
          leader_reviewed_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(execution_id, job_id),
          FOREIGN KEY(execution_id) REFERENCES execution_jobsheets(id),
          FOREIGN KEY(job_id) REFERENCES jobs(id),
          FOREIGN KEY(completed_by) REFERENCES users(id),
          FOREIGN KEY(leader_reviewed_by) REFERENCES users(id)
        )
      `);

      // Create indexes for efficient queries
      db.run('CREATE INDEX IF NOT EXISTS idx_templates_state ON templates(state, created_at)');
      db.run('CREATE INDEX IF NOT EXISTS idx_templates_user ON templates(user_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_execution_state ON execution_jobsheets(state, created_at)');
      db.run('CREATE INDEX IF NOT EXISTS idx_execution_user ON execution_jobsheets(user_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_execution_checked_in ON execution_jobsheets(checked_in_by)');
      db.run('CREATE INDEX IF NOT EXISTS idx_jobs_template ON jobs(template_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_procedures_job ON procedures(job_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_job_completions_leader_reviewed ON job_completions(execution_id, leader_reviewed)');
      db.run('CREATE INDEX IF NOT EXISTS idx_job_completions_leader_reviewed_by ON job_completions(leader_reviewed_by)', (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });
};

export const getDatabase = (): sqlite3.Database => {
  return db;
};
