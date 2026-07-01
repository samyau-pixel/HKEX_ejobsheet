# Feature Specification: Operator Leader Review

**Feature Branch**: `003-operator-lead-review`

**Created**: 2026-06-22

**Status**: Draft

**Input**: Add an operator leader review checkbox for every job in the execution jobsheet. When clicked, it shows a message dialog and input box for the operator lead to enter their password. All operator leader review checkboxes must be completed before a jobsheet can be marked as complete.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Operator Completes Jobs with Leader Review (Priority: P1)

Operator checks in to a jobsheet, completes all procedures in each job, and attempts to mark jobs as complete. At the point of job completion, the system requires Operator Leader review and authentication before the job can be marked as reviewed.

**Why this priority**: P1 is essential; this is the core workflow where leader review is enforced. Without this, the feature provides no value.

**Independent Test**: Can be fully tested by: (1) Operator logs in, (2) Checks in to an execution jobsheet, (3) Marks all procedures complete for a job, (4) Attempts to mark job complete, (5) Leader review dialog appears, (6) Leader enters password, (7) Job is marked as leader-reviewed. Delivers: job-level leader review with authentication.

**Acceptance Scenarios**:

1. **Given** Operator is viewing an execution jobsheet in Processing state, **When** they complete all procedures for a job and click the job completion checkbox, **Then** a leader review dialog appears requesting leader authentication.
2. **Given** the leader review dialog is displayed, **When** the Operator Leader enters their correct password and confirms, **Then** the job is marked as leader-reviewed and the checkbox becomes checked and read-only.
3. **Given** the leader review dialog is displayed, **When** the Operator Leader enters an incorrect password, **Then** an error message appears and the job remains unreviewed.
4. **Given** the leader review dialog is displayed, **When** the Operator Leader cancels the dialog, **Then** the job completion is reverted and the checkbox becomes unchecked.

---

### User Story 2 - Operator Leader Reviews Multiple Jobs (Priority: P1)

Operator Leader physically stands next to the Operator and reviews each completed job, authenticating with their password to confirm approval.

**Why this priority**: P1; this is the intended workflow ensuring physical presence and accountability.

**Independent Test**: Can be fully tested by: (1) Operator completes Job A, (2) Leader reviews and authenticates, (3) Operator completes Job B, (4) Leader reviews and authenticates again, (5) Verify both jobs show leader review timestamps and approver names. Delivers: multi-job review with audit trail.

**Acceptance Scenarios**:

1. **Given** multiple jobs are marked complete by the Operator, **When** the Operator Leader reviews each job sequentially, **Then** each job requires separate authentication and shows individual review timestamps.
2. **Given** a job has been leader-reviewed, **When** the Operator attempts to modify the job, **Then** the leader review is invalidated and the checkbox becomes unchecked.
3. **Given** the Operator Leader is reviewing a job, **When** they enter their password, **Then** the system validates the password using the existing authentication system and records the approver's name and timestamp.

---

### User Story 3 - Jobsheet Completion Requires All Leader Reviews (Priority: P1)

Operator attempts to mark the entire jobsheet as complete, but the system prevents completion until all jobs have been leader-reviewed.

**Why this priority**: P1; this is the enforcement mechanism ensuring no job slips through without leader approval.

**Independent Test**: Can be fully tested by: (1) Operator completes all jobs, (2) Leader reviews all but one job, (3) Operator attempts to complete jobsheet, (4) System blocks completion with clear error message, (5) Leader reviews final job, (6) Operator successfully completes jobsheet. Delivers: completion gate with clear user feedback.

**Acceptance Scenarios**:

1. **Given** an execution jobsheet has jobs that are not leader-reviewed, **When** the Operator clicks "Complete Jobsheet", **Then** the system displays an error: "All jobs must be reviewed by the Operator Leader before completion. [X] of [Y] jobs pending review."
2. **Given** all jobs in a jobsheet are leader-reviewed, **When** the Operator clicks "Complete Jobsheet", **Then** the jobsheet transitions to Completed state normally.
3. **Given** the jobsheet completion is blocked, **When** the Operator views the jobsheet, **Then** they can see which jobs are pending leader review via yellow/amber highlight and "Pending Review" badge.

---

### User Story 4 - Audit Trail for Leader Reviews (Priority: P2)

Manager or Operator Leader can view completed jobsheets and see who approved each job and when.

**Why this priority**: P2; provides accountability and audit capability but doesn't block core functionality.

**Independent Test**: Can be fully tested by: (1) Manager logs in, (2) Views a completed jobsheet, (3) Expands a job, **Then** sees leader review information including approver name, timestamp, and IP address (if available). Delivers: audit trail visibility.

**Acceptance Scenarios**:

1. **Given** a jobsheet is in Completed state, **When** Manager or Operator Leader views a job, **Then** they see "Approved by [Name] at [Timestamp]" below the job completion information.
2. **Given** a jobsheet is in Completed state, **When** Manager exports or prints the jobsheet, **Then** leader review information is included in the output.
3. **Given** multiple jobs have been reviewed, **When** viewing the jobsheet summary, **Then** a progress indicator shows "Leader Reviews: [X] of [Y] complete".

---

### Edge Cases

- **Leader Unavailable**: If the Operator Leader is unavailable (e.g., on break, left early), the jobsheet completion is blocked until the leader becomes available and completes the review. No escalation path or override mechanism exists.
- **Password Reset**: If the Operator Leader resets their password, does historical review data remain valid? (Yes - reviews are tied to user ID, not password)
- **Concurrent Reviews**: If two leaders attempt to review the same job simultaneously, optimistic locking prevents data corruption. The second review fails with error "Job already being reviewed" and requires the leader to refresh and retry.
- **Leader Becomes Inactive**: If an Operator Leader's account is deactivated, can they still be shown as approver in historical records? (Yes - user records are preserved for audit)
- **Review Timeout**: Should leader review dialogs timeout after a period of inactivity? (Recommended: 5-minute timeout for security)
- **Multiple Reviewers**: Different leaders can review different jobs on the same jobsheet. Each job is independent and can be reviewed by any Operator Leader.
- **Visual Indicators**: Jobs pending leader review are highlighted with yellow/amber background and display a "Pending Review" badge. Approved jobs show a green checkmark with approver name and timestamp.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display an "Operator Leader Review" checkbox for each job in an execution jobsheet.
- **FR-002**: System MUST require Operator Leader authentication (password entry) before marking a job as leader-reviewed.
- **FR-003**: System MUST prevent jobsheet completion if any jobs are not leader-reviewed.
- **FR-004**: System MUST record the approver's user ID, name, and timestamp for each leader review.
- **FR-005**: System MUST display clear visual indicators showing which jobs are pending leader review vs. approved.
- **FR-006**: System MUST invalidate leader review if the underlying job is modified after review.
- **FR-007**: System MUST use existing user authentication system (JWT + bcrypt password hashing) for leader authentication.
- **FR-008**: System MUST show a modal dialog with review confirmation message and password input when leader review is triggered.
- **FR-009**: System MUST display an error message with count of pending reviews when jobsheet completion is attempted with incomplete reviews.
- **FR-010**: System MUST include leader review information in jobsheet audit trail and export/print outputs.
- **FR-011**: System MUST allow different Operator Leaders to review different jobs on the same jobsheet.
- **FR-012**: System MUST prevent modification of leader-reviewed jobs without first invalidating the review.
- **FR-013**: System MUST log all leader review actions (success and failure) in structured JSON logs per constitution requirements.
- **FR-014**: System MUST support leader review dialog timeout after 5 minutes of inactivity for security.

### Non-Functional Requirements

- **NFR-001**: Leader review authentication MUST complete in under 2 seconds under normal load.
- **NFR-002**: Leader review UI MUST be accessible via keyboard navigation (Tab, Enter, Escape) per WCAG AA.
- **NFR-003**: Leader review dialog MUST include clear error messages for authentication failures.
- **NFR-004**: Leader review status MUST persist across browser refresh and check-out/check-in cycles.
- **NFR-005**: Leader review data MUST be immutable once recorded (except for invalidation on job modification).
- **NFR-006**: System MUST handle password validation securely (no password logging, use HTTPS only).
- **NFR-007**: Leader review UI MUST provide clear feedback during authentication (loading spinner, success/failure states).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of jobs in completed jobsheets have leader review records (no exceptions).
- **SC-002**: Leader review authentication succeeds in under 2 seconds for 95% of attempts.
- **SC-003**: Operators can identify pending leader reviews in under 5 seconds (visual scan of jobsheet).
- **SC-004**: Leader review dialog timeout prevents stale sessions after 5 minutes of inactivity.
- **SC-005**: Jobsheet completion is blocked 100% of the time when any job lacks leader review.
- **SC-006**: Audit logs capture 100% of leader review actions (success and failure) with timestamp, user ID, and job ID.
- **SC-007**: Leader review information is visible in completed jobsheet views with 100% accuracy (approver name and timestamp match database).
- **SC-008**: Leader review UI passes WCAG AA accessibility checks (keyboard navigation, ARIA labels, error messages).

## Clarifications

### Session 2026-06-22

- Q: Should the leader review be per-job or per-jobsheet? → A: Per-job. Each job requires individual leader review and authentication.
- Q: Can the same leader review multiple jobs in sequence without re-entering password? → A: No. Each job requires separate authentication to ensure deliberate review of each job.
- Q: What happens if a job is modified after leader review? → A: Leader review is invalidated, checkbox becomes unchecked, and job requires re-review.
- Q: Can different leaders review different jobs on the same jobsheet? → A: Yes. Each job is independent and can be reviewed by any Operator Leader.
- Q: Should there be a timeout for the leader review dialog? → A: Yes. 5-minute timeout for security to prevent stale authentication.
- Q: How is physical presence enforced? → A: Through workflow design (leader physically stands next to operator) and per-job authentication. No technical enforcement of physical presence.
- Q: Should IP address be stored in the audit trail? → A: No. Only user ID, name, and timestamp are recorded. IP address is NOT stored for privacy compliance.
- Q: What happens if the Operator Leader is unavailable? → A: Jobsheet completion is blocked until the leader becomes available. No escalation path or override mechanism exists.
- Q: What happens if two leaders attempt to review the same job simultaneously? → A: Optimistic locking is used. The second review fails with error "Job already being reviewed" and requires refresh.
- Q: What visual indicator shows jobs pending leader review? → A: Yellow/amber highlight with "Pending Review" badge for clear, non-alarmist visual feedback.
- Q: Should there be a lockout mechanism for failed authentication attempts? → A: No lockout. Unlimited attempts are allowed. This aligns with the physical presence requirement (leader is physically present) and avoids blocking legitimate reviews.

## Assumptions

- **Authentication**: Leader review uses existing user authentication system with password validation. No additional authentication mechanisms (biometrics, 2FA) are required.
- **Physical Presence**: The workflow assumes the Operator Leader is physically present when reviewing. This is enforced through process, not technology.
- **Password Security**: Passwords are transmitted over HTTPS only and never logged. Password validation uses existing bcrypt hashing.
- **User Roles**: Operator Leader role is already defined in the system. No new roles are created for this feature.
- **Review Invalidation**: Job modification (if allowed) automatically invalidates leader review. This requires tracking job modification timestamps.
- **UI Pattern**: Leader review is triggered when the Operator attempts to mark a job as complete. The review dialog is modal and blocks further action until resolved.
- **Audit Trail**: Leader review information is stored in the database and included in jobsheet exports/prints. No separate audit log table is required (uses existing logging infrastructure). **IP address is NOT stored** - only user ID, name, and timestamp are recorded for privacy compliance.
- **Timeout Behavior**: Leader review dialog times out after 5 minutes of inactivity, reverting the job completion and requiring restart.
- **Error Handling**: Authentication failures show generic error messages ("Invalid password") without revealing account existence. No lockout mechanism exists - unlimited attempts are allowed since the leader is physically present.
- **Browser Support**: Leader review dialog works in all supported browsers (Chrome, Firefox, Safari, Edge) with JavaScript enabled.
- **Data Retention**: Leader review records are retained for the same duration as jobsheet data (2 years live, then archived).
