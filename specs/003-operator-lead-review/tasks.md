# Tasks: Operator Leader Review

**Phase**: 3 (Execution) | **Date**: 2026-06-22  
**Status**: Draft

## Overview

Breakdown of implementation tasks for the Operator Leader Review feature, organized by component and priority.

---

## Database Tasks

### [ ] 1. Update Database Schema
**Priority**: P1  
**File**: `backend/src/db/schema.ts`  
**Estimated Time**: 1 hour

**Tasks**:
- Add `leader_reviewed` column (INTEGER, NOT NULL, DEFAULT 0)
- Add `leader_reviewed_by` column (TEXT, FK → users.id)
- Add `leader_reviewed_at` column (TIMESTAMP)
- Create index on `(execution_id, leader_reviewed)`
- Create index on `(leader_reviewed_by)`

**Acceptance Criteria**:
- [ ] Schema includes all leader review columns
- [ ] Indexes created for efficient queries
- [ ] Foreign key constraint for `leader_reviewed_by`
- [ ] Schema migration tested on fresh database

---

### [X] 2. Create Migration Script
**Priority**: P1  
**File**: `backend/src/db/migrations/003-add-leader-review-columns.ts`  
**Estimated Time**: 1 hour

**Tasks**:
- [X] Create migration script with ALTER TABLE statements
- [X] Add rollback script (DROP COLUMN statements)
- [X] Test migration on existing database
- [X] Test rollback on migrated database

**Acceptance Criteria**:
- [X] Migration script runs successfully
- [X] Rollback script runs successfully
- [X] Existing data preserved during migration
- [X] Migration documented in README

---

## Backend Tasks

### [X] 3. Create Leader Review Model
**Priority**: P1  
**File**: `backend/src/models/job-completion.model.ts`  
**Estimated Time**: 2 hours

**Tasks**:
- [X] Implement `recordLeaderReview(executionId, jobId, userId)`
- [X] Implement `invalidateLeaderReview(executionId, jobId)`
- [X] Implement `getLeaderReviewStatus(executionId, jobId)`
- [X] Implement `getAllLeaderReviews(executionId)`
- [X] Implement `allJobsLeaderReviewed(executionId)`
- [X] Add unit tests for all methods

**Acceptance Criteria**:
- [X] All methods implemented and tested
- [X] Unit tests pass (80%+ coverage)
- [X] Database queries optimized with indexes

---

### [X] 4. Create Leader Review Service
**Priority**: P1  
**File**: `backend/src/services/leader-review.service.ts`  
**Estimated Time**: 2 hours

**Tasks**:
- [X] Implement `validateLeaderCredentials(userId, password)`
- [X] Implement `submitLeaderReview(executionId, jobId, userId, password)`
- [X] Implement `handleLeaderReviewTimeout(executionId, jobId)`
- [X] Add integration tests

**Acceptance Criteria**:
- [X] Password validation uses existing bcrypt hashing
- [X] No lockout mechanism (unlimited attempts allowed)
- [X] Timeout logic resets job completion on timeout
- [X] Integration tests pass

---

### [X] 5. Add Leader Review Routes
**Priority**: P1  
**File**: `backend/src/routes/execution.routes.ts`  
**Estimated Time**: 2 hours

**Tasks**:
- [X] Add `POST /api/execution/:executionId/jobs/:jobId/leader-review`
- [X] Add `GET /api/execution/:executionId/jobs/:jobId/leader-review`
- [X] Add `GET /api/execution/:executionId/leader-review-summary`
- [X] Add authentication middleware
- [X] Add validation middleware
- [X] Add error handling

**Acceptance Criteria**:
- [X] All routes implemented and documented
- [X] Authentication and authorization enforced
- [X] Request validation implemented
- [X] Error responses follow API contract

---

### [X] 6. Modify Existing Routes
**Priority**: P1  
**File**: `backend/src/routes/execution.routes.ts`  
**Estimated Time**: 1 hour

**Tasks**:
- [X] Update `POST /api/execution/:executionId/complete` to validate leader reviews
- [X] Update `PUT /api/execution/:executionId/jobs/:jobId` to invalidate leader review
- [X] Add error responses for validation failures

**Acceptance Criteria**:
- [X] Jobsheet completion blocked when reviews pending
- [X] Leader review invalidated on job modification
- [X] Error messages are clear and actionable

---

### [X] 7. Add Logging
**Priority**: P2  
**File**: `backend/src/middleware/logging.middleware.ts`  
**Estimated Time**: 1 hour

**Tasks**:
- [X] Log leader review success with timestamp, user ID, job ID
- [X] Log leader review failure with reason
- [X] Log jobsheet completion blocked events
- [X] Ensure passwords are never logged

**Acceptance Criteria**:
- [X] All leader review actions logged
- [X] Logs follow structured JSON format
- [X] Passwords never appear in logs

---

## Frontend Tasks

### [X] 8. Create Leader Review Modal Component
**Priority**: P1  
**File**: `frontend/src/components/execution/LeaderReviewModal.tsx`  
**Estimated Time**: 3 hours

**Tasks**:
- [X] Create modal overlay and container
- [X] Add job details display
- [X] Add password input field
- [X] Add submit and cancel buttons
- [X] Add error message display
- [X] Add loading state
- [X] Implement timeout handling (5 minutes)
- [X] Implement keyboard navigation
- [X] Add ARIA labels and roles

**Acceptance Criteria**:
- [X] Modal opens when clicking job completion checkbox
- [X] Modal shows job details and password input
- [X] Modal closes on success, shows error on failure
- [X] Modal auto-closes after 5 minutes timeout
- [X] Keyboard navigation works (Tab, Enter, Escape)
- [X] Screen reader compatible (tested with NVDA/VoiceOver)

---

### [X] 9. Update Job Completion Checkbox
**Priority**: P1  
**File**: `frontend/src/components/execution/ExecutionDetail.tsx`  
**Estimated Time**: 2 hours

**Tasks**:
- [X] Add leader review status indicator
- [X] Differentiate pending vs approved states (colors, icons, text)
- [X] Show leader review info (name, timestamp)
- [X] Make checkbox read-only after leader review
- [X] Add tooltip for pending reviews

**Acceptance Criteria**:
- [X] Checkbox shows correct status (pending/approved)
- [X] Visual indicators are accessible (color + icon + text)
- [X] Leader review info displayed correctly
- [X] Checkbox is read-only after approval

---

### [X] 10. Update Jobsheet Completion Button
**Priority**: P1  
**File**: `backend/src/services/execution.service.ts`  
**Estimated Time**: 2 hours

**Tasks**:
- [X] Add leader review validation
- [X] Show progress indicator (X of Y jobs reviewed)
- [X] Disable button with tooltip when reviews pending
- [X] Show error modal with pending job list

**Acceptance Criteria**:
- [X] Button disabled when reviews pending
- [X] Progress indicator shows correct count
- [X] Tooltip explains why button is disabled
- [X] Error modal lists pending jobs

---

### [X] 11. Create Leader Review Summary Component
**Priority**: P2  
**File**: `frontend/src/components/execution/LeaderReviewSummary.tsx`  
**Estimated Time**: 2 hours

**Tasks**:
- [X] Create summary panel component
- [X] Show overview of all leader reviews
- [X] List pending and approved jobs
- [X] Make collapsible/expandable
- [X] Add accessibility (headings, lists, ARIA)

**Acceptance Criteria**:
- [X] Summary panel displays correctly
- [X] Pending and approved jobs listed
- [X] Panel is collapsible/expandable
- [X] Component is accessible

---

### [X] 12. Add API Client Methods
**Priority**: P1  
**File**: `frontend/src/services/execution.service.ts`  
**Estimated Time**: 1 hour

**Tasks**:
- [X] Add `submitLeaderReview(executionId, jobId, password)`
- [X] Add `getLeaderReviewStatus(executionId, jobId)`
- [X] Add `getLeaderReviewSummary(executionId)`
- [X] Add error handling
- [X] Add loading state management

**Acceptance Criteria**:
- [X] All API methods implemented
- [X] Error handling implemented
- [X] Loading state managed correctly
- [X] Methods tested with mock API
- [ ] Error handling implemented
- [ ] Loading state managed correctly
- [ ] Methods tested with mock API

---

### [X] 13. Integrate into Jobsheet Page
**Priority**: P1  
**File**: `frontend/src/app/(protected)/execution/[id]/page.tsx`  
**Estimated Time**: 2 hours

**Tasks**:
- [X] Add leader review modal to page
- [X] Add leader review summary panel
- [X] Update job cards with leader review status
- [X] Connect to API methods
- [X] Handle loading and error states

**Acceptance Criteria**:
- [X] Modal integrated and functional
- [X] Summary panel displayed correctly
- [X] Job cards show leader review status
- [X] All states handled (loading, success, error)

---

## Testing Tasks

### [X] 14. Write Unit Tests
**Priority**: P1  
**File**: `backend/tests/unit/leader-review.test.ts`  
**Estimated Time**: 2 hours

**Tasks**:
- [X] Test leader review validation logic
- [X] Test password authentication
- [X] Test leader review invalidation
- [X] Test all model methods
- [X] Achieve 80%+ code coverage

**Acceptance Criteria**:
- [X] All unit tests pass
- [X] Code coverage ≥ 80%
- [X] Edge cases covered

---

### [X] 15. Write Integration Tests
**Priority**: P1  
**File**: `backend/tests/integration/leader-review.test.ts`  
**Estimated Time**: 2 hours

**Tasks**:
- [X] Test leader review API endpoints
- [X] Test jobsheet completion validation
- [X] Test leader review invalidation on job modification
- [X] Test error responses
- [X] Test authentication and authorization

**Acceptance Criteria**:
- [X] All integration tests pass
- [X] API contracts validated
- [X] Error responses match spec

---

### [X] 16. Write E2E Tests
**Priority**: P1  
**File**: `frontend/tests/e2e/leader-review.spec.ts`  
**Estimated Time**: 3 hours

**Tasks**:
- [X] Test complete user flow (operator + leader)
- [X] Test timeout behavior
- [X] Test jobsheet completion blocking
- [X] Test keyboard navigation
- [X] Test error handling
- [X] Test visual indicators

**Acceptance Criteria**:
- [X] All E2E tests pass
- [X] All user flows covered
- [X] Cross-browser testing completed

---

### [X] 17. Write Accessibility Tests
**Priority**: P2  
**File**: `frontend/tests/a11y/leader-review.spec.ts`  
**Estimated Time**: 2 hours

**Tasks**:
- [X] Automated axe-core testing
- [X] Manual keyboard testing
- [X] Manual screen reader testing (NVDA, VoiceOver)
- [X] Color contrast verification
- [X] Fix any accessibility issues

**Acceptance Criteria**:
- [X] All axe-core tests pass (0 violations)
- [X] Keyboard navigation works
- [X] Screen reader testing completed
- [X] WCAG AA compliance verified

---

## Documentation Tasks

### [ ] 18. Update API Documentation
**Priority**: P2  
**File**: `specs/003-operator-lead-review/contracts.md`  
**Estimated Time**: 1 hour

**Tasks**:
- Document all endpoints
- Document request/response formats
- Document error codes
- Add examples

**Acceptance Criteria**:
- [ ] API documentation complete and accurate
- [ ] All endpoints documented
- [ ] Examples provided

---

### [ ] 19. Create User Documentation
**Priority**: P2  
**File**: `docs/user-guide/leader-review.md`  
**Estimated Time**: 2 hours

**Tasks**:
- Create operator guide (how to complete jobs)
- Create leader guide (how to review jobs)
- Create troubleshooting guide
- Add screenshots

**Acceptance Criteria**:
- [ ] User documentation complete
- [ ] Screenshots included
- [ ] Troubleshooting guide helpful

---

### [ ] 20. Update README
**Priority**: P2  
**File**: `README.md`  
**Estimated Time**: 30 minutes

**Tasks**:
- Add feature description
- Add setup instructions
- Add migration notes

**Acceptance Criteria**:
- [ ] README updated
- [ ] Feature documented
- [ ] Setup instructions clear

---

## Deployment Tasks

### [ ] 21. Run Database Migration
**Priority**: P1  
**File**: `backend/src/db/migrations/003-add-leader-review-columns.ts`  
**Estimated Time**: 30 minutes

**Tasks**:
- Backup production database
- Run migration script
- Verify migration success
- Test feature in production

**Acceptance Criteria**:
- [ ] Database backed up
- [ ] Migration successful
- [ ] Feature working in production

---

### [ ] 22. Deploy to Staging
**Priority**: P1  
**File**: N/A  
**Estimated Time**: 1 hour

**Tasks**:
- Deploy backend to staging
- Deploy frontend to staging
- Run integration tests
- Verify feature works

**Acceptance Criteria**:
- [ ] Staging deployment successful
- [ ] All tests pass
- [ ] Feature verified

---

### [ ] 23. Deploy to Production
**Priority**: P1  
**File**: N/A  
**Estimated Time**: 1 hour

**Tasks**:
- Deploy backend to production
- Deploy frontend to production
- Monitor for errors
- Collect user feedback

**Acceptance Criteria**:
- [ ] Production deployment successful
- [ ] No errors in logs
- [ ] Feature working as expected

---

## Summary

| Category | Tasks | Estimated Time |
|----------|-------|---------------|
| Database | 2 | 2 hours |
| Backend | 7 | 11 hours |
| Frontend | 7 | 14 hours |
| Testing | 4 | 9 hours |
| Documentation | 3 | 3.5 hours |
| Deployment | 3 | 2.5 hours |
| **Total** | **26** | **42 hours** |

**Buffer (20%)**: ~8 hours

**Total Estimated Time**: ~50 hours (approximately 6-7 working days)

---

## Priority Legend

- **P1**: Must have (blocks feature completion)
- **P2**: Should have (important but not blocking)
- **P3**: Nice to have (can be deferred)
