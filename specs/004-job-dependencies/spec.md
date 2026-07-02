# Feature Specification: Job Dependencies

**Feature Branch**: `004-job-dependencies`

**Created**: 2026-07-02

**Status**: Draft

**Input**: User description: "Create a new branch for the following new feature. When create a jobs in the jobsheet template creation. every job could enable 2 dependency. First, Time dependency, it would show a calendar for user to pick a date and time. Second, Job dependency. It would display a list of created job in the same jobsheet template, where user could choose one or more as the pre requisite job of this job. After the execution jobsheet is created by cloning the template jobsheet. When user check in and operate the execution jobsheet, every job could be mark as complete(the complete check box) when all dependency are fullfill. Such as , if there is a time dependency of 2/07/2026 14:30, the operator could only complete at or after 14:30. If  Job 001 is the pre requisite job of Job 003, then, Job 003 could be completed only Job001 is completed."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Add dependencies while creating template job (Priority: P1)

A template author creates or edits a jobsheet template and for each job may enable zero, one, or both dependency types: a time dependency and one or more job dependencies.

**Why this priority**: This delivers the core configuration capability enabling downstream execution enforcement.

**Independent Test**: As a template author, create a template job and set a time dependency and a job dependency; save the template and verify dependencies persist on the job.

**Acceptance Scenarios**:

1. **Given** a jobsheet template in edit mode, **When** the author adds/edits a job, **Then** the UI shows controls for: (a) enabling a time dependency with a date/time picker, and (b) enabling job dependency with a selectable list of other jobs in the same template.
2. **Given** the author selects other jobs as prerequisites, **When** they save the job, **Then** those prerequisite relationships are stored on the template job record.

---

### User Story 2 - Clone template to execution jobsheet (Priority: P1)

When an execution jobsheet is created by cloning a template, the execution jobsheet must include the job records and their configured dependencies.

**Why this priority**: Execution enforcement requires that dependencies travel with the cloned execution jobs.

**Independent Test**: Clone a template with dependency-configured jobs and verify the execution jobsheet contains identical dependency metadata.

**Acceptance Scenarios**:

1. **Given** a template with jobs that declare time and/or job dependencies, **When** a user clones the template to create an execution jobsheet, **Then** each execution job record contains the same dependency definitions as the template jobs.

---

### User Story 3 - Enforce dependencies during execution (Priority: P1)

Operators working on an execution jobsheet can only mark a job complete when all its dependencies are satisfied:
- Time dependency: current time is at or after the configured date/time.
- Job dependency: all listed prerequisite jobs are already completed.

**Why this priority**: Prevents premature completion and preserves execution order and timing constraints.

**Independent Test**: On an execution jobsheet, attempt to mark a job complete before a time dependency and before prerequisite jobs complete; observe that completion is blocked and the UI shows the reason.

**Acceptance Scenarios**:

1. **Given** Job A has time dependency 2026-07-02 14:30, **When** an operator tries to complete Job A at 14:25, **Then** the UI prevents completion and displays a message indicating the time dependency is not yet met.
2. **Given** Job B depends on Job A, **When** Job A is not completed, **Then** attempting to complete Job B is prevented with a message listing incomplete prerequisite jobs.
3. **Given** all dependencies for a job are satisfied, **When** the operator marks the job complete, **Then** the job is persisted as completed and dependent jobs become eligible for completion if other dependencies are also satisfied.

---

### Edge Cases

- Circular job dependencies must be detected at template-creation time and prevented from being saved.
- If a prerequisite job is deleted from the template after other jobs reference it, the system should either prevent deletion or surface a validation/error requiring reconfiguration.
- Time dependency timezone: assume template and execution times are stored in UTC and presented in user-local timezone; conflicts must be surfaced.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Template authors MUST be able to enable a time dependency on a job with a date+time picker.
- **FR-002**: Template authors MUST be able to enable a job dependency by selecting one or more other jobs from the same jobsheet template.
- **FR-003**: The UI MUST list only jobs that exist in the same template as selectable prerequisites (exclude the job itself).
- **FR-004**: The system MUST persist dependency metadata on the template job record and carry it forward when cloning to an execution jobsheet.
- **FR-005**: Execution jobs MUST include dependency data and the operator UI MUST evaluate dependency rules before allowing completion.
- **FR-006**: The operator UI MUST block completion and display an informative message when any dependency is not satisfied.
- **FR-007**: The system MUST prevent saving templates that include circular job-dependency graphs (validation error on save).
- **FR-008**: Time comparisons MUST use a consistent time standard (assume UTC storage) and account for user locale display.
- **FR-009**: The system MUST allow multiple prerequisite jobs to be selected and evaluate them all as required before completion.

### Key Entities

- **JobsheetTemplate**: Represents a template containing ordered jobs and metadata.
- **TemplateJob**: Represents a job within a template; attributes include `id`, `title`, `description`, `order`, `timeDependency` (nullable datetime), `prerequisiteJobIds` (array of TemplateJob ids).
- **ExecutionJobsheet**: Cloned instance of a template for runtime execution.
- **ExecutionJob**: Cloned instance of a TemplateJob for execution; attributes include `completedAt` (nullable datetime), `status`, and copied dependency fields.
- **Operator/User**: Person performing check-ins and completing jobs.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Template authors can add time and job dependencies to jobs in 95% of trials without errors in a usability test.
- **SC-002**: 100% of cloned execution jobsheets contain dependency metadata identical to the source template for tested templates.
- **SC-003**: Blocking rules prevent premature completion in 100% of automated tests covering time and job dependencies.
- **SC-004**: Circular dependency cases are detected and blocked at template-save time in 100% of validation tests.

## Assumptions

- Times are stored in UTC and converted to the user's display timezone in the UI.
- Templates and execution jobs are single-tenant scoped; dependencies refer only to jobs within the same template instance.
- Deleting or reordering jobs that are referenced by prerequisites requires explicit author review; the system will validate changes.
- This feature focuses on template creation, cloning, and enforcement; no scheduling or background automatic completion is required in v1.

---

**SPEC READY FOR PLANNING**
