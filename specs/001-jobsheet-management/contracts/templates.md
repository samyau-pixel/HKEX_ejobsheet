# API Contract: Jobsheet Templates

**Phase**: 1 (Design) | **Version**: 1.0.0 | **Date**: 2026-06-17

Base URL: `http://localhost:3001/api`

All endpoints require `Authorization: Bearer <token>` header.

---

## GET /templates

List all Jobsheet templates (pending + approved). Supports filtering by state.

**Query Parameters**:
- `state` (optional): 'Pending' or 'Approved'
- `page` (optional, default 1): Page number for pagination
- `limit` (optional, default 50): Records per page

**Request**:
```
GET /templates?state=Pending&page=1&limit=50
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "status": 200,
  "data": [
    {
      "id": "tmpl-001",
      "name": "Daily Maintenance",
      "description": "Standard daily maintenance checklist",
      "state": "Pending",
      "createdBy": {
        "id": "user-001",
        "name": "John Operator",
        "email": "john@company.com"
      },
      "createdAt": "2026-06-17T10:30:00Z",
      "jobCount": 3
    },
    {
      "id": "tmpl-002",
      "name": "Equipment Inspection",
      "description": null,
      "state": "Approved",
      "createdBy": { ... },
      "createdAt": "2026-06-16T15:45:00Z",
      "jobCount": 5
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 87,
    "hasMore": true
  }
}
```

**Response** (401 Unauthorized):
```json
{
  "status": 401,
  "code": "UNAUTHORIZED",
  "message": "Invalid or expired token"
}
```

---

## GET /templates/:id

Retrieve a single template with all jobs and procedures.

**Request**:
```
GET /templates/tmpl-001
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "status": 200,
  "data": {
    "id": "tmpl-001",
    "name": "Daily Maintenance",
    "description": "Standard daily maintenance checklist",
    "state": "Pending",
    "createdBy": {
      "id": "user-001",
      "name": "John Operator"
    },
    "createdAt": "2026-06-17T10:30:00Z",
    "updatedAt": "2026-06-17T11:00:00Z",
    "jobs": [
      {
        "id": "job-001",
        "name": "Oil Change",
        "description": "Change engine oil and filter",
        "order": 1,
        "expectedStart": "2026-06-18T08:00:00Z",
        "expectedEnd": "2026-06-18T09:00:00Z",
        "procedures": [
          {
            "id": "proc-001",
            "name": "Drain old oil",
            "description": "Locate drain plug, place container, unscrew plug",
            "order": 1
          },
          {
            "id": "proc-002",
            "name": "Refill with new oil",
            "description": "Insert new oil, check level, close cap",
            "order": 2
          }
        ]
      }
    ]
  }
}
```

**Response** (404 Not Found):
```json
{
  "status": 404,
  "code": "NOT_FOUND",
  "message": "Template not found"
}
```

---

## POST /templates

Create a new Jobsheet template (Pending state).

**Request**:
```json
{
  "name": "Daily Maintenance",
  "description": "Standard daily maintenance checklist",
  "jobs": [
    {
      "name": "Oil Change",
      "description": "Change engine oil and filter",
      "order": 1,
      "expectedStart": "2026-06-18T08:00:00Z",
      "expectedEnd": "2026-06-18T09:00:00Z",
      "procedures": [
        {
          "name": "Drain old oil",
          "description": "Locate drain plug, place container, unscrew plug",
          "order": 1
        },
        {
          "name": "Refill with new oil",
          "description": "Insert new oil, check level, close cap",
          "order": 2
        }
      ]
    }
  ]
}
```

**Response** (201 Created):
```json
{
  "status": 201,
  "data": {
    "id": "tmpl-001",
    "name": "Daily Maintenance",
    "state": "Pending",
    "createdAt": "2026-06-17T10:30:00Z"
  },
  "message": "Template created successfully"
}
```

**Response** (422 Unprocessable Entity - validation error):
```json
{
  "status": 422,
  "code": "VALIDATION_ERROR",
  "message": "Validation failed",
  "details": [
    { "field": "name", "error": "Template name is required" },
    { "field": "jobs", "error": "At least one job is required" }
  ]
}
```

---

## PUT /templates/:id

Update an existing Pending template (Approved templates are immutable).

**Request**:
```json
{
  "name": "Daily Maintenance v2",
  "description": "Updated checklist",
  "jobs": [ ... ]
}
```

**Response** (200 OK):
```json
{
  "status": 200,
  "data": {
    "id": "tmpl-001",
    "name": "Daily Maintenance v2",
    "updatedAt": "2026-06-17T11:30:00Z"
  },
  "message": "Template updated successfully"
}
```

**Response** (409 Conflict - template already approved):
```json
{
  "status": 409,
  "code": "CONFLICT",
  "message": "Cannot edit an approved template. Create a new template instead.",
  "currentState": "Approved"
}
```

---

## DELETE /templates/:id

Delete a Pending template.

**Request**:
```
DELETE /templates/tmpl-001
Authorization: Bearer <token>
```

**Response** (204 No Content):
```
(empty body)
```

**Response** (409 Conflict - template already approved):
```json
{
  "status": 409,
  "code": "CONFLICT",
  "message": "Cannot delete an approved template"
}
```

---

## POST /templates/:id/approve

Approve a Pending template (Manager only). Transitions state from Pending → Approved.

**Request**:
```
POST /templates/tmpl-001/approve
Authorization: Bearer <token>
Content-Type: application/json
```

**Response** (200 OK):
```json
{
  "status": 200,
  "data": {
    "id": "tmpl-001",
    "state": "Approved",
    "approvedAt": "2026-06-17T12:00:00Z",
    "approvedBy": {
      "id": "user-002",
      "name": "Jane Manager"
    }
  },
  "message": "Template approved successfully"
}
```

**Response** (403 Forbidden - not a Manager):
```json
{
  "status": 403,
  "code": "FORBIDDEN",
  "message": "Only Managers can approve templates"
}
```

**Response** (409 Conflict - already approved):
```json
{
  "status": 409,
  "code": "CONFLICT",
  "message": "Template is already approved"
}
```

---

**Contract Version**: 1.0.0 | **Status**: Complete
