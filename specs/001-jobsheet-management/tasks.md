# Tasks: Role-Based Jobsheet Management System

**Feature**: 001-jobsheet-management | **Branch**: `001-jobsheet-management`

**Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md) | **Data Model**: [data-model.md](data-model.md)

**Status**: Ready for Implementation | **Last Updated**: 2026-06-17

---

## Overview

Implementation tasks organized by user story to enable independent development and testing. Each phase delivers a complete, independently testable increment. MVP scope: Complete User Stories 1–4 (core execution workflows).

### Task Count Summary

| Phase | User Story | Tasks | Status |
|-------|-----------|-------|--------|
| Phase 1 | Setup | 6 | Foundational |
| Phase 2 | Foundational | 9 | Foundational |
| Phase 3 | US1: Create Template (P1) | 15 | MVP |
| Phase 4 | US2: Approve Template (P2) | 7 | MVP |
| Phase 5 | US3: Create Execution Sheet (P1) | 10 | MVP |
| Phase 6 | US4: Execute & Complete (P1) | 12 | MVP |
| Phase 7 | US5: Partial Execution (P2) | 8 | Post-MVP |
| Phase 8 | US6: Review Completed (P3) | 7 | Post-MVP |
| Phase 9 | Polish & Cross-Cutting | 8 | Post-MVP |
| **TOTAL** | | **82 tasks** | |

### Implementation Strategy

1. **MVP Scope** (Phases 1–6): Complete user stories 1–4 for core execution workflows
2. **Post-MVP** (Phases 7–8): Add partial execution resumability and reporting dashboards
3. **Polish** (Phase 9): Accessibility hardening, performance optimization, deployment preparation

### Parallel Execution Opportunities

- **Phase 1 Setup**: All tasks parallelizable (different tools/frameworks)
- **Phase 2 Foundational**: Database schema + auth middleware + API routing can run in parallel
- **Phase 3 US1**: Model + service + frontend components parallelizable; routes depend on service
- **Phase 4 US2**: Reuses auth + template models from US1; can run after Phase 2
- **Phase 5 US3**: Execution sheet model + service parallelizable; routes depend on service
- **Phase 6 US4**: State machine logic + job completion service parallelizable
- **Phase 7 US5**: Extends US4 checkout logic; can overlap with US6
- **Phase 8 US6**: Dashboard queries independent; can run after Phase 2 (foundational queries)

**Recommended Parallel Tracks**:
```
Track A (Backend Infrastructure): Phase 1 → Phase 2 (DB + Auth)
Track B (Frontend Base): Phase 1 → Phase 2 (UI setup, auth forms)
Track C (US1 - Create Template): Phase 3 (depends on Phase 2)
  ├─ Backend: Template model + service + routes
  └─ Frontend: Template creation form + list
Track D (US3 - Create Execution): Phase 5 (depends on Phase 2 + Phase 3)
Track E (US2 - Approve, US4 - Execute): Phases 4 + 6 (can run after Track C + D)
```

---

## Phase 1: Project Setup ✓

**Purpose**: Initialize project structure, dependencies, and tooling

**⏱️ Est. Duration**: 2–3 hours

- [x] T001 Create monorepo project structure (backend/ + frontend/ directories)
- [x] T002 [P] Initialize backend: Node.js 18+, npm init, TypeScript setup (tsconfig.json, .eslintrc, jest.config.js)
- [x] T003 [P] Initialize frontend: Next.js 14+ create-next-app with TypeScript, Tailwind CSS, ESLint
- [x] T004 [P] Setup shared TypeScript interfaces directory (backend/src/types/, frontend/src/types/) for shared contracts
- [x] T005 Configure CI/CD: GitHub Actions workflows for lint, test, build, deploy (workflows/.github/workflows/)
- [x] T006 Create .env.example files (backend/.env.example, frontend/.env.local.example) with required variables

---

## Phase 2: Foundational Infrastructure ✓

**Purpose**: Shared infrastructure that blocks all user story implementation

**⚠️ CRITICAL**: ALL tasks in this phase MUST complete before ANY user story work begins

**⏱️ Est. Duration**: 8–10 hours

### Database & Models

- [x] T007 [P] Create SQLite schema initialization script in backend/src/db/schema.ts (7 tables: users, templates, jobs, procedures, execution_jobsheets, execution_jobs, job_completions)
- [x] T008 [P] Create database seed script backend/src/db/seed.ts (test users: Manager, Operator, Operator Leader + sample templates)
- [x] T009 [P] Create User model with bcrypt password hashing in backend/src/models/user.model.ts (validation, entity definition)
- [x] T010 [P] Create base types/interfaces in backend/src/types/index.ts (User, Template, Job, Procedure, ExecutionJobsheet types)

### Authentication & Authorization

- [x] T011 [P] Implement JWT token generation/validation in backend/src/services/auth.service.ts (generateToken, validateToken, refreshToken)
- [x] T012 [P] Implement auth middleware in backend/src/middleware/auth.middleware.ts (JWT verification, role extraction, RBAC enforcement)
- [x] T013 [P] Create RBAC permission guard in backend/src/middleware/rbac.middleware.ts (requireRole function for role-based route protection)

### API Infrastructure

- [x] T014 [P] Setup Express app with middleware stack in backend/src/app.ts (cors, json parsing, auth, error handling)
- [x] T015 [P] Create global error handler middleware in backend/src/middleware/error.middleware.ts (structured JSON error responses with correlation IDs)
- [x] T016 [P] Setup structured JSON logging with pino in backend/src/middleware/logging.middleware.ts (correlation IDs, request logging)

### Frontend Infrastructure

- [x] T017 [P] Create authentication context/state in frontend/src/services/auth.service.ts (login, logout, token management, role checking)
- [x] T018 [P] Create API client utility in frontend/src/services/api.client.ts (axios instance with JWT header injection, error handling)

---

## Phase 3: User Story 1 – Operator Creates Jobsheet Template (Priority: P1) ✓

**Goal**: Operators can create new jobsheet templates with multiple jobs and procedures

**Independent Test**: Can be fully tested by creating a template, saving it, and verifying persistence in "Pending" state

**⏱️ Est. Duration**: 12–14 hours

### Tests for US1

- [x] T019 [P] [US1] Contract test: POST /templates request/response validation in backend/tests/contract/templates.test.ts
- [x] T020 [P] [US1] Integration test: Create template workflow (login + create + verify state) in backend/tests/integration/templates.test.ts
- [x] T021 [P] [US1] Integration test: Template validation (required fields, procedures order) in backend/tests/integration/templates.test.ts
- [x] T022 [US1] E2E test: User creates template via UI form in frontend/tests/e2e/template-creation.spec.ts (requires running backend)

### Backend Implementation for US1

- [x] T023 [P] [US1] Create Template model in backend/src/models/template.model.ts (entity validation, relationships to jobs/procedures)
- [x] T024 [P] [US1] Create Job model in backend/src/models/job.model.ts (attributes: name, order, expected start/end)
- [x] T025 [P] [US1] Create Procedure model in backend/src/models/procedure.model.ts (attributes: name, description, order)
- [x] T026 [US1] Implement TemplateService in backend/src/services/template.service.ts (createTemplate, validateTemplate, getTemplate)
- [x] T027 [US1] Create template routes in backend/src/routes/templates.routes.ts (POST /templates with validation middleware)
- [x] T028 [US1] Add input validation schema for template creation in backend/src/middleware/validation.middleware.ts (joi schemas for template/job/procedure)

### Frontend Implementation for US1

- [x] T029 [P] [US1] Create Template entity types in frontend/src/types/template.ts (TypeScript interfaces)
- [x] T030 [P] [US1] Create template API service in frontend/src/services/template.service.ts (createTemplate, getTemplates, getTemplate functions)
- [x] T031 [US1] Build template creation form component in frontend/src/components/templates/CreateTemplateForm.tsx (jobs array, procedures nested forms, date pickers)
- [x] T032 [US1] Create templates list page in frontend/src/app/(protected)/templates/page.tsx (filtered by state, pagination)
- [x] T033 [US1] Add template state management in frontend/src/store/templateStore.ts (zustand or Context API for form state)

**Checkpoint**: User Story 1 complete - Operators can create and save templates

---

## Phase 4: User Story 2 – Manager Reviews and Approves Templates (Priority: P2)

**Goal**: Managers can view pending templates and approve them, transitioning state to "Approved"

**Independent Test**: Can be fully tested by creating template as Operator, approving as Manager, verifying state transition

**⏱️ Est. Duration**: 8–10 hours

### Tests for US2

- [ ] T034 [P] [US2] Contract test: POST /templates/:id/approve endpoint in backend/tests/contract/templates.test.ts
- [ ] T035 [P] [US2] Integration test: Template approval workflow (Manager only, state transition) in backend/tests/integration/templates.test.ts
- [ ] T036 [US2] Integration test: Forbidden error when non-Manager tries to approve in backend/tests/integration/templates.test.ts

### Backend Implementation for US2

- [ ] T037 [US2] Implement approveTemplate method in backend/src/services/template.service.ts (state validation, RBAC check, immutability enforcement)
- [ ] T038 [US2] Add approval route POST /templates/:id/approve in backend/src/routes/templates.routes.ts (role=Manager required)
- [ ] T039 [US2] Update Template model to enforce immutability in backend/src/models/template.model.ts (prevent edits when state='Approved')

### Frontend Implementation for US2

- [ ] T040 [P] [US2] Create pending templates dashboard in frontend/src/app/(protected)/templates/pending/page.tsx (list + approve button)
- [ ] T041 [P] [US2] Create approved templates dashboard in frontend/src/app/(protected)/templates/approved/page.tsx (read-only list)
- [ ] T042 [US2] Build template approval modal in frontend/src/components/templates/ApproveTemplateModal.tsx (confirmation + submit)
- [ ] T043 [US2] Add RBAC guards to template pages in frontend/src/middleware.ts (redirect if not Manager for approve actions)

**Checkpoint**: User Story 2 complete - Manager approval workflow functional

---

## Phase 5: User Story 3 – Operator Creates Execution Jobsheet from Template (Priority: P1)

**Goal**: Operators clone approved templates into Execution Jobsheets with customizable dates

**Independent Test**: Can be fully tested by approving template, creating execution sheet, verifying "Pending" state

**⏱️ Est. Duration**: 10–12 hours

### Tests for US3

- [ ] T044 [P] [US3] Contract test: POST /execution-sheets endpoint in backend/tests/contract/execution.test.ts
- [ ] T045 [P] [US3] Integration test: Create execution sheet from approved template in backend/tests/integration/execution.test.ts
- [ ] T046 [US3] Integration test: Reject creation from unapproved template in backend/tests/integration/execution.test.ts

### Backend Implementation for US3

- [ ] T047 [P] [US3] Create ExecutionJobsheet model in backend/src/models/execution.model.ts (state, checked_in_by, checked_in_at, relationships)
- [ ] T048 [P] [US3] Create ExecutionJob model in backend/src/models/execution-job.model.ts (maps to template job, tracks actual dates)
- [ ] T049 [US3] Implement ExecutionService in backend/src/services/execution.service.ts (createExecutionSheet cloning template, date customization)
- [ ] T050 [US3] Add execution sheet routes in backend/src/routes/execution.routes.ts (POST /execution-sheets with cloning logic)
- [ ] T051 [US3] Add execution sheet validation schema in backend/src/middleware/validation.middleware.ts (template must be approved, jobs with dates)

### Frontend Implementation for US3

- [ ] T052 [P] [US3] Create ExecutionJobsheet types in frontend/src/types/execution.ts (TypeScript interfaces)
- [ ] T053 [P] [US3] Create execution API service in frontend/src/services/execution.service.ts (createExecutionSheet, getExecutionSheets functions)
- [ ] T054 [US3] Build execution sheet creation form in frontend/src/components/execution/CreateExecutionForm.tsx (template selector, job date customization)
- [ ] T055 [US3] Create execution sheet list/dashboard in frontend/src/app/(protected)/execution/page.tsx (filtered by state)

**Checkpoint**: User Story 3 complete - Execution sheets can be created from templates

---

## Phase 6: User Story 4 – Operator Executes and Completes Jobsheet (Priority: P1)

**Goal**: Operators check-in, mark jobs complete, and submit sheets with state transitions

**Independent Test**: Full workflow: check-in → mark jobs → complete → verify "Completed" state

**⏱️ Est. Duration**: 14–16 hours

### Tests for US4

- [ ] T056 [P] [US4] Contract test: POST /execution-sheets/:id/check-in endpoint in backend/tests/contract/execution.test.ts
- [ ] T057 [P] [US4] Contract test: POST /execution-sheets/:id/complete endpoint in backend/tests/contract/execution.test.ts
- [ ] T058 [P] [US4] Integration test: Check-in state transition (Pending → Processing) in backend/tests/integration/execution.test.ts
- [ ] T059 [P] [US4] Integration test: Job completion tracking in backend/tests/integration/execution.test.ts
- [ ] T060 [US4] Integration test: Complete execution sheet (all jobs must be marked) in backend/tests/integration/execution.test.ts
- [ ] T061 [US4] E2E test: Full execution workflow in frontend/tests/e2e/execution-workflow.spec.ts

### Backend Implementation for US4

- [ ] T062 [P] [US4] Create JobCompletion model in backend/src/models/job-completion.model.ts (tracks which user completed which job, timestamps)
- [ ] T063 [US4] Implement state machine logic in backend/src/services/execution.service.ts (checkIn, markJobComplete, completeExecutionSheet with state validation)
- [ ] T064 [US4] Add check-in route POST /execution-sheets/:id/check-in in backend/src/routes/execution.routes.ts (set checked_in_by, checked_in_at, state='Processing')
- [ ] T065 [US4] Add job completion route POST /execution-sheets/:id/jobs/:jobId/complete in backend/src/routes/execution.routes.ts (insert into job_completions table)
- [ ] T066 [US4] Add complete sheet route POST /execution-sheets/:id/complete in backend/src/routes/execution.routes.ts (validate all jobs marked, transition to Completed)
- [ ] T067 [US4] Add concurrent check-in rejection logic in backend/src/services/execution.service.ts (409 CONCURRENT_CHECKIN error if already checked in by different user)

### Frontend Implementation for US4

- [ ] T068 [P] [US4] Build check-in button/modal in frontend/src/components/execution/CheckInModal.tsx (confirmation, error handling for concurrent access)
- [ ] T069 [P] [US4] Create job completion UI in frontend/src/components/execution/JobCompletionForm.tsx (checkboxes, timestamp tracking)
- [ ] T070 [US4] Build execution sheet detail page in frontend/src/app/(protected)/execution/:id/page.tsx (jobs list, completion status, buttons)
- [ ] T071 [US4] Add complete sheet button in frontend/src/components/execution/CompleteSheetButton.tsx (validation that all jobs marked)
- [ ] T072 [US4] Implement real-time progress display in frontend/src/components/execution/ExecutionProgress.tsx (completed count, total jobs)

**Checkpoint**: User Story 4 complete - MVP execution workflow fully functional

---

## Phase 7: User Story 5 – Operator Partial Execution with Checkout (Priority: P2)

**Goal**: Operators can check-out mid-execution, preserving progress for resumption later

**Independent Test**: Check-in → mark some jobs → check-out → verify data persists → check-in again → verify progress intact

**⏱️ Est. Duration**: 8–10 hours

### Tests for US5

- [ ] T073 [P] [US5] Integration test: Check-out state transition and progress persistence in backend/tests/integration/execution.test.ts
- [ ] T074 [US5] Integration test: Resume execution and verify prior progress in backend/tests/integration/execution.test.ts
- [ ] T075 [US5] E2E test: Checkout and resume workflow in frontend/tests/e2e/partial-execution.spec.ts

### Backend Implementation for US5

- [ ] T076 [US5] Implement checkOut method in backend/src/services/execution.service.ts (clear checked_in_by, state → Pending, preserve job_completions)
- [ ] T077 [US5] Add check-out route POST /execution-sheets/:id/check-out in backend/src/routes/execution.routes.ts (return saved progress count)
- [ ] T078 [US5] Update execution queries to handle partial progress in backend/src/services/execution.service.ts (query job_completions for resume display)

### Frontend Implementation for US5

- [ ] T079 [P] [US5] Build check-out button in frontend/src/components/execution/CheckOutButton.tsx (confirmation, display saved progress)
- [ ] T080 [US5] Implement progress resume display in frontend/src/components/execution/ExecutionProgress.tsx (show completed jobs even when Pending state)
- [ ] T081 [US5] Add resume workflow in frontend/src/app/(protected)/execution/:id/page.tsx (auto-populate completed jobs on page load)

**Checkpoint**: User Story 5 complete - Partial execution with resumability functional

---

## Phase 8: User Story 6 – Manager/Operator Leader Reviews Completed Jobsheets (Priority: P3)

**Goal**: Managers and Operator Leaders view completed execution sheets for audit and reporting

**Independent Test**: Complete a jobsheet → view in completed dashboard → verify all details displayed

**⏱️ Est. Duration**: 8–10 hours

### Tests for US6

- [ ] T082 [P] [US6] Contract test: GET /execution-sheets?state=Completed in backend/tests/contract/execution.test.ts
- [ ] T083 [P] [US6] Integration test: Completed sheet query with filtering in backend/tests/integration/execution.test.ts
- [ ] T084 [US6] Integration test: RBAC for completed sheet viewing (only Manager/OperatorLeader) in backend/tests/integration/execution.test.ts

### Backend Implementation for US6

- [ ] T085 [US6] Implement getCompletedSheets method in backend/src/services/execution.service.ts (query with pagination, filtering)
- [ ] T086 [US6] Add GET /execution-sheets?state=Completed route in backend/src/routes/execution.routes.ts (pagination, RBAC check)
- [ ] T087 [US6] Create dashboard query service in backend/src/services/dashboard.service.ts (aggregate job counts, completion times for reporting)

### Frontend Implementation for US6

- [ ] T088 [P] [US6] Build completed jobsheets dashboard in frontend/src/app/(protected)/execution/completed/page.tsx (table, filtering, pagination)
- [ ] T089 [P] [US6] Create completed sheet detail view in frontend/src/components/execution/CompletedSheetDetail.tsx (read-only, audit trail)
- [ ] T090 [US6] Add export functionality in frontend/src/components/execution/ExportButton.tsx (export as CSV/PDF)
- [ ] T091 [US6] Implement RBAC guards in frontend/src/middleware.ts (redirect if not Manager/OperatorLeader for completed view)

**Checkpoint**: User Story 6 complete - Reporting and audit dashboards functional

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Accessibility hardening, performance optimization, deployment prep

**⏱️ Est. Duration**: 10–12 hours

### Accessibility & Compliance

- [ ] T092 [P] Run axe accessibility audit on all pages in frontend/tests/a11y/axe.test.ts (automated WCAG AA checks)
- [ ] T093 [P] Add ARIA labels and roles to all interactive components in frontend/src/components/ (keyboard navigation verification)
- [ ] T094 Add manual keyboard navigation testing checklist in docs/ACCESSIBILITY.md (Tab, Shift+Tab, Escape, Enter flows)
- [ ] T095 Conduct screen reader testing with NVDA/JAWS on primary workflows (doc test results in docs/SCREEN_READER.md)

### Performance & Optimization

- [ ] T096 [P] Implement pagination on all list endpoints in backend/src/routes/ (limit 50 per page, offset-based)
- [ ] T097 [P] Add database indexes on high-cardinality queries in backend/src/db/schema.ts (state, user_id, created_at)
- [ ] T098 Optimize frontend bundle with code splitting in frontend/next.config.js (route-based, component lazy loading)
- [ ] T099 Add performance benchmarks in backend/tests/performance/benchmarks.test.ts (<200ms p95 latency, <2s dashboard load)

### Documentation & Deployment

- [ ] T100 Create deployment guide in docs/DEPLOYMENT.md (Docker setup optional, env vars, database backup strategy)
- [ ] T101 [P] Create API documentation in docs/API.md (endpoint summary, example requests/responses)
- [ ] T102 [P] Generate changelog in CHANGELOG.md (v1.0.0 release notes, features, known issues)
- [ ] T103 Add PR template in .github/pull_request_template.md (checklist: tests, accessibility, perf, docs)

### Testing & Quality Gates

- [ ] T104 Setup CI coverage gate in .github/workflows/test.yml (fail if coverage < 80%)
- [ ] T105 Add linting and formatting checks in CI (ESLint, Prettier, TypeScript strict mode)
- [ ] T106 [P] Verify all 6 user stories pass independent test suites in CI
- [ ] T107 Conduct final UAT with sample users (operators, manager, operator leader) - document feedback in docs/UAT.md

---

## Dependency Graph

### Phase Ordering

```
Phase 1: Setup
    ↓
Phase 2: Foundational (Database + Auth + API Infrastructure)
    ├─→ Phase 3: US1 (Create Template)
    │   ↓
    ├─→ Phase 4: US2 (Approve Template) — depends on Phase 3
    │
    ├─→ Phase 5: US3 (Create Execution) — depends on Phase 3 + Phase 2
    │   ↓
    └─→ Phase 6: US4 (Execute & Complete) — depends on Phase 5 + Phase 2
        ↓
        Phase 7: US5 (Partial Execution) — depends on Phase 6
        ↓
        Phase 8: US6 (Review Completed) — depends on Phase 6 + Phase 2
        ↓
        Phase 9: Polish & Optimization
```

### Critical Path

**Minimum sequential phases for MVP**: Setup → Foundational → US1 → US3 → US4

**Additional for feature completeness**: + US2, US5, US6

### Parallel Tracks

**Backend Track**:
```
T001-T006 (Setup) → T007-T018 (Foundational) → T026-T028 (US1 Services) + T037-T039 (US2 Services) + T049-T051 (US3 Services) + T062-T067 (US4 Services) → ...
```

**Frontend Track**:
```
T001-T006 (Setup) → T017-T018 (Foundational) → T031-T033 (US1 UI) + T040-T043 (US2 UI) + T054-T055 (US3 UI) + T068-T072 (US4 UI) → ...
```

**Can Run in Parallel After Foundational**:
- Backend: T023-T025 (Models) + T062 (JobCompletion) + T047-T048 (Execution models)
- Frontend: T029-T030 (API services) + T052-T053 (Execution API)

---

## Testing Strategy

### Test Pyramid (80% Coverage Baseline)

| Layer | Count | Tools | Examples |
|-------|-------|-------|----------|
| Unit (60%) | ~35 tasks | Jest | Service logic, model validation, utility functions |
| Integration (30%) | ~20 tasks | Jest + Supertest | API endpoints, database state transitions, auth flows |
| E2E/UI (10%) | ~5 tasks | Cypress/Playwright | User workflows (create template, execute, complete) |
| Accessibility | ~5 tasks | axe, manual | WCAG AA compliance, keyboard navigation, screen readers |

### Test Execution Order

1. **Pre-commit**: Linting + unit tests (fast, <30s)
2. **CI on PR**: Unit + integration + coverage gate
3. **Pre-release**: E2E + accessibility audit + performance benchmarks

---

## Checklist for Completion

- [ ] All Phase 1 tasks complete (project setup)
- [ ] All Phase 2 tasks complete (foundational infrastructure)
- [ ] Phase 3–6 (MVP user stories) complete with all tests passing
- [ ] Phase 7–8 (Post-MVP) complete
- [ ] Phase 9 (Polish) complete:
  - [ ] Accessibility audit passing (axe 0 violations)
  - [ ] Performance benchmarks met (<200ms p95, <2s dashboards)
  - [ ] Coverage ≥80%
  - [ ] All documentation updated
- [ ] UAT completed with sample users
- [ ] Release v1.0.0 (changelog + deployment guide)

---

## Success Criteria

✅ **All User Stories Independently Testable**
- US1: Can create template without US2, US3, US4
- US2: Can approve templates created in US1
- US3: Can create execution from approved templates
- US4: Can execute sheets created in US3 through to Completed state
- US5: Can partial-checkout and resume any execution sheet
- US6: Can view all completed sheets with full details

✅ **80% Test Coverage**: Unit + integration + E2E combined
✅ **WCAG AA Compliance**: Automated axe checks + manual verification
✅ **Performance Targets Met**: <200ms p95, <2s dashboards, <500ms check-in/out
✅ **Role-Based Access Control**: All endpoints enforce RBAC per spec.md
✅ **Data Persistence**: All progress saved across sessions; no data loss on checkout

---

**Tasks Version**: 1.0.0 | **Status**: Ready for Implementation | **Last Updated**: 2026-06-17
