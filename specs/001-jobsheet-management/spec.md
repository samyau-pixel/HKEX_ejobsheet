# Feature Specification: Role-Based Jobsheet Management System

**Feature Branch**: `001-jobsheet-management`

**Created**: 2026-06-17

**Status**: Draft

**Input**: User description: Web application for managing job templates and execution workflows with role-based access (Manager, Operator Leader, Operator)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Operator Creates Jobsheet Template (Priority: P1)

Operator logs in and creates a new Jobsheet template by defining jobs with procedures and scheduling information. This is the foundational workflow where templates are authored.

**Why this priority**: P1 is essential; all execution workflows depend on having templates to clone from. This is the source of truth for job definitions.

**Independent Test**: Can be fully tested by: (1) User logs in as Operator, (2) Creates a template with multiple jobs/procedures, (3) Saves and verifies persistence. Delivers: functional template creation with data durability.

**Acceptance Scenarios**:

1. **Given** Operator is logged in on the Jobsheet dashboard, **When** they click "Create Jobsheet Template", **Then** a form appears with fields for template name and job section.
2. **Given** template creation form is open, **When** Operator adds a Job and fills in procedures, expected start date/time, and expected completion date/time, **Then** the job is added to the template preview.
3. **Given** multiple jobs are added, **When** Operator clicks "Submit", **Then** the template is saved in "Pending" state and appears in the "Pending Templates" dashboard.
4. **Given** a template in "Pending" state, **When** Operator views it, **Then** they can edit or delete it before manager approval.

---

### User Story 2 - Manager Reviews and Approves Template (Priority: P2)

Manager logs in and reviews pending Jobsheet templates. After verification, they approve templates, which transitions them to "Approved" state for operator use.

**Why this priority**: P2 depends on P1 (templates must exist before review). Manager approval is a gating mechanism ensuring quality templates for operators.

**Independent Test**: Can be fully tested by: (1) Manager logs in, (2) Reviews a pending template, (3) Clicks approve, (4) Verifies state transition and appearance in approved dashboard. Delivers: workflow gate and template quality assurance.

**Acceptance Scenarios**:

1. **Given** Manager is logged in, **When** they click "Jobsheet Templates", **Then** they see dashboards for both "Pending Templates" and "Approved Templates".
2. **Given** pending templates exist, **When** Manager clicks a template, **Then** all details (name, jobs, procedures, dates) are displayed in read-only format.
3. **Given** Manager has reviewed a template, **When** they click "Approve", **Then** the template transitions to "Approved" state and moves to the approved dashboard.
4. **Given** a template is approved, **When** Operators view the template list, **Then** they see it in the approved templates section for cloning.

---

### User Story 3 - Operator Executes Assigned Execution Jobsheet (Priority: P1)

Operator receives an Execution Jobsheet (created by Manager/OperatorLeader) and performs check-in/check-out operations, progressing through jobs and marking them complete.

**Why this priority**: P1; essential for beginning job execution. Operators must be able to execute assigned jobsheets with job-specific scheduling.

**Independent Test**: Can be fully tested by: (1) Operator receives assigned execution jobsheet, (2) Checks in and customizes job dates, (3) Verifies it appears in "Processing" dashboard. Delivers: execution workflow and customizable scheduling.

**Acceptance Scenarios**:

1. **Given** Operator is on Processing Jobsheet page, **When** they view assigned execution jobsheets, **Then** they see a list of jobsheets available for check-in.
2. **Given** an execution jobsheet is selected, **When** Operator checks in, **Then** they can customize the template name and adjust expected start/end dates for each job.
3. **Given** check-in is complete, **When** Operator clicks "Check-In", **Then** the Execution Jobsheet state changes to "Processing" with check-in/check-out buttons available.
4. **Given** execution sheet is checked in, **When** Operator views the Processing dashboard, **Then** the sheet appears with job completion checkboxes available.
5. **Given** Operator is viewing an execution jobsheet, **When** they attempt to create a new execution jobsheet, **Then** the option is not available (execution jobsheet creation is restricted to Manager/OperatorLeader roles).

---

### User Story 4 - Operator Executes and Completes Jobsheet (Priority: P1)

Operator checks in to an Execution Jobsheet, progresses through jobs (marking procedures as completed), and submits the sheet for completion.

**Why this priority**: P1; core value delivery. This is the primary work loop where operators execute jobs.

**Independent Test**: Can be fully tested by: (1) Operator checks in, (2) Expands jobs, marks procedures complete, (3) Marks all jobs complete, (4) Completes sheet, (5) Verifies transition to "Completed" dashboard. Delivers: full execution workflow and state transitions.

**Acceptance Scenarios**:

1. **Given** Execution Jobsheet is in Processing dashboard, **When** Operator clicks "Check-In", **Then** sheet state changes to "Processing" and check-in/check-out buttons appear.
2. **Given** sheet is checked in, **When** Operator clicks a Job, **Then** all procedures for that job are displayed.
3. **Given** procedures are displayed, **When** Operator marks procedures as completed (not in system, but tracked in checkbox), **Then** the completion checkbox for that job becomes available.
4. **Given** all jobs are marked complete, **When** Operator clicks "Complete Jobsheet", **Then** the sheet transitions to "Completed" state and moves to the Completed dashboard.

---

### User Story 5 - Operator Partial Execution with Checkout (Priority: P2)

Operator checks in, completes some jobs, then checks out without finishing all jobs. Data persists, allowing resumed work later.

**Why this priority**: P2 depends on P1 (check-in/check-out flow). Handles real-world scenarios where work cannot complete in one session.

**Independent Test**: Can be fully tested by: (1) Check-in, (2) Mark partial jobs complete, (3) Check-out, (4) Verify data saved, (5) Check-in again, (6) Verify prior progress preserved. Delivers: session persistence and resumability.

**Acceptance Scenarios**:

1. **Given** Operator is executing a jobsheet and has marked some jobs complete, **When** they click "Check-Out", **Then** all progress is saved automatically.
2. **Given** a jobsheet has been checked out mid-execution, **When** Operator checks in the same jobsheet again, **Then** all previously marked jobs remain complete and partial progress is visible.
3. **Given** jobsheet is checked out before completion, **When** viewing the Processing dashboard, **Then** the jobsheet still appears with its current progress visible.
4. **Given** jobsheet is resumed, **When** all remaining jobs are marked complete and Operator clicks "Complete", **Then** state transitions to "Completed" normally.

---

### User Story 6 - Manager/Operator Leader Reviews Completed Jobsheet (Priority: P3)

Manager or Operator Leader logs in and views completed Execution Jobsheets to review final job data and status.

**Why this priority**: P3 is non-blocking reporting/audit functionality. Depends on P1 workflows being complete, but doesn't affect core execution.

**Independent Test**: Can be fully tested by: (1) User logs in as Manager/Leader, (2) Views completed jobsheets, (3) Opens one to review details. Delivers: audit trail and reporting visibility.

**Acceptance Scenarios**:

1. **Given** Manager/Operator Leader is logged in, **When** they click "Completed Jobsheets", **Then** a dashboard appears with all completed Execution Jobsheets.
2. **Given** completed jobsheets are displayed, **When** they click a jobsheet, **Then** all job and procedure details are shown with completion status and actual dates/times (if available).
3. **Given** a completed jobsheet is open, **When** Manager/Operator Leader views it, **Then** they can print or export the data for records.
4. **Given** a Manager is reviewing, **When** they view a completed sheet, **Then** they have ability to archive or mark for further action.

---

### Edge Cases

- **Concurrent Check-In**: When an Operator attempts to check-in to a jobsheet already checked in by another Operator, the system MUST reject the attempt and display error: "Jobsheet already checked in by [User] at [Timestamp]. Please try again after they check out."
- How does the system handle if an Operator closes the browser without checking out during active execution?
- What happens when expected start/end dates are in the past when creating an Execution Jobsheet?
- How are role-based permissions enforced if a user URL-navigates directly to pages they shouldn't access?
- What happens if a Job/Procedure is deleted from a template after Execution Jobsheets have been created from it?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support three user roles (Manager, Operator Leader, Operator) with distinct permissions and workflows.
- **FR-002**: Manager role MUST be able to approve/reject Jobsheet templates and review all completed sheets.
- **FR-003**: Operator role MUST be able to view assigned Execution Jobsheets and perform check-in/check-out operations. Operators CANNOT create or edit Jobsheet templates. Operators CANNOT create Execution Jobsheets.
- **FR-004**: Operator Leader role MUST be able to create Jobsheet templates, create Execution Jobsheets from templates, perform check-in/check-out operations, and review completed sheets (same as Operator + Manager review permissions).
- **FR-005**: System MUST support Jobsheet template states (Pending, Approved) and persist all template metadata.
- **FR-006**: System MUST support Execution Jobsheet states (Pending, Approved, Processing, Completed).
- **FR-007**: System MUST allow Manager/OperatorLeader to clone approved templates into Execution Jobsheets with customizable job dates/times.
- **FR-008**: System MUST support check-in/check-out functionality for Execution Jobsheets with automatic data persistence.
- **FR-009**: System MUST allow Operators to mark individual jobs as complete via checkboxes and mark entire Execution Jobsheet as complete.
- **FR-010**: System MUST preserve job completion progress across check-out and subsequent check-in sessions.
- **FR-011**: System MUST display separate dashboards for Pending Templates, Approved Templates, Processing Jobsheets, and Completed Jobsheets.
- **FR-012**: System MUST enforce role-based access control (RBAC) to prevent unauthorized access to restricted pages and functions.
- **FR-013**: Each Jobsheet template MUST support multiple Jobs, each with multiple Procedures and scheduling metadata (expected start/end dates and times).
- **FR-014**: System MUST auto-save progress during active Execution Jobsheet sessions to prevent data loss.
- **FR-015**: System MUST emit structured JSON logs (JSON Lines format) for all user actions on templates and execution sheets, including login, template creation/approval, execution sheet lifecycle events, and job completion. Logs MUST include timestamp, user ID, action type, resource ID, and result status.
- **FR-016**: System MUST be WCAG AA compliant, including keyboard navigation for all UI controls, ARIA labels for dynamic content, 4.5:1 minimum color contrast for text, and screen reader compatibility. Automated accessibility testing (axe, Lighthouse) MUST be run in CI.

### Key Entities

- **User**: Represents a system user with email, password hash, role (Manager/Operator Leader/Operator), and account status.
- **Jobsheet Template**: Contains name, description, list of jobs, and template state (Pending/Approved). Immutable after approval.
- **Job**: Represents a unit of work within a template, containing name, procedures list, expected start date/time, expected end date/time.
- **Procedure**: Atomic task within a Job; contains name and description. Not tracked for individual completion (checkbox is at job level).
- **Execution Jobsheet**: Instance of a template containing actual job execution data. States: Pending, Approved, Processing, Completed. Includes check-in/check-out timestamps and job completion flags.
- **Job Execution**: Runtime state for each job in an Execution Jobsheet, including completion flag, actual start/end times (if tracked), and notes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Operators can create a Jobsheet template with 5+ jobs and 3+ procedures per job in under 5 minutes.
- **SC-002**: Manager can review and approve a pending template in under 2 minutes (view + approve action).
- **SC-003**: Manager/OperatorLeader can create an Execution Jobsheet from a template and customize job dates in under 3 minutes.
- **SC-004**: Operator can check-in, mark 5 jobs complete, and check-out within an active session in under 10 minutes.
- **SC-005**: System preserves 100% of job completion data across check-out and resumption (no data loss on checkout).
- **SC-006**: All role-based access controls are enforced; unauthorized users cannot access restricted pages (HTTP 403 responses or redirect to login).
- **SC-007**: Completed Jobsheet dashboard loads with 100+ records in under 2 seconds on medium-scale data (≤ 10GB total, <10,000 sheets).
- **SC-008**: System handles concurrent check-ins gracefully; second check-in attempt receives clear error/notification that sheet is already active.
- **SC-009**: All user actions (login, template creation/approval, execution sheet state transitions, job completions) generate structured JSON logs with timestamp, user ID, action type, and result status for auditability per constitution.
- **SC-010**: All UI pages MUST pass WCAG AA automated accessibility checks (axe, Lighthouse) before release; manual keyboard navigation testing and screen reader testing required on primary workflows (login, create template, execute jobsheet).

## Clarifications

### Session 2026-06-17

- Q: How should user authentication be handled? → A: Basic email/password authentication stored in application database with secure password hashing (bcrypt/Argon2) and session tokens.
- Q: How should the system handle concurrent check-in attempts on the same jobsheet? → A: Allow only one concurrent check-in; reject second attempt with error message "Already checked in by User X at HH:MM" to prevent accidental concurrent work.
- Q: What are the expected data scale and retention requirements? → A: Medium scale: <1,000 templates, <10,000 total execution sheets, retain live for 2 years then archive. Estimated total data ≤ 10GB, single-database architecture sufficient.
- Q: What observability and logging approach is required? → A: Structured JSON logs (JSON Lines format) + system metrics (request count, latency); log all user actions on templates/sheets for observability and auditability per constitution.
- Q: What accessibility conformance level is required? → A: WCAG AA compliance target (keyboard navigation, ARIA labels, 4.5:1 color contrast minimum, screen reader support). Manual + automated testing (axe, Lighthouse) required before release.

## Assumptions

- **User Management**: Authentication uses email/password with session tokens; roles stored in application database alongside User entity.
- **Role Assignment**: Roles are assigned by a system administrator outside this feature; no self-service role changes. RBAC enforced on all API endpoints and UI routes.
- **Browser Environment**: Users access the system via modern web browsers (Chrome, Firefox, Safari, Edge) with JavaScript enabled.
- **Data Retention**: System retains live data for 2 years; data older than 2 years is archived (moved to cold storage or export). Expected scale: <1,000 templates, <10,000 execution sheets total, ≤ 10GB active data. Single-database architecture assumed.
- **Procedure Tracking**: Procedures themselves are not tracked for individual completion; only jobs have completion checkboxes (procedures are informational).
- **Time Zones**: System uses server time; no per-user timezone conversion (can be added in future).
- **Template Immutability**: Once a template is approved, it cannot be edited; new versions require creating a new template.
- **No Mobile First**: Initial release targets desktop/tablet web browsers; mobile responsiveness is a future enhancement.
- **Concurrent Users**: System must support typical office concurrent load (10-50 simultaneous users); not designed for real-time massive scale initially.
- **Observability**: Structured JSON logs are written to stdout or a configured log file; downstream log aggregation (ELK, CloudWatch, etc.) is external to this feature. System metrics (request count, latency) are tracked but require separate metrics backend/dashboard (Prometheus/Grafana or equivalent).
- **Accessibility**: WCAG AA is the target compliance level. All interactive elements MUST support keyboard navigation, form fields MUST have associated labels/ARIA attributes, text MUST have 4.5:1 minimum contrast ratio, and screen readers MUST work on primary workflows. Automated tools (axe, Lighthouse) required in CI; manual testing on keyboard + screen reader for critical flows.
