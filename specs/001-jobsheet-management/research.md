# Research: Role-Based Jobsheet Management System

**Phase**: 0 (Research & Best Practices) | **Date**: 2026-06-17  
**Status**: Complete | **Input**: `plan.md` technical context

## Technology Stack Validation

### Frontend: Next.js (App Router) with React + TypeScript

**Decision**: ✅ **Confirmed appropriate for this use case**

**Rationale**:
- **App Router (Next.js 14+)**: Modern file-based routing, built-in middleware support for auth guards, server components reduce client-side JS overhead
- **React 18+**: Mature ecosystem, strong component libraries (Tailwind CSS, Headless UI), excellent for dashboard/form-heavy applications
- **TypeScript**: Catches type errors at build time, improves IDE experience, enables safe refactoring
- **Tailwind CSS**: Utility-first CSS, fast styling iteration, built-in accessibility best practices (focus states, color contrast utilities)

**Best Practices Applied**:
- Use Next.js `middleware.ts` for auth guards (check JWT token on protected routes)
- Leverage Server Components for data-fetching pages (template list, execution dashboards)
- Client Components for interactive forms (template creation, job marking)
- Implement error boundaries with `error.tsx` files per route
- Use `loading.tsx` for skeleton screens during data fetches
- Optimize images with `next/image` component
- Implement route-based code splitting (automatic)

**Accessibility (WCAG AA)**:
- Use semantic HTML: `<button>`, `<form>`, `<fieldset>`, `<legend>`
- Tailwind utility classes ensure 4.5:1 color contrast by default
- ARIA attributes for dynamic content: `role`, `aria-label`, `aria-describedby`
- Keyboard navigation: Tab through all interactive elements, Escape to close modals
- Testing: axe-core integration in tests, manual keyboard + screen reader verification

### Backend: Node.js/Express with TypeScript

**Decision**: ✅ **Confirmed appropriate for REST API**

**Rationale**:
- **Express**: Minimal, middleware-based, perfect for RESTful APIs with clear request/response handling
- **TypeScript**: Strong typing for API routes, models, services; catch errors before runtime
- **SQLite3**: Fast queries for <10GB data, zero operational overhead (embedded), perfect for single-server MVP

**Best Practices Applied**:
- Middleware stack: Auth validation → Input validation → Route handler → Error handler
- Service layer: Separate business logic (template.service.ts) from routes (templates.routes.ts)
- Model layer: Entity validation, type definitions, DB query builders
- Error handling: Centralized error middleware, consistent JSON error responses `{ status, message, code }`
- Logging: pino for structured JSON logging (timestamp, level, user ID, action, result)
- Request correlation: Correlation ID header (`X-Request-ID`) for tracing related logs

**Performance**:
- Connection pooling for SQLite (sqlite3 default is single connection; use better-sqlite3 for sync queries if <500ms latency critical)
- Pagination on dashboards (limit 50 records per page, offset-based)
- Indexed queries on frequently-filtered columns (state, user_id, created_at)
- Caching layer (optional, future): Redis for session tokens if scaling beyond 50 users

### Database: SQLite

**Decision**: ✅ **Confirmed appropriate for medium-scale application**

**Rationale**:
- **Embedded**: No separate DB server to manage, single-file backup, portable for development and testing
- **ACID compliance**: Transactions ensure data integrity during concurrent check-in/check-out operations
- **Performance**: <100ms queries for <10GB data with proper indexing
- **Scaling**: Sufficient for 50 concurrent users, <10,000 execution sheets

**Best Practices Applied**:
- Use connection pooling to manage concurrent connections
- Write-ahead logging (WAL) mode for better concurrency (default in recent versions)
- Indexed columns: `(state, created_at)` on execution_sheets table for efficient dashboard queries
- Foreign key constraints enabled: Ensure template_id, user_id references are valid
- Regular backups: Daily export/archive of 2-year-old records to cold storage (export as CSV/JSON)
- Schema migrations: Use migration scripts for future schema changes

**Retention Strategy**:
- 2-year active retention: Data accessed via dashboards and queries within 2 years
- Archive export: At 2-year mark, export completed execution sheets to JSON/CSV for long-term storage (cold storage, S3, or archive folder)
- Delete from active DB: Remove archived records from SQLite to keep DB size <10GB

---

## Best Practices: Workflow State Management

### Exclusive Check-In Pattern

**Pattern**: Single-operator exclusive access during execution

**Implementation**:
- Add `checked_in_by` (user_id) and `checked_in_at` (timestamp) columns to `execution_sheets` table
- On check-in attempt:
  1. Query current state: `SELECT state, checked_in_by FROM execution_sheets WHERE id = ?`
  2. If state is "Processing" and `checked_in_by` is not NULL and different user: reject with error
  3. If state is "Pending" or "Approved": transition to "Processing", set `checked_in_by` and `checked_in_at`, return success
  4. If already checked in by same user: allow continuation (idempotent)
- On check-out: set state to "Pending" (or specific "Paused" state if tracking), clear `checked_in_by`, save timestamp

**Benefits**: Prevents accidental concurrent edits, simplifies data model, matches real-world fieldwork (one operator per jobsheet).

### Persistent Partial Progress

**Pattern**: Save job completion status without requiring full completion

**Implementation**:
- Add `job_completions` table: `(execution_sheet_id, job_id, completed, completed_at, completed_by)`
- On mark job complete:
  1. Insert/update row in `job_completions` table
  2. Auto-save: Send to backend immediately (no manual "save" button)
  3. Return success; UI shows checkmark
- On resume (check-in again): Query `job_completions` for this execution sheet, hydrate UI with prior progress
- On complete all jobs: Transition execution sheet state to "Completed", archive timestamps

**Benefits**: No data loss on browser close, UX matches modern web apps (auto-save), supports multi-session workflows.

### State Transition Guards

**Pattern**: Enforce valid state transitions, reject invalid state changes

**Allowed Transitions**:
```
Pending → Approved (manager approval on templates only)
Pending → Processing (check-in on execution sheets only)
Processing → Pending (check-out on execution sheets only; job data preserved)
Processing → Completed (all jobs marked complete, explicit complete button)
Completed → (terminal state, no transitions)
```

**Implementation**:
- Define state machine in backend service: `canTransition(currentState, targetState, actor) => boolean`
- Validate transition before persisting database change
- Return 422 Unprocessable Entity if invalid transition attempted
- Log all state transitions in structured logs for audit trail

---

## Best Practices: API Design

### Consistent Error Response Format

**Pattern**: All errors return JSON with status, message, code

**Format**:
```json
{
  "status": 400,
  "message": "Validation failed: name is required",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "field": "name",
      "error": "name is required"
    }
  ]
}
```

**Codes**:
- `VALIDATION_ERROR` (400): Input validation failed
- `UNAUTHORIZED` (401): Missing or invalid JWT token
- `FORBIDDEN` (403): Authenticated but insufficient permission (e.g., Operator trying to approve template)
- `NOT_FOUND` (404): Resource doesn't exist
- `CONFLICT` (409): Concurrent access conflict (e.g., already checked in by another user)
- `INTERNAL_ERROR` (500): Server error

### Pagination on Dashboards

**Pattern**: Limit response size, enable efficient data fetching

**Format**:
```json
{
  "data": [ {...}, {...} ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 347,
    "hasMore": true
  }
}
```

**Queries**: `GET /templates?state=pending&page=1&limit=50`

**Benefits**: Prevents loading all 1000+ templates into memory, enables browser pagination UI, improves perceived performance.

---

## Best Practices: Testing Strategy

### Test Pyramid

**Unit Tests (60%)**:
- Service logic: Template creation validation, state transition guards, job completion logic
- Models: Entity serialization, validation rules, DB query builders
- Tools: Jest

**Integration Tests (30%)**:
- API endpoints: POST /templates → 201, /templates/:id/approve → 200, /sheets/:id/check-in → error if already checked in
- DB interactions: Create template → insert rows → query → verify structure
- Auth flow: Login → token → protected endpoint → 403 if token invalid
- Tools: Supertest + Jest

**End-to-End/UI Tests (10%)**:
- Critical user workflows: Login → create template → approve → create execution sheet → check-in → mark job → complete
- Accessibility: Keyboard navigation, screen reader compatibility, axe-core checks
- Tools: Cypress, React Testing Library, axe-core

### Test-First Development (TDD)

**Workflow per task**:
1. Write failing test: `expect(checkIn(sheetId, userId)).toReject("Already checked in")`
2. Run test: Verify it fails with expected error
3. Implement code: Add check-in logic to guard concurrent access
4. Run test: Verify it passes
5. Refactor: Optimize code structure, ensure tests still pass

**Benefits**: Ensures code is testable, catches bugs early, documents expected behavior, enables safe refactoring.

### Coverage Baseline

**Target**: 80% coverage for new code areas (Constitution II requirement)

**Measurement**: 
- Use `jest --coverage` to generate coverage report
- Exclude test files, setup files from coverage
- Focus on business logic (services, models), test less-critical utility functions as time permits
- CI check: Fail build if coverage drops below 80%

---

## Best Practices: Security

### Password Hashing

**Pattern**: Never store plaintext passwords

**Implementation**:
- Use `bcryptjs` library (bcrypt with JS implementation)
- Hash password on registration: `const hash = await bcrypt.hash(password, 10)` (10 salt rounds, ~100ms per hash)
- On login: `const match = await bcrypt.compare(password, hash)` (timing-safe comparison)
- Store hash in DB, never transmit password

### JWT Token Management

**Pattern**: Stateless authentication with signed tokens

**Implementation**:
- On login: Create JWT with `{ userId, role, iat, exp: now + 1h }`
- Sign with secret key: `jwt.sign(payload, SECRET, { algorithm: 'HS256' })`
- Send token in Authorization header: `Authorization: Bearer <token>`
- On protected route: Verify token signature and expiry
- Refresh flow (optional for MVP): Return refresh token with 7-day expiry, trade for new access token on expiry

### RBAC Implementation

**Pattern**: Role-based access control on each endpoint

**Implementation**:
- Middleware: Extract `role` from JWT token
- Route guards: `authorize(['Manager', 'Operator Leader'])` before handler
- Logic: Return 403 Forbidden if user role not in allowed list
- Audit: Log all role-based denials for security review

---

## Best Practices: Observability & Logging

### Structured JSON Logging

**Pattern**: Every action produces parseable JSON log line

**Format** (pino logger):
```json
{"level":30,"time":"2026-06-17T10:30:45.123Z","pid":1234,"hostname":"dev-machine","req":{"id":"uuid-correlation-id","method":"POST","url":"/api/sheets/123/check-in"},"userId":"user-456","action":"SHEET_CHECK_IN","result":"SUCCESS","duration_ms":42,"msg":"Jobsheet checked in"}
{"level":40,"time":"2026-06-17T10:31:05.456Z","pid":1234,"hostname":"dev-machine","req":{"id":"uuid-different-id"},"userId":"user-789","action":"SHEET_CHECK_IN","result":"CONFLICT","error":"Already checked in by user-456","msg":"Check-in rejected"}
```

**Fields**:
- `level`: 30=INFO, 40=WARN, 50=ERROR (pino levels)
- `time`: ISO timestamp
- `userId`: Who performed the action
- `action`: What happened (SHEET_CHECK_IN, TEMPLATE_CREATE, etc.)
- `result`: SUCCESS, CONFLICT, VALIDATION_ERROR, etc.
- `req.id`: Correlation ID for tracing related requests
- `error`: Error message if result != SUCCESS
- `duration_ms`: Latency of action

**Benefits**: Queryable by log aggregation tools (ELK, CloudWatch, Loki), enables alerting on errors, supports debugging via correlation IDs.

### Request Correlation IDs

**Pattern**: Trace related requests across frontend and backend

**Implementation**:
- Generate UUID on frontend before API call: `const correlationId = uuidv4()`
- Send header: `X-Request-ID: <correlationId>`
- Backend middleware extracts header, includes in pino context
- Log all related actions under same correlationId
- Return correlationId in response: `{ data: {...}, requestId: "<correlationId>" }`
- Frontend logs errors with requestId for support tickets

---

## Decision Log

| Decision | Chosen | Alternatives Considered | Rationale |
|----------|--------|------------------------|-----------|
| Auth mechanism | JWT tokens + secure cookies | Session store + Redis | Stateless, scalable, simple token refresh |
| Check-in model | Exclusive single access | Collaborative with conflict resolution | Simpler data model, matches fieldwork patterns, prevents UI confusion |
| Partial progress storage | `job_completions` table | Track in execution_sheets JSON blob | Normalized schema, easier to query individual job status |
| State machine | Explicit transitions in service | Implicit (any state to any) | Prevents invalid states, documents allowed workflows |
| Error format | Structured JSON with code + details | Generic string messages | Programmatic error handling, consistent API contract |
| Logging | Structured JSON (pino) | Plain text logs | Queryable, enables automation, supports log aggregation |
| Pagination | Offset-based (page/limit) | Cursor-based (after ID) | Simpler for typical office dashboards, acceptable for <100k records |
| Caching | None initially | Redis session store | Keep MVP simple; add if scaling beyond 50 users |

---

**Research Phase Complete**: ✅ All technology decisions validated, best practices documented, no blocking research items remain.

**Next**: Proceed to Phase 1 (Data Model, API Contracts, Quickstart)
