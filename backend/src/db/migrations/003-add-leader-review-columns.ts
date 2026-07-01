/**
 * Migration: Add leader review columns to job_completions table
 * 
 * This migration adds the following columns to track operator leader reviews:
 * - leader_reviewed: Boolean flag indicating if leader has reviewed the job
 * - leader_reviewed_by: User ID of the leader who approved
 * - leader_reviewed_at: Timestamp when leader approved
 * 
 * Date: 2026-06-22
 * Feature: Operator Leader Review (003-operator-lead-review)
 */

import { getDatabase } from '../schema.js';

export const up = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    
    db.serialize(() => {
      // Add leader review columns
      db.run(`ALTER TABLE job_completions ADD COLUMN leader_reviewed INTEGER NOT NULL DEFAULT 0`, (err) => {
        if (err) {
          console.error('Error adding leader_reviewed column:', err.message);
          reject(err);
          return;
        }
      });

      db.run(`ALTER TABLE job_completions ADD COLUMN leader_reviewed_by TEXT`, (err) => {
        if (err) {
          console.error('Error adding leader_reviewed_by column:', err.message);
          reject(err);
          return;
        }
      });

      db.run(`ALTER TABLE job_completions ADD COLUMN leader_reviewed_at TIMESTAMP`, (err) => {
        if (err) {
          console.error('Error adding leader_reviewed_at column:', err.message);
          reject(err);
          return;
        }
      });

      // Create indexes for efficient queries
      db.run(`CREATE INDEX idx_job_completions_leader_reviewed ON job_completions(execution_id, leader_reviewed)`, (err) => {
        if (err) {
          console.error('Error creating idx_job_completions_leader_reviewed index:', err.message);
          reject(err);
          return;
        }
      });

      db.run(`CREATE INDEX idx_job_completions_leader_reviewed_by ON job_completions(leader_reviewed_by)`, (err) => {
        if (err) {
          console.error('Error creating idx_job_completions_leader_reviewed_by index:', err.message);
          reject(err);
          return;
        }
      });

      console.log('Migration completed successfully: Added leader review columns to job_completions');
      resolve();
    });
  });
};

export const down = (): Promise<void> => {
  return new Promise((resolve) => {
    const db = getDatabase();
    
    db.serialize(() => {
      // Drop indexes first
      db.run(`DROP INDEX IF EXISTS idx_job_completions_leader_reviewed`, (err) => {
        if (err) {
          console.error('Error dropping idx_job_completions_leader_reviewed index:', err.message);
          // Continue anyway
        }
      });

      db.run(`DROP INDEX IF EXISTS idx_job_completions_leader_reviewed_by`, (err) => {
        if (err) {
          console.error('Error dropping idx_job_completions_leader_reviewed_by index:', err.message);
          // Continue anyway
        }
      });

      // Note: SQLite doesn't support DROP COLUMN in older versions
      // The columns will remain in the schema but will be unused
      // For production, consider recreating the table without these columns
      console.log('Rollback completed: Dropped leader review indexes');
      console.log('Note: SQLite does not support DROP COLUMN. Columns remain in schema but are unused.');
      
      resolve();
    });
  });
};

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const action = process.argv[2];
  
  if (action === 'up') {
    up()
      .then(() => {
        console.log('Migration up completed');
        process.exit(0);
      })
      .catch((err) => {
        console.error('Migration up failed:', err.message);
        process.exit(1);
      });
  } else if (action === 'down') {
    down()
      .then(() => {
        console.log('Migration rollback completed');
        process.exit(0);
      })
      .catch((err) => {
        console.error('Migration rollback failed:', err.message);
        process.exit(1);
      });
  } else {
    console.log('Usage: node 003-add-leader-review-columns.js [up|down]');
    process.exit(1);
  }
}
