# API Contract: Execution Jobsheets & State Transitions

**Phase**: 1 (Design) | **Version**: 1.0.0 | **Date**: 2026-06-17

Base URL: `http://localhost:3001/api`

All endpoints require `Authorization: Bearer <token>` header.

---

## GET /execution-sheets

List all Execution Jobsheets for the current user. Supports filtering by state.

**Query Parameters**:
- `state` (optional): 'Pending', 'Approved', 'Processing', 'Completed'
- `page` (optional, default 1): Page number
- `limit` (optional, default 50): Records per page

**Request**:
```
GET /execution-sheets?state=Processing&page=1&limit=50
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "status": 200,
  "data": [
    {
      "id": "exec-001",
      "name": "Daily Maint - June 17",
      "templateName": "Daily Maintenance",
      "state": "Processing",
      "checkedInBy": {
        "id": "user-001",
        "name": "John Operator"
      },
      "checkedInAt": "2026-06-17T08:00:00Z",
      "totalJobs": 3,
      "completedJobs": 1,
      "createdAt": "2026-06-17T07:30:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 50, "total": 12, "hasMore": false }
}
```

---

## GET /execution-sheets/:id

Retrieve a single Execution Jobsheet with all jobs, procedures, and completion status.

**Request**:
```
GET /execution-sheets/exec-001
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "status": 200,
  "data": {
    "id": "exec-001",
    "name": "Daily Maint - June 17",
    "templateName": "Daily Maintenance",
    "templateId": "tmpl-001",
    "state": "Processing",
    "checkedInBy": {
      "id": "user-001",
      "name": "John Operator"
    },
    "checkedInAt": "2026-06-17T08:00:00Z",
    "createdAt": "2026-06-17T07:30:00Z",
    "updatedAt": "2026-06-17T10:45:00Z",
    "jobs": [
      {
        "id": "job-001",
        "name": "Oil Change",
        "order": 1,
        "expectedStart": "2026-06-17T08:00:00Z",
        "expectedEnd": "2026-06-17T09:00:00Z",
        "actualStart": "2026-06-17T08:05:00Z",
        "actualEnd": null,
        "completed": true,
        "completedAt": "2026-06-17T08:45:00Z",
        "completedBy": { "id": "user-001", "name": "John Operator" },
        "procedures": [
          { "id": "proc-001", "name": "Drain old oil", "order": 1 },
          { "id": "proc-002", "name": "Refill with new oil", "order": 2 }
        ]
      },
      {
        "id": "job-002",
        "name": "Filter Replacement",
        "order": 2,
        "expectedStart": "2026-06-17T09:00:00Z",
        "expectedEnd": "2026-06-17T10:00:00Z",
        "completed": false,
        "procedures": [...]
      }
    ]
  }
}
```

---

## POST /execution-sheets

Create a new Execution Jobsheet by cloning an approved template.

**Request**:
```json
{
  "templateId": "tmpl-001",
  "name": "Daily Maint - June 17",
  "jobs": [
    {
      "jobId": "job-001",
      "expectedStart": "2026-06-17T08:00:00Z",
      "expectedEnd": "2026-06-17T09:00:00Z"
    },
    {
      "jobId": "job-002",
      "expectedStart": "2026-06-17T09:00:00Z",
      "expectedEnd": "2026-06-17T10:00:00Z"
    }
  ]
}
```

**Response** (201 Created):
```json
{
  "status": 201,
  "data": {
    "id": "exec-001",
    "name": "Daily Maint - June 17",
    "state": "Pending",
    "createdAt": "2026-06-17T07:30:00Z"
  },
  "message": "Execution jobsheet created successfully"
}
```

**Response** (422 Validation Error):
```json
{
  "status": 422,
  "code": "VALIDATION_ERROR",
  "message": "Validation failed",
  "details": [
    { "field": "templateId", "error": "Template not found or not approved" }
  ]
}
```

---

## POST /execution-sheets/:id/check-in

Check-in to an Execution Jobsheet. Transitions state to "Processing" and sets exclusive lock.

**Request**:
```
POST /execution-sheets/exec-001/check-in
Authorization: Bearer <token>
Content-Type: application/json
```

**Response** (200 OK):
```json
{
  "status": 200,
  "data": {
    "id": "exec-001",
    "state": "Processing",
    "checkedInBy": { "id": "user-001", "name": "John Operator" },
    "checkedInAt": "2026-06-17T08:00:00Z"
  },
  "message": "Checked in successfully"
}
```

**Response** (409 Conflict - already checked in by another user):
```json
{
  "status": 409,
  "code": "CONCURRENT_CHECKIN",
  "message": "Jobsheet is already checked in by John Smith at 2026-06-17T08:00:00Z. Please try again after they check out.",
  "checkedInBy": {
    "id": "user-002",
    "name": "John Smith"
  },
  "checkedInAt": "2026-06-17T08:00:00Z"
}
```

---

## POST /execution-sheets/:id/check-out

Check-out from an Execution Jobsheet. Transitions state back to "Pending", clears exclusive lock, preserves job progress.

**Request**:
```
POST /execution-sheets/exec-001/check-out
Authorization: Bearer <token>
Content-Type: application/json
```

**Response** (200 OK):
```json
{
  "status": 200,
  "data": {
    "id": "exec-001",
    "state": "Pending",
    "checkedOutAt": "2026-06-17T12:30:00Z",
    "jobsCompleted": 1,
    "jobsRemaining": 2,
    "message": "1 of 3 jobs completed. Progress saved."
  },
  "message": "Checked out successfully. Your progress has been saved."
}
```

**Response** (400 Bad Request - not currently checked in):
```json
{
  "status": 400,
  "code": "NOT_CHECKED_IN",
  "message": "You are not currently checked in to this jobsheet"
}
```

---

## POST /execution-sheets/:id/jobs/:jobId/complete

Mark a job as complete within an Execution Jobsheet.

**Request**:
```json
{
  "completed": true,
  "notes": "Equipment working normally"
}
```

**Response** (200 OK):
```json
{
  "status": 200,
  "data": {
    "jobId": "job-001",
    "completed": true,
    "completedAt": "2026-06-17T08:45:00Z",
    "completedBy": { "id": "user-001", "name": "John Operator" }
  },
  "message": "Job marked as complete"
}
```

**Response** (404 Not Found):
```json
{
  "status": 404,
  "code": "JOB_NOT_FOUND",
  "message": "Job not found in this execution sheet"
}
```

---

## POST /execution-sheets/:id/complete

Mark entire Execution Jobsheet as complete. Only allowed if all jobs are marked complete.

**Request**:
```
POST /execution-sheets/exec-001/complete
Authorization: Bearer <token>
Content-Type: application/json
```

**Response** (200 OK):
```json
{
  "status": 200,
  "data": {
    "id": "exec-001",
    "state": "Completed",
    "completedAt": "2026-06-17T10:30:00Z",
    "totalDuration": "02:30"
  },
  "message": "Execution jobsheet completed successfully"
}
```

**Response** (409 Conflict - not all jobs complete):
```json
{
  "status": 409,
  "code": "INCOMPLETE_JOBS",
  "message": "Cannot complete jobsheet. 2 of 3 jobs are not marked complete.",
  "jobsCompleted": 1,
  "jobsRemaining": 2
}
```

---

## State Transition Diagram

```
Pending
  ↓ (check-in by any operator)
Processing (exclusive access: checked_in_by set)
  ├─ (mark job complete) → [job_completions table updated]
  ├─ (check-out) → Pending [exclusive lock cleared, progress saved]
  └─ (all jobs complete + complete button) → Completed
  
Completed (terminal state)
```

---

**Contract Version**: 1.0.0 | **Status**: Complete
