/**
 * Rollback Migration: Remove leader review columns from job_completions table
 * 
 * This script drops the indexes created by the migration.
 * Note: SQLite doesn't support DROP COLUMN, so the columns will remain in the schema
 * but will be unused. For a complete rollback, the table would need to be recreated.
 * 
 * Date: 2026-06-22
 * Feature: Operator Leader Review (003-operator-lead-review)
 */

import { getDatabase } from '../schema.js';

export const rollback = (): Promise<void> => {
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

      console.log('Rollback completed: Dropped leader review indexes');
      console.log('Note: SQLite does not support DROP COLUMN. Columns remain in schema but are unused.');
      
      resolve();
    });
  });
};

// Run rollback if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  rollback()
    .then(() => {
      console.log('Rollback completed successfully');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Rollback failed:', err.message);
      process.exit(1);
    });
}
