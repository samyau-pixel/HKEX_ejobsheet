# Tasks: Job Dependencies

**Feature**: Job Dependencies (`004-job-dependencies`)  
**Spec**: [spec.md](spec.md#L1)  
**Plan**: [plan.md](plan.md#L1)

Phase 1: Setup

- [ ] T001 Create DB migration to add `timeDependency` and `prerequisiteJobIds` to template job table: backend/src/db/migrations/001-add-job-dependencies.ts
- [ ] T002 Update `backend/src/models/template.model.ts` to include `timeDependency` and `prerequisiteJobIds` fields
- [ ] T003 Add/Update `backend/src/db/seed.ts` sample templates including dependency examples

Phase 2: Foundational (blocking prerequisites)

- [ ] T004 Add template save validation (cycle detection) in backend/src/services/template.service.ts
- [ ] T005 Implement cloning logic in backend/src/services/template.service.ts to map template job dependencies to execution job ids when creating an execution jobsheet
- [ ] T006 Add API contract endpoints and server routes: update `backend/src/routes/templates.routes.ts` and `backend/src/routes/execution.routes.ts`
- [ ] T007 Add backend unit tests for model, validation, and clone behavior: tests/unit/template-dependencies.test.ts

Phase 3: User Story Implementation

- [ ] T008 [US1] [P] Add frontend template editor controls (datetime picker + multi-select prerequisite list) in frontend/src/components/templates/TemplateJobEditor.tsx
- [ ] T009 [US1] [P] Frontend validation: prevent selecting the job itself as prerequisite and display helpful UI messages in frontend/src/components/templates/TemplateJobEditor.tsx
- [ ] T010 [US1] Add frontend unit tests for the template editor: frontend/tests/unit/template-job-editor.test.tsx

- [ ] T011 [US2] [P] Implement clone endpoint behavior in backend/src/services/execution.service.ts and ensure `prerequisiteJobIds` are converted to execution job ids
- [ ] T012 [US2] Add integration test verifying cloned execution jobs include dependency metadata: tests/integration/clone-template-dependencies.test.ts

- [ ] T013 [US3] Implement job-completion endpoint with dependency checks in backend/src/services/execution.service.ts (validate time + completion of prerequisite execution jobs)
- [ ] T014 [US3] [P] Update frontend execution UI to disable/grey-out completion checkbox with explanatory tooltip when dependencies are unmet: frontend/src/components/execution/ExecutionJobItem.tsx
- [ ] T015 [US3] Add integration tests covering time-based blocking and job-dependency blocking: tests/integration/execution-dependency-enforcement.test.ts

Phase 4: Polish & Cross-cutting

- [ ] T016 [P] Add structured logging for dependency evaluation decisions in backend/src/services/execution.service.ts
- [ ] T017 Update `specs/004-job-dependencies/quickstart.md` with final developer steps and examples
- [ ] T018 Update migrations docs and add release notes: docs/release-notes/004-job-dependencies.md

Dependencies

- `T004` must run before `T005` and `T006`.
- `T005` (clone logic) must be completed before `T011` and `T012`.
- `T013` must be completed before `T014` and `T015`.

Parallel execution examples

- Backend model/migration work (`T001`, `T002`, `T004`, `T005`) can proceed in parallel with frontend UI work (`T008`, `T009`) if frontend uses mocked APIs (`[P]` marked tasks).
- Test writing tasks (`T007`, `T010`, `T012`, `T015`) can proceed in parallel with implementation tasks for their respective areas.

Implementation Strategy

- MVP: Implement schema + clone + basic enforcement (time + single prerequisite) with backend tests and minimal frontend controls to demonstrate enforcement in UI. (Scope: `T001`, `T002`, `T005`, `T011`, `T013`, `T014`, `T012`, `T015`)
- Incremental: Add richer frontend UX, multi-select prerequisite UI, and cycle-detection messages plus additional tests in iterative PRs.

Checklist format validation: All tasks follow the required `- [ ] T### [P]? [US#]? Description with file path` format.
