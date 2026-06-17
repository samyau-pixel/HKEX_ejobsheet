# Data Model: Role-Based Jobsheet Management System

**Phase**: 1 (Design) | **Date**: 2026-06-17  
**Status**: Complete | **Database**: SQLite

## Overview

6 entities with normalized schema supporting template creation, approval workflow, execution sheets with state management, and job completion tracking.

---

## Entity-Relationship Diagram

```
┌─────────────┐
│    User     │
├─────────────┤
│ id (PK)     │
│ email       │
│ password    │
│ name        │
│ role        │
│ created_at  │
│ updated_at  │
└──────┬──────┘
       │ (one-to-many)
       │
       ├─────────────┬──────────────────────────────┐
       │             │                              │
       ▼             ▼                              ▼
   ┌──────────────┐  ┌──────────────────┐  ┌──────────────────┐
   │   Template   │  │ExecutionJobsheet │  │   JobCompletion  │
   ├──────────────┤  ├──────────────────┤  ├──────────────────┤
   │ id (PK)      │  │ id (PK)          │  │ id (PK)          │
   │ user_id (FK) │  │ template_id (FK) │  │ execution_id (FK)│
   │ name         │  │ user_id (FK)     │  │ job_id (FK)      │
   │ description  │  │ name             │  │ completed        │
   │ state        │  │ state            │  │ completed_by (FK)│
   │ created_at   │  │ checked_in_by    │  │ completed_at     │
   │ updated_at   │  │ checked_in_at    │  │ notes            │
   │ created_by   │  │ created_at       │  │ created_at       │
   └──────┬───────┘  │ updated_at       │  │ updated_at       │
          │          └────────┬─────────┘  └──────────────────┘
          │                   │
          │ (one-to-many)     │ (one-to-many)
          │                   │
          ▼                   ▼
   ┌─────────────┐    ┌────────────────┐
   │    Job      │    │ ExecutionJob   │
   ├─────────────┤    ├────────────────┤
   │ id (PK)     │    │ id (PK)        │
   │template_id  │    │execution_id(FK)│
   │name         │    │job_id (FK)     │
   │order        │    │expected_start  │
   │expected_    │    │expected_end    │
   │  start      │    │actual_start    │
   │expected_end │    │actual_end      │
   │created_at   │    │created_at      │
   │updated_at   │    │updated_at      │
   └──────┬──────┘    └────────────────┘
          │
          │ (one-to-many)
          │
          ▼
   ┌─────────────┐
   │ Procedure   │
   ├─────────────┤
   │ id (PK)     │
   │ job_id (FK) │
   │ name        │
   │ description │
   │ order       │
   │ created_at  │
   │ updated_at  │
   └─────────────┘
```

---

## Entity Definitions

### User

Represents a system user with authentication and role-based access.

**Attributes**:
- `id` (UUID, PK): Unique identifier
- `email` (VARCHAR 255, UNIQUE, NOT NULL): Email address (login credential)
- `password` (VARCHAR 255, NOT NULL): bcrypt hash (never plaintext)
- `name` (VARCHAR 255, NOT NULL): Display name (full name)
- `role` (ENUM: 'Manager', 'OperatorLeader', 'Operator', NOT NULL): Access level
- `status` (ENUM: 'active', 'inactive', default 'active'): Account status
- `created_at` (TIMESTAMP, default CURRENT_TIMESTAMP): Registration timestamp
- `updated_at` (TIMESTAMP, default CURRENT_TIMESTAMP): Last modification timestamp

**Constraints**:
- `email` unique (enables login uniqueness)
- `password` NOT NULL (required for authentication)
- `role` NOT NULL (determines permissions)

**Example**:
```sql
INSERT INTO users (id, email, password, name, role) VALUES
('user-001', 'operator@company.com', '$2a$10$...bcrypt...', 'John Operator', 'Operator'),
('user-002', 'manager@company.com', '$2a$10$...bcrypt...', 'Jane Manager', 'Manager');
```

---

### Template

Jobsheet template defining reusable job structures and scheduling. Immutable after approval.

**Attributes**:
- `id` (UUID, PK): Unique identifier
- `user_id` (UUID, FK → User.id, NOT NULL): Creator
- `name` (VARCHAR 500, NOT NULL): Template name (e.g., "Daily Maintenance")
- `description` (TEXT): Optional long description
- `state` (ENUM: 'Pending', 'Approved', NOT NULL, default 'Pending'): Approval status
- `created_at` (TIMESTAMP, default CURRENT_TIMESTAMP): Creation timestamp
- `updated_at` (TIMESTAMP, default CURRENT_TIMESTAMP): Last modification
- `created_by` (UUID, FK → User.id): Audit trail of creator

**Constraints**:
- `name` NOT NULL
- `user_id` NOT NULL (tracks creator for RBAC)
- `state` immutable after 'Approved' (re-create new template for changes)

**Transitions**:
```
Pending → [Edit by Operator] → Pending (re-save)
Pending → [Approve by Manager] → Approved (terminal, no edits)
```

**Example**:
```sql
INSERT INTO templates (id, user_id, name, state) VALUES
('tmpl-001', 'user-001', 'Daily Maintenance', 'Pending'),
('tmpl-002', 'user-001', 'Equipment Inspection', 'Approved');
```

---

### Job

Unit of work within a template, containing procedures and scheduling.

**Attributes**:
- `id` (UUID, PK): Unique identifier
- `template_id` (UUID, FK → Template.id, NOT NULL): Parent template
- `name` (VARCHAR 500, NOT NULL): Job name (e.g., "Oil Change")
- `description` (TEXT): Optional details
- `order` (INTEGER, NOT NULL): Sequence within template (1, 2, 3...)
- `expected_start` (DATETIME): Expected start date/time for execution
- `expected_end` (DATETIME): Expected completion date/time for execution
- `created_at` (TIMESTAMP, default CURRENT_TIMESTAMP)
- `updated_at` (TIMESTAMP, default CURRENT_TIMESTAMP)

**Constraints**:
- `template_id` NOT NULL
- `name` NOT NULL
- `order` NOT NULL, UNIQUE within template_id (enforced in app or DB constraint)

**Example**:
```sql
INSERT INTO jobs (id, template_id, name, order, expected_start, expected_end) VALUES
('job-001', 'tmpl-001', 'Oil Change', 1, '2026-06-18 08:00', '2026-06-18 09:00'),
('job-002', 'tmpl-001', 'Filter Replacement', 2, '2026-06-18 09:00', '2026-06-18 10:00');
```

---

### Procedure

Atomic task within a job. Not individually tracked for completion (completion is at job level).

**Attributes**:
- `id` (UUID, PK): Unique identifier
- `job_id` (UUID, FK → Job.id, NOT NULL): Parent job
- `name` (VARCHAR 500, NOT NULL): Procedure name (e.g., "Drain old oil")
- `description` (TEXT): Step-by-step instructions
- `order` (INTEGER, NOT NULL): Sequence within job (1, 2, 3...)
- `created_at` (TIMESTAMP, default CURRENT_TIMESTAMP)
- `updated_at` (TIMESTAMP, default CURRENT_TIMESTAMP)

**Constraints**:
- `job_id` NOT NULL
- `name` NOT NULL
- `order` NOT NULL, UNIQUE within job_id

**Example**:
```sql
INSERT INTO procedures (id, job_id, name, order, description) VALUES
('proc-001', 'job-001', 'Drain old oil', 1, 'Locate drain plug, place container, unscrew plug'),
('proc-002', 'job-001', 'Refill with new oil', 2, 'Insert new oil, check level, close cap');
```

---

### ExecutionJobsheet

Instance of a template created for actual job execution. Tracks state, check-in/check-out, and progress.

**Attributes**:
- `id` (UUID, PK): Unique identifier
- `template_id` (UUID, FK → Template.id, NOT NULL): Source template (immutable reference)
- `user_id` (UUID, FK → User.id, NOT NULL): Creator/current operator
- `name` (VARCHAR 500, NOT NULL): Execution name (can differ from template, e.g., "Daily Maint - June 17")
- `state` (ENUM: 'Pending', 'Approved', 'Processing', 'Completed', NOT NULL, default 'Pending'): Current state
- `checked_in_by` (UUID, FK → User.id, nullable): Currently checked-in operator (exclusive access)
- `checked_in_at` (TIMESTAMP, nullable): Check-in timestamp
- `created_at` (TIMESTAMP, default CURRENT_TIMESTAMP): Creation timestamp
- `updated_at` (TIMESTAMP, default CURRENT_TIMESTAMP): Last state transition
- `completed_at` (TIMESTAMP, nullable): When marked Completed

**Constraints**:
- `template_id`, `user_id`, `name` NOT NULL
- `state` default 'Pending'
- `checked_in_by` only set if state is 'Processing'

**State Transitions**:
```
Pending → Approved [Manager approval, optional for execution]
Approved → Processing [Operator check-in; set checked_in_by, checked_in_at]
Processing → Pending [Operator check-out; clear checked_in_by; job progress preserved]
Processing → Completed [All jobs marked done; set completed_at]
Completed → (terminal, no transitions)
```

**Example**:
```sql
INSERT INTO execution_jobsheets (id, template_id, user_id, name, state) VALUES
('exec-001', 'tmpl-001', 'user-001', 'Daily Maint - June 17', 'Pending'),
('exec-002', 'tmpl-001', 'user-001', 'Daily Maint - June 18', 'Processing'); -- checked_in_by = 'user-001'
```

---

### ExecutionJob

Runtime state for each job in an execution. Tracks expected dates (customized from template) and actual completion progress.

**Attributes**:
- `id` (UUID, PK): Unique identifier
- `execution_id` (UUID, FK → ExecutionJobsheet.id, NOT NULL): Parent execution
- `job_id` (UUID, FK → Job.id, NOT NULL): Reference to template job (for audit trail, not editable)
- `expected_start` (DATETIME, nullable): Can override from template
- `expected_end` (DATETIME, nullable): Can override from template
- `actual_start` (DATETIME, nullable): When operator started (optional tracking)
- `actual_end` (DATETIME, nullable): When operator finished (optional tracking)
- `created_at` (TIMESTAMP, default CURRENT_TIMESTAMP)
- `updated_at` (TIMESTAMP, default CURRENT_TIMESTAMP)

**Constraints**:
- `execution_id`, `job_id` NOT NULL
- UNIQUE(execution_id, job_id): One row per job per execution

**Example**:
```sql
INSERT INTO execution_jobs (id, execution_id, job_id, expected_start, expected_end) VALUES
('exec-job-001', 'exec-001', 'job-001', '2026-06-18 08:00', '2026-06-18 09:00');
```

---

### JobCompletion

Track which jobs are marked complete during execution. Separate table for audit trail.

**Attributes**:
- `id` (UUID, PK): Unique identifier
- `execution_id` (UUID, FK → ExecutionJobsheet.id, NOT NULL): Parent execution
- `job_id` (UUID, FK → Job.id, NOT NULL): Which job was completed
- `completed` (BOOLEAN, NOT NULL, default false): Completion flag
- `completed_by` (UUID, FK → User.id, nullable): Who marked it complete
- `completed_at` (TIMESTAMP, nullable): When marked complete
- `notes` (TEXT, nullable): Optional notes ("Equipment broken, skipped step 2", etc.)
- `created_at` (TIMESTAMP, default CURRENT_TIMESTAMP)
- `updated_at` (TIMESTAMP, default CURRENT_TIMESTAMP)

**Constraints**:
- `execution_id`, `job_id` NOT NULL
- UNIQUE(execution_id, job_id): One row per job per execution (upsert on update)
- `completed_by`, `completed_at` set only if `completed` = true

**Example**:
```sql
INSERT INTO job_completions (id, execution_id, job_id, completed, completed_by, completed_at) VALUES
('comp-001', 'exec-001', 'job-001', true, 'user-001', '2026-06-18 08:45'),
('comp-002', 'exec-001', 'job-002', false, NULL, NULL);
```

---

## Schema DDL

```sql
-- Users Table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT CHECK(role IN ('Manager', 'OperatorLeader', 'Operator')) NOT NULL,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Templates Table
CREATE TABLE templates (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  state TEXT DEFAULT 'Pending' CHECK(state IN ('Pending', 'Approved')) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_templates_user_id ON templates(user_id);
CREATE INDEX idx_templates_state ON templates(state);
CREATE INDEX idx_templates_created_at ON templates(created_at);

-- Jobs Table
CREATE TABLE jobs (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  "order" INTEGER NOT NULL,
  expected_start DATETIME,
  expected_end DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (template_id) REFERENCES templates(id),
  UNIQUE(template_id, "order")
);

CREATE INDEX idx_jobs_template_id ON jobs(template_id);

-- Procedures Table
CREATE TABLE procedures (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  "order" INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(id),
  UNIQUE(job_id, "order")
);

CREATE INDEX idx_procedures_job_id ON procedures(job_id);

-- Execution Jobsheets Table
CREATE TABLE execution_jobsheets (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  state TEXT DEFAULT 'Pending' CHECK(state IN ('Pending', 'Approved', 'Processing', 'Completed')) NOT NULL,
  checked_in_by TEXT,
  checked_in_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (template_id) REFERENCES templates(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (checked_in_by) REFERENCES users(id)
);

CREATE INDEX idx_execution_jobsheets_state ON execution_jobsheets(state);
CREATE INDEX idx_execution_jobsheets_user_id ON execution_jobsheets(user_id);
CREATE INDEX idx_execution_jobsheets_created_at ON execution_jobsheets(created_at);
CREATE INDEX idx_execution_jobsheets_state_created ON execution_jobsheets(state, created_at);

-- Execution Jobs Table (runtime state per job in execution)
CREATE TABLE execution_jobs (
  id TEXT PRIMARY KEY,
  execution_id TEXT NOT NULL,
  job_id TEXT NOT NULL,
  expected_start DATETIME,
  expected_end DATETIME,
  actual_start DATETIME,
  actual_end DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (execution_id) REFERENCES execution_jobsheets(id),
  FOREIGN KEY (job_id) REFERENCES jobs(id),
  UNIQUE(execution_id, job_id)
);

CREATE INDEX idx_execution_jobs_execution_id ON execution_jobs(execution_id);

-- Job Completions Table (audit trail of job completion marks)
CREATE TABLE job_completions (
  id TEXT PRIMARY KEY,
  execution_id TEXT NOT NULL,
  job_id TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT 0,
  completed_by TEXT,
  completed_at DATETIME,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (execution_id) REFERENCES execution_jobsheets(id),
  FOREIGN KEY (job_id) REFERENCES jobs(id),
  FOREIGN KEY (completed_by) REFERENCES users(id),
  UNIQUE(execution_id, job_id)
);

CREATE INDEX idx_job_completions_execution_id ON job_completions(execution_id);
CREATE INDEX idx_job_completions_completed ON job_completions(completed);

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;
```

---

## Query Patterns

### Dashboard Queries

**Pending Templates** (for Manager):
```sql
SELECT t.id, t.name, t.user_id, u.name as creator, t.created_at, COUNT(j.id) as job_count
FROM templates t
JOIN users u ON t.created_by = u.id
LEFT JOIN jobs j ON t.id = j.template_id
WHERE t.state = 'Pending'
GROUP BY t.id
ORDER BY t.created_at DESC
LIMIT 50 OFFSET 0;
```

**Processing Execution Sheets** (for Operator):
```sql
SELECT e.id, e.name, t.name as template_name, e.checked_in_by, e.checked_in_at,
       COUNT(jc.id) as total_jobs, SUM(CASE WHEN jc.completed THEN 1 ELSE 0 END) as completed_jobs
FROM execution_jobsheets e
JOIN templates t ON e.template_id = t.id
LEFT JOIN jobs j ON t.id = j.template_id
LEFT JOIN job_completions jc ON e.id = jc.execution_id AND j.id = jc.job_id
WHERE e.state = 'Processing' AND e.user_id = ?
GROUP BY e.id
ORDER BY e.checked_in_at DESC;
```

**Completed Jobsheets with Progress** (for Review):
```sql
SELECT e.id, e.name, t.name as template_name, e.user_id, u.name as operator, e.completed_at,
       COUNT(j.id) as total_jobs, COUNT(jc.id) as completed_jobs
FROM execution_jobsheets e
JOIN templates t ON e.template_id = t.id
JOIN users u ON e.user_id = u.id
LEFT JOIN jobs j ON t.id = j.template_id
LEFT JOIN job_completions jc ON e.id = jc.execution_id AND j.id = jc.job_id AND jc.completed = 1
WHERE e.state = 'Completed'
GROUP BY e.id
ORDER BY e.completed_at DESC
LIMIT 50 OFFSET 0;
```

### Exclusive Check-In Guard

```sql
SELECT state, checked_in_by, checked_in_at FROM execution_jobsheets
WHERE id = ?;

-- If (state = 'Processing' AND checked_in_by != current_user_id):
-- REJECT with 409 Conflict

-- Else:
UPDATE execution_jobsheets
SET state = 'Processing', checked_in_by = ?, checked_in_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
WHERE id = ?;
```

---

**Data Model Phase Complete**: ✅ 6 normalized entities, state machines, query patterns, and DDL defined.

**Next**: API contracts and quickstart guide.
