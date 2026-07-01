# Data Model Changes: Operator Leader Review

**Phase**: 1 (Design) | **Date**: 2026-06-22  
**Status**: Draft | **Database**: SQLite

## Overview

Add leader review tracking to the `job_completions` table to record who approved each job and when. No new tables required; existing table extended with leader review fields.

---

## Modified Entities

### JobCompletion (Modified)

Track which jobs are marked complete during execution, including leader review information.

**Existing Attributes**:
- `id` (UUID, PK): Unique identifier
- `execution_id` (UUID, FK → ExecutionJobsheet.id, NOT NULL): Parent execution
- `job_id` (UUID, FK → Job.id, NOT NULL): Which job was completed
- `completed` (BOOLEAN, NOT NULL, default false): Completion flag
- `completed_by` (UUID, FK → User.id, nullable): Who marked it complete
- `completed_at` (TIMESTAMP, nullable): When marked complete
- `notes` (TEXT, nullable): Optional notes
- `created_at` (TIMESTAMP, default CURRENT_TIMESTAMP)
- `updated_at` (TIMESTAMP, default CURRENT_TIMESTAMP)

**New Attributes**:
- `leader_reviewed` (BOOLEAN, NOT NULL, default false): Whether leader has reviewed and approved
- `leader_reviewed_by` (UUID, FK → User.id, nullable): Leader who approved
- `leader_reviewed_at` (TIMESTAMP, nullable): When leader approved

**New Constraints**:
- `leader_reviewed_by`, `leader_reviewed_at`, `leader_review_ip` set only if `leader_reviewed` = true
- `leader_reviewed` automatically set to false if job is modified after review

**Example**:
```sql
INSERT INTO job_completions (id, execution_id, job_id, completed, completed_by, completed_at, leader_reviewed, leader_reviewed_by, leader_reviewed_at) VALUES
('comp-001', 'exec-001', 'job-001', true, 'user-001', '2026-06-22 08:45', true, 'user-002', '2026-06-22 08:50'),
('comp-002', 'exec-001', 'job-002', true, 'user-001', '2026-06-22 09:00', false, NULL, NULL); -- pending leader review
```

---

## Updated Schema DDL

```sql
-- Job Completions table (modified)
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
);

-- Index for efficient leader review queries
CREATE INDEX IF NOT EXISTS idx_job_completions_leader_reviewed ON job_completions(execution_id, leader_reviewed);
CREATE INDEX IF NOT EXISTS idx_job_completions_leader_reviewed_by ON job_completions(leader_reviewed_by);
```

---

## Migration Script

```sql
-- Add leader review columns to job_completions table
ALTER TABLE job_completions ADD COLUMN leader_reviewed INTEGER NOT NULL DEFAULT 0;
ALTER TABLE job_completions ADD COLUMN leader_reviewed_by TEXT;
ALTER TABLE job_completions ADD COLUMN leader_reviewed_at TIMESTAMP;

-- Add foreign key constraint for leader_reviewed_by
-- Note: SQLite doesn't support adding FK constraints after table creation
-- The constraint is enforced at application level

-- Create indexes for efficient queries
CREATE INDEX idx_job_completions_leader_reviewed ON job_completions(execution_id, leader_reviewed);
CREATE INDEX idx_job_completions_leader_reviewed_by ON job_completions(leader_reviewed_by);
```

---

## Query Patterns

### Check if all jobs in a jobsheet have leader review
```sql
SELECT 
  execution_id,
  COUNT(*) as total_jobs,
  SUM(CASE WHEN leader_reviewed = 1 THEN 1 ELSE 0 END) as reviewed_jobs
FROM job_completions
WHERE execution_id = ?
GROUP BY execution_id
HAVING total_jobs = reviewed_jobs;
```

### Get leader review details for a jobsheet
```sql
SELECT 
  jc.job_id,
  jc.leader_reviewed,
  jc.leader_reviewed_by,
  u.name as leader_name,
  jc.leader_reviewed_at
FROM job_completions jc
LEFT JOIN users u ON jc.leader_reviewed_by = u.id
WHERE jc.execution_id = ?
ORDER BY jc.leader_reviewed_at DESC;
```

### Count pending leader reviews for a jobsheet
```sql
SELECT 
  execution_id,
  COUNT(*) as pending_reviews
FROM job_completions
WHERE execution_id = ? 
  AND completed = 1 
  AND leader_reviewed = 0
GROUP BY execution_id;
```

---

## Application Logic

### Leader Review Validation
```typescript
interface LeaderReview {
  userId: string;
  jobId: string;
  executionId: string;
  password: string;
  ipAddress?: string;
}

// Validate leader credentials
async function validateLeaderCredentials(
  userId: string, 
  password: string
): Promise<boolean> {
  const user = await getUserById(userId);
  if (!user || user.role !== 'OperatorLeader') {
    return false;
  }
  return bcrypt.compare(password, user.password);
}

// Record leader review
async function recordLeaderReview(review: LeaderReview): Promise<void> {
  const isValid = await validateLeaderCredentials(review.userId, review.password);
  if (!isValid) {
    throw new Error('Invalid leader credentials');
  }
  
  await db.run(`
    UPDATE job_completions
    SET leader_reviewed = 1,
        leader_reviewed_by = ?,
        leader_reviewed_at = CURRENT_TIMESTAMP,
        leader_review_ip = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE job_id = ? AND execution_id = ?
  `, [review.userId, review.ipAddress, review.jobId, review.executionId]);
}

// Invalidate leader review when job is modified
async function invalidateLeaderReview(jobId: string, executionId: string): Promise<void> {
  await db.run(`
    UPDATE job_completions
    SET leader_reviewed = 0,
        leader_reviewed_by = NULL,
        leader_reviewed_at = NULL,
        leader_review_ip = NULL,
        updated_at = CURRENT_TIMESTAMP
    WHERE job_id = ? AND execution_id = ?
  `, [jobId, executionId]);
}

// Check if all jobs have leader review
async function allJobsLeaderReviewed(executionId: string): Promise<boolean> {
  const result = await db.get(`
    SELECT 
      COUNT(*) as total_jobs,
      SUM(CASE WHEN leader_reviewed = 1 THEN 1 ELSE 0 END) as reviewed_jobs
    FROM job_completions
    WHERE execution_id = ?
  `, [executionId]);
  
  return result.total_jobs === result.reviewed_jobs && result.total_jobs > 0;
}
```

---

## Data Integrity Rules

1. **Leader Review Immutability**: Once `leader_reviewed` is set to 1, it cannot be changed to 0 except through explicit job modification.
2. **Leader Review Cascade**: If a job is modified after leader review, `leader_reviewed` automatically resets to 0.
3. **Leader Authentication**: `leader_reviewed_by` must reference a valid user with `OperatorLeader` role.
4. **Audit Trail**: All leader review actions (success and failure) are logged with timestamp, user ID, job ID, and IP address.
5. **Foreign Key Constraints**: `leader_reviewed_by` references `users(id)` and is set to NULL if the user is deleted (for historical record preservation).

---

## Backward Compatibility

- Existing `job_completions` records without leader review data remain valid (`leader_reviewed = 0` by default).
- Migration script sets default value of 0 for existing records.
- Application logic checks `leader_reviewed` flag before enforcing leader review requirement.
- No breaking changes to existing API endpoints; leader review fields are optional additions.
