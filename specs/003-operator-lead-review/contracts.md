# API Contracts: Operator Leader Review

**Phase**: 2 (Implementation) | **Date**: 2026-06-22  
**Status**: Draft

## Overview

New API endpoints for leader review operations and modifications to existing endpoints to support leader review validation.

---

## New Endpoints

### Submit Leader Review

**Endpoint**: `POST /api/execution/:executionId/jobs/:jobId/leader-review`

**Description**: Submit leader review authentication and approval for a specific job.

**Authentication**: Required (JWT token)

**Authorization**: Operator or Operator Leader role

**Request Body**:
```typescript
{
  password: string;  // Leader's password for authentication
}
```

**Path Parameters**:
- `executionId`: UUID of the execution jobsheet
- `jobId`: UUID of the job to review

**Success Response** (200):
```typescript
{
  success: true,
  data: {
    jobId: string,
    executionId: string,
    leaderReviewed: true,
    leaderReviewedBy: string,
    leaderReviewedByName: string,
    leaderReviewedAt: string,  // ISO 8601 timestamp
    leaderReviewIp: string
  }
}
```

**Error Responses**:

**400 - Invalid Request**:
```typescript
{
  success: false,
  error: {
    code: 'INVALID_REQUEST',
    message: 'Password is required'
  }
}
```

**401 - Authentication Failed**:
```typescript
{
  success: false,
  error: {
    code: 'INVALID_CREDENTIALS',
    message: 'Invalid password or user not found'
  }
}
```

**403 - Not Authorized**:
```typescript
{
  success: false,
  error: {
    code: 'NOT_OPERATOR_LEADER',
    message: 'User does not have Operator Leader role'
  }
}
```

**409 - Job Not Ready for Review**:
```typescript
{
  success: false,
  error: {
    code: 'JOB_NOT_COMPLETED',
    message: 'Job must be marked complete before leader review'
  }
}
```

**500 - Server Error**:
```typescript
{
  success: false,
  error: {
    code: 'INTERNAL_ERROR',
    message: 'Failed to record leader review'
  }
}
```

**Example Request**:
```bash
curl -X POST https://api.example.com/api/execution/exec-001/jobs/job-001/leader-review \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{"password": "leader_password123"}'
```

---

### Get Leader Review Status

**Endpoint**: `GET /api/execution/:executionId/jobs/:jobId/leader-review`

**Description**: Get the leader review status for a specific job.

**Authentication**: Required (JWT token)

**Authorization**: Any authenticated user

**Path Parameters**:
- `executionId`: UUID of the execution jobsheet
- `jobId`: UUID of the job

**Success Response** (200):
```typescript
{
  success: true,
  data: {
    jobId: string,
    executionId: string,
    leaderReviewed: boolean,
    leaderReviewedBy: string | null,
    leaderReviewedByName: string | null,
    leaderReviewedAt: string | null,  // ISO 8601 timestamp
    leaderReviewIp: string | null
  }
}
```

**Example Response**:
```json
{
  "success": true,
  "data": {
    "jobId": "job-001",
    "executionId": "exec-001",
    "leaderReviewed": true,
    "leaderReviewedBy": "user-002",
    "leaderReviewedByName": "Jane Leader",
    "leaderReviewedAt": "2026-06-22T08:50:00Z",
    "leaderReviewIp": "192.168.1.100"
  }
}
```

---

### Get Jobsheet Leader Review Summary

**Endpoint**: `GET /api/execution/:executionId/leader-review-summary`

**Description**: Get summary of leader review status for all jobs in a jobsheet.

**Authentication**: Required (JWT token)

**Authorization**: Any authenticated user

**Path Parameters**:
- `executionId`: UUID of the execution jobsheet

**Success Response** (200):
```typescript
{
  success: true,
  data: {
    executionId: string,
    totalJobs: number,
    reviewedJobs: number,
    pendingReviews: number,
    allReviewed: boolean,
    reviews: [
      {
        jobId: string,
        jobName: string,
        leaderReviewed: boolean,
        leaderReviewedBy: string | null,
        leaderReviewedByName: string | null,
        leaderReviewedAt: string | null
      }
    ]
  }
}
```

**Example Response**:
```json
{
  "success": true,
  "data": {
    "executionId": "exec-001",
    "totalJobs": 5,
    "reviewedJobs": 3,
    "pendingReviews": 2,
    "allReviewed": false,
    "reviews": [
      {
        "jobId": "job-001",
        "jobName": "Oil Change",
        "leaderReviewed": true,
        "leaderReviewedBy": "user-002",
        "leaderReviewedByName": "Jane Leader",
        "leaderReviewedAt": "2026-06-22T08:50:00Z"
      },
      {
        "jobId": "job-002",
        "jobName": "Filter Replacement",
        "leaderReviewed": false,
        "leaderReviewedBy": null,
        "leaderReviewedByName": null,
        "leaderReviewedAt": null
      }
    ]
  }
}
```

---

## Modified Endpoints

### Complete Jobsheet (Modified)

**Endpoint**: `POST /api/execution/:executionId/complete`

**Description**: Mark an execution jobsheet as complete. **NEW**: Now validates that all jobs have leader review.

**Authentication**: Required (JWT token)

**Authorization**: Operator or Operator Leader role

**Path Parameters**:
- `executionId`: UUID of the execution jobsheet

**Success Response** (200):
```typescript
{
  success: true,
  message: 'Jobsheet completed successfully',
  data: {
    executionId: string,
    completedAt: string,
    completedBy: string
  }
}
```

**Error Response - Missing Leader Reviews** (409):
```typescript
{
  success: false,
  error: {
    code: 'PENDING_LEADER_REVIEWS',
    message: 'All jobs must be reviewed by the Operator Leader before completion',
    details: {
      pendingReviews: 2,
      totalJobs: 5,
      pendingJobIds: ['job-002', 'job-004']
    }
  }
}
```

**Example Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "PENDING_LEADER_REVIEWS",
    "message": "All jobs must be reviewed by the Operator Leader before completion",
    "details": {
      "pendingReviews": 2,
      "totalJobs": 5,
      "pendingJobIds": ["job-002", "job-004"]
    }
  }
}
```

---

### Update Job (Modified)

**Endpoint**: `PUT /api/execution/:executionId/jobs/:jobId`

**Description**: Update job execution details. **NEW**: Invalidates leader review if job is modified after review.

**Authentication**: Required (JWT token)

**Authorization**: Operator or Operator Leader role

**Path Parameters**:
- `executionId`: UUID of the execution jobsheet
- `jobId`: UUID of the job

**Request Body**:
```typescript
{
  expected_start?: string,  // ISO 8601 timestamp
  expected_end?: string,    // ISO 8601 timestamp
  notes?: string
}
```

**Success Response** (200):
```typescript
{
  success: true,
  message: 'Job updated successfully',
  data: {
    jobId: string,
    executionId: string,
    expected_start: string,
    expected_end: string,
    notes: string,
    leaderReviewInvalidated: boolean  // NEW: true if review was invalidated
  }
}
```

**Example Response with Leader Review Invalidation**:
```json
{
  "success": true,
  "message": "Job updated successfully",
  "data": {
    "jobId": "job-001",
    "executionId": "exec-001",
    "expected_start": "2026-06-22T08:00:00Z",
    "expected_end": "2026-06-22T09:00:00Z",
    "notes": "Updated due to equipment delay",
    "leaderReviewInvalidated": true
  }
}
```

---

## Logging Requirements

All leader review actions MUST be logged in structured JSON format:

**Leader Review Success**:
```json
{"timestamp":"2026-06-22T08:50:00Z","userId":"user-002","action":"LEADER_REVIEW_SUCCESS","resourceType":"job","resourceId":"job-001","executionId":"exec-001","ipAddress":"192.168.1.100","status":"success"}
```

**Leader Review Failure (Invalid Password)**:
```json
{"timestamp":"2026-06-22T08:51:00Z","userId":"user-003","action":"LEADER_REVIEW_FAILURE","resourceType":"job","resourceId":"job-001","executionId":"exec-001","ipAddress":"192.168.1.105","status":"failed","reason":"invalid_credentials"}
```

**Leader Review Failure (Job Not Completed)**:
```json
{"timestamp":"2026-06-22T08:52:00Z","userId":"user-002","action":"LEADER_REVIEW_FAILURE","resourceType":"job","resourceId":"job-002","executionId":"exec-001","ipAddress":"192.168.1.100","status":"failed","reason":"job_not_completed"}
```

**Jobsheet Completion Blocked**:
```json
{"timestamp":"2026-06-22T09:00:00Z","userId":"user-001","action":"JOBSHEET_COMPLETION_BLOCKED","resourceType":"execution","resourceId":"exec-001","ipAddress":"192.168.1.100","status":"failed","reason":"pending_leader_reviews","pendingReviews":2,"totalJobs":5}
```

---

## Rate Limiting

- Leader review authentication: Max 5 attempts per 10 minutes per user per job (prevent brute force)
- Leader review status queries: No rate limit (read-only)
- Jobsheet completion: No rate limit

---

## Security Considerations

1. **Password Transmission**: Passwords MUST be transmitted over HTTPS only.
2. **Password Logging**: Passwords MUST NEVER be logged in any form.
3. **IP Address Recording**: IP address is recorded for audit purposes but MUST be masked in logs (last octet replaced with XXX).
4. **Session Timeout**: Leader review dialog MUST timeout after 5 minutes of inactivity.
5. **Error Messages**: Generic error messages for authentication failures to prevent user enumeration.
6. **JWT Validation**: All endpoints MUST validate JWT token and check user role.
7. **SQL Injection**: Use parameterized queries for all database operations.

---

## Frontend Integration

### Leader Review Modal Component

**Props**:
```typescript
interface LeaderReviewModalProps {
  isOpen: boolean;
  jobId: string;
  executionId: string;
  jobName: string;
  onClose: () => void;
  onSuccess: () => void;
  onError: (error: string) => void;
}
```

**UI Flow**:
1. User clicks job completion checkbox
2. Modal opens with message: "Operator Leader Review Required"
3. Leader enters password
4. Submit button triggers API call
5. Success: Modal closes, checkbox becomes checked and read-only
6. Failure: Error message displayed, password field cleared

**Timeout Behavior**:
- Modal auto-closes after 5 minutes of inactivity
- User must restart the review process
- Inactivity timer resets on any user interaction

---

## Testing Requirements

### Unit Tests
- Leader review validation logic
- Password authentication
- Leader review invalidation on job modification
- Jobsheet completion validation

### Integration Tests
- Leader review API endpoint
- Jobsheet completion with pending reviews
- Leader review status queries

### E2E Tests
- Operator completes job, leader reviews
- Jobsheet completion blocked with pending reviews
- Leader review timeout behavior
- Multiple leaders reviewing different jobs
