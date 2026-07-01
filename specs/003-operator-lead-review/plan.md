# Implementation Plan: Operator Leader Review

**Phase**: 2 (Implementation) | **Date**: 2026-06-22  
**Status**: Draft | **Estimated Effort**: 3-5 days

## Overview

This plan outlines the implementation steps for the Operator Leader Review feature, including database migrations, backend API development, frontend UI development, and testing.

---

## Technical Context

### Dependencies

- **Existing Feature**: 001-jobsheet-management (jobsheet creation, execution, completion)
- **Authentication**: JWT-based auth with bcrypt password hashing (already implemented)
- **Database**: SQLite with existing schema (needs migration for leader review fields)
- **Frontend**: Next.js 14+ with React 18+, TypeScript, Tailwind CSS
- **Backend**: Node.js 18+, Express, TypeScript

### Architecture

```
┌─────────────────┐
│   Frontend      │
│  (Next.js App)  │
└────────┬────────┘
         │
         │ REST API (HTTPS)
         │
┌────────▼────────┐
│   Backend       │
│  (Express API)  │
└────────┬────────┘
         │
         │ SQLite
         │
┌────────▼────────┐
│   Database      │
│   (SQLite)      │
└─────────────────┘
```

### Key Files to Modify

**Backend**:
- `backend/src/db/schema.ts` - Add leader review columns
- `backend/src/models/job-completion.model.ts` - Add leader review methods
- `backend/src/routes/execution.routes.ts` - Add leader review endpoints
- `backend/src/services/execution.service.ts` - Add leader review logic
- `backend/src/middleware/logging.middleware.ts` - Add leader review logging

**Frontend**:
- `frontend/src/components/execution/LeaderReviewModal.tsx` - New component
- `frontend/src/components/execution/CheckInModal.tsx` - Modify to show leader review status
- `frontend/src/components/execution/CompleteSheetButton.tsx` - Add validation
- `frontend/src/services/execution.service.ts` - Add leader review API calls
- `frontend/src/app/(protected)/execution/[id]/page.tsx` - Integrate leader review UI

---

## Implementation Steps

### Phase 1: Database Migration (Estimated: 2-4 hours)

**Goal**: Add leader review columns to `job_completions` table

**Tasks**:

1. **Update Schema Definition**
   - File: `backend/src/db/schema.ts`
   - Add columns: `leader_reviewed`, `leader_reviewed_by`, `leader_reviewed_at`, `leader_review_ip`
   - Add indexes for efficient queries
   - Update foreign key constraints

2. **Create Migration Script**
   - File: `backend/src/db/migrations/003-add-leader-review-columns.ts`
   - Add ALTER TABLE statements
   - Add index creation
   - Test migration on fresh database and existing database

3. **Update Type Definitions**
   - File: `backend/src/types/index.ts`
   - Add `LeaderReview` interface
   - Update `JobCompletion` interface

**Acceptance Criteria**:
- [ ] Database schema includes leader review columns
- [ ] Migration script runs successfully on fresh and existing databases
- [ ] Indexes created for efficient queries
- [ ] Foreign key constraints enforced

---

### Phase 2: Backend API Development (Estimated: 6-8 hours)

**Goal**: Implement leader review endpoints and validation logic

**Tasks**:

1. **Create Leader Review Model**
   - File: `backend/src/models/job-completion.model.ts`
   - `recordLeaderReview(executionId, jobId, userId, ipAddress)`
   - `invalidateLeaderReview(executionId, jobId)`
   - `getLeaderReviewStatus(executionId, jobId)`
   - `getAllLeaderReviews(executionId)`
   - `allJobsLeaderReviewed(executionId)`

2. **Create Leader Review Service**
   - File: `backend/src/services/leader-review.service.ts` (new file)
   - `validateLeaderCredentials(userId, password)`
   - `submitLeaderReview(executionId, jobId, userId, password, ipAddress)`
   - `handleLeaderReviewTimeout(executionId, jobId)`

3. **Add Leader Review Routes**
   - File: `backend/src/routes/execution.routes.ts`
   - `POST /api/execution/:executionId/jobs/:jobId/leader-review`
   - `GET /api/execution/:executionId/jobs/:jobId/leader-review`
   - `GET /api/execution/:executionId/leader-review-summary`

4. **Modify Existing Routes**
   - File: `backend/src/routes/execution.routes.ts`
   - Update `POST /api/execution/:executionId/complete` to validate leader reviews
   - Update `PUT /api/execution/:executionId/jobs/:jobId` to invalidate leader review on modification

5. **Add Logging**
   - File: `backend/src/middleware/logging.middleware.ts`
   - Log leader review success/failure
   - Log jobsheet completion blocked events

6. **Add Validation**
   - File: `backend/src/middleware/validation.middleware.ts`
   - Validate leader review request body
   - Validate password field is present

**Acceptance Criteria**:
- [ ] All leader review endpoints implemented and tested
- [ ] Leader authentication validates password correctly
- [ ] Leader review invalidation works on job modification
- [ ] Jobsheet completion blocked when pending reviews exist
- [ ] Structured JSON logs include leader review actions
- [ ] Password validation uses existing bcrypt hashing (no lockout mechanism)

---

### Phase 3: Frontend UI Development (Estimated: 8-12 hours)

**Goal**: Implement leader review UI components and integration

**Tasks**:

1. **Create Leader Review Modal Component**
   - File: `frontend/src/components/execution/LeaderReviewModal.tsx` (new file)
   - Modal overlay and container
   - Password input field
   - Submit and cancel buttons
   - Error message display
   - Loading state
   - Timeout handling (5 minutes)

2. **Update Job Completion Checkbox**
   - File: `frontend/src/components/execution/CheckInModal.tsx` or create new `JobCompletionCheckbox.tsx`
   - Add leader review status indicator
   - Differentiate pending vs approved states
   - Show leader review info (name, timestamp)
   - Make checkbox read-only after leader review

3. **Update Jobsheet Completion Button**
   - File: `frontend/src/components/execution/CompleteSheetButton.tsx`
   - Add leader review validation
   - Show progress indicator (X of Y jobs reviewed)
   - Disable button with tooltip when reviews pending
   - Show error modal with pending job list

4. **Create Leader Review Summary Component**
   - File: `frontend/src/components/execution/LeaderReviewSummary.tsx` (new file)
   - Show overview of all leader reviews
   - List pending and approved jobs
   - Collapsible/expandable sections

5. **Add API Client Methods**
   - File: `frontend/src/services/execution.service.ts`
   - `submitLeaderReview(executionId, jobId, password)`
   - `getLeaderReviewStatus(executionId, jobId)`
   - `getLeaderReviewSummary(executionId)`

6. **Integrate into Jobsheet Page**
   - File: `frontend/src/app/(protected)/execution/[id]/page.tsx`
   - Add leader review modal
   - Add leader review summary panel
   - Update job cards with leader review status

7. **Add Accessibility**
   - Implement keyboard navigation
   - Add ARIA labels and roles
   - Ensure focus management
   - Test with screen reader

**Acceptance Criteria**:
- [ ] Leader review modal opens when clicking job completion checkbox
- [ ] Modal shows job details and password input
- [ ] Modal closes on success, shows error on failure
- [ ] Modal auto-closes after 5 minutes timeout
- [ ] Job completion checkbox shows leader review status
- [ ] Jobsheet completion button disabled with pending reviews
- [ ] Leader review summary panel displays correctly
- [ ] All components accessible via keyboard
- [ ] All components screen reader compatible

---

### Phase 4: Integration Testing (Estimated: 4-6 hours)

**Goal**: Test complete user flows and edge cases

**Tasks**:

1. **Unit Tests**
   - File: `backend/tests/unit/leader-review.test.ts`
   - Test leader review validation logic
   - Test password authentication
   - Test leader review invalidation

2. **Integration Tests**
   - File: `backend/tests/integration/leader-review.test.ts`
   - Test leader review API endpoints
   - Test jobsheet completion validation
   - Test leader review invalidation on job modification

3. **E2E Tests**
   - File: `frontend/tests/e2e/leader-review.spec.ts` (new file, using Playwright)
   - Test complete user flow (operator + leader)
   - Test timeout behavior
   - Test jobsheet completion blocking
   - Test keyboard navigation
   - Test error handling

4. **Accessibility Tests**
   - File: `frontend/tests/a11y/leader-review.spec.ts` (new file)
   - Automated axe-core testing
   - Manual keyboard testing
   - Manual screen reader testing

**Acceptance Criteria**:
- [ ] All unit tests pass (80%+ coverage)
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] All accessibility tests pass (axe-core)
- [ ] Manual accessibility testing completed
- [ ] Cross-browser testing completed (Chrome, Firefox, Safari, Edge)

---

### Phase 5: Documentation and Deployment (Estimated: 2-4 hours)

**Goal**: Document the feature and prepare for deployment

**Tasks**:

1. **Update API Documentation**
   - File: `specs/003-operator-lead-review/contracts.md`
   - Document all endpoints
   - Document request/response formats
   - Document error codes

2. **Update User Documentation**
   - Create user guide for operators and leaders
   - Create troubleshooting guide

3. **Update README**
   - File: `README.md`
   - Add feature description
   - Add setup instructions

4. **Create Migration Guide**
   - File: `MIGRATION.md`
   - Document database migration steps
   - Document rollback procedure

5. **Deploy to Staging**
   - Run database migration
   - Deploy backend
   - Deploy frontend
   - Verify feature works in staging

**Acceptance Criteria**:
- [ ] API documentation complete and accurate
- [ ] User documentation created
- [ ] README updated
- [ ] Migration guide created
- [ ] Feature deployed to staging
- [ ] Staging verification successful

---

## Risk Assessment

### High Risk

- **Data Loss**: Migration could corrupt existing data
  - **Mitigation**: Backup database before migration, test migration on copy
  - **Rollback**: Drop leader review columns, restore from backup

- **Security**: Password handling could be compromised
  - **Mitigation**: Use HTTPS only, never log passwords, use existing bcrypt hashing
  - **Rollback**: Revert to previous version, audit logs

### Medium Risk

- **Performance**: Leader review queries could be slow
  - **Mitigation**: Add indexes, test with large datasets
  - **Rollback**: Optimize queries, add caching

- **User Experience**: Modal timeout could frustrate users
  - **Mitigation**: Clear error message, easy restart
  - **Rollback**: Increase timeout duration

### Low Risk

- **Browser Compatibility**: Modal might not work in older browsers
  - **Mitigation**: Test in all supported browsers, provide fallback
  - **Rollback**: Disable feature for unsupported browsers

---

## Success Metrics

- **SC-001**: 100% of jobs in completed jobsheets have leader review records
- **SC-002**: Leader review authentication succeeds in under 2 seconds for 95% of attempts
- **SC-003**: Operators can identify pending leader reviews in under 5 seconds
- **SC-004**: Leader review dialog timeout prevents stale sessions after 5 minutes
- **SC-005**: Jobsheet completion is blocked 100% of the time when any job lacks leader review
- **SC-006**: Audit logs capture 100% of leader review actions
- **SC-007**: Leader review information is visible in completed jobsheet views with 100% accuracy
- **SC-008**: Leader review UI passes WCAG AA accessibility checks

---

## Rollout Plan

### Phase 1: Staging Deployment (Week 1)

- Deploy to staging environment
- Internal testing by development team
- Bug fixes and refinements

### Phase 2: Beta Deployment (Week 2)

- Deploy to beta environment
- Limited user testing (5-10 users)
- Collect feedback and fix issues

### Phase 3: Production Deployment (Week 3)

- Deploy to production environment
- Monitor for errors and performance issues
- Provide user training and support

### Phase 4: Full Rollout (Week 4)

- Enable feature for all users
- Monitor success metrics
- Collect user feedback for future improvements

---

## Open Questions

1. **Should there be an override mechanism for unavailable leaders?**
   - Impact: High (security vs. usability trade-off)
   - Decision: Defer to future feature (escalation workflow)

2. **Should leader review be required for all jobs or only critical jobs?**
   - Impact: Medium (scope and user experience)
   - Decision: All jobs for now (can be refined later)

3. **Should there be a "batch review" feature for leaders to review multiple jobs at once?**
   - Impact: Medium (complexity vs. usability)
   - Decision: Defer to future feature (per-job review first)

4. **Should IP address be required or optional?**
   - Impact: Low (privacy vs. audit trail)
   - Decision: Optional (record if available, don't block if not)

---

## Dependencies

- **Database Migration**: Must complete before API development
- **Backend API**: Must complete before frontend development
- **Frontend UI**: Must complete before integration testing
- **Testing**: Must complete before production deployment

---

## Estimated Timeline

| Phase | Duration | Start | End |
|-------|----------|-------|-----|
| Database Migration | 2-4 hours | Day 1 AM | Day 1 PM |
| Backend API | 6-8 hours | Day 1 PM | Day 2 PM |
| Frontend UI | 8-12 hours | Day 2 PM | Day 4 PM |
| Integration Testing | 4-6 hours | Day 4 PM | Day 5 AM |
| Documentation | 2-4 hours | Day 5 AM | Day 5 PM |
| **Total** | **22-34 hours** | **Day 1** | **Day 5** |

**Buffer**: 20% for unexpected issues = ~4-7 hours

**Total Estimated Time**: 26-41 hours (approximately 3-5 working days)
