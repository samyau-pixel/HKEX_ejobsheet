# Sync Impact Report
<!--
Version change: [unspecified] -> 1.0.0
Modified principles:
- [PRINCIPLE_1_NAME] -> I. Code Quality & Maintainability
- [PRINCIPLE_2_NAME] -> II. Test-First & Test Coverage (NON-NEGOTIABLE)
- [PRINCIPLE_3_NAME] -> III. User Experience Consistency
- [PRINCIPLE_4_NAME] -> IV. Performance & Resource Constraints
- [PRINCIPLE_5_NAME] -> V. Observability, Versioning & Release Discipline
Added sections:
- Additional Constraints
- Development Workflow & Quality Gates
Removed sections:
- None
Templates requiring updates:
- .specify/templates/tasks-template.md ✅ updated
- .specify/templates/plan-template.md ⚠ pending
- .specify/templates/spec-template.md ⚠ pending
Follow-up TODOs:
- TODO(RATIFICATION_DATE): confirm original ratification date
-->

# Ejobsheet Constitution

## Core Principles

### I. Code Quality & Maintainability
All code MUST follow the project's style and linting rules and be easy to read, review,
and maintain. Requirements:
- Enforce linters and formatters in CI (pre-commit hooks recommended).
- Prefer small, focused changes and keep PRs reviewable (target < 400 LOC).
- Modules MUST have clear public interfaces and be independently testable.
- Dependencies MUST be reviewed for security and maintenance cost; prefer well-
	maintained, minimal-dependency solutions.
- Public APIs and behavior MUST be documented with examples and usage notes.

### II. Test-First & Test Coverage (NON-NEGOTIABLE)
Testing is mandatory and must drive development. Requirements:
- Write tests before implementing behavior (TDD) for all new functionality.
- Unit tests, integration tests, and contract tests MUST exist where applicable.
- CI MUST fail the build if coverage drops below the agreed baseline (default: 80% for
	new code areas; stricter targets may be defined per project).
- Tests MUST be deterministic, fast for unit-level checks, and included in PRs.
- Performance regressions require automated benchmarks and must be gated in CI.

### III. User Experience Consistency
The product MUST deliver a consistent, accessible, and predictable user experience.
Requirements:
- Use a shared design system or documented component patterns for UI elements.
- Accessibility standards (WCAG AA) SHOULD be followed for user-facing features.
- UX acceptance criteria MUST be captured in `spec.md` user stories and verified by
	tests or manual checks before merging.
- UX changes that affect existing flows MUST include migration notes and user impact
	analysis.

### IV. Performance & Resource Constraints
Performance goals and resource budgets MUST be defined and enforced. Requirements:
- Define performance budgets (e.g., p95 latency, memory footprint) in `plan.md`.
- Run benchmarks and load tests for features that affect throughput or latency.
- Any change that increases resource usage by >10% for critical paths MUST be
	justified and approved by a reviewer with performance expertise.
- Profiling data and reproducible performance tests MUST be included with PRs that
	claim performance improvements.

### V. Observability, Versioning & Release Discipline
Systems MUST be observable and follow a clear versioning/release policy. Requirements:
- Structured logging, metrics, and distributed traces MUST exist for critical paths.
- Semantic versioning (MAJOR.MINOR.PATCH) MUST be used for released artifacts.
- Breaking changes MUST be documented, communicated, and follow a deprecation
	schedule with migration guidance.
- Releases MUST include a changelog and clear rollback instructions.

## Additional Constraints
Security, privacy, and compliance considerations are first-class constraints. Requirements:
- Sensitive data handling MUST follow project privacy policies and encryption-at-rest
	where required.
- Use secure defaults; fail-open behaviors are NOT permitted for security controls.
- Accessibility and localization requirements MUST be documented when applicable.

## Development Workflow & Quality Gates
Process rules to enforce the constitution:
- All PRs MUST pass automated linters, unit tests, and CI checks before review.
- At least one approver with domain knowledge MUST sign off on architectural or
	performance-impacting changes.
- Performance-impacting PRs MUST include benchmark results and profiling traces.
- UX-impacting PRs MUST include screenshots, a short user-journey test, and
	acceptance criteria in `spec.md`.
- Merge is blocked until all gating checks succeed; manual overrides require
	documented justification and a follow-up remediation task.

## Governance
The constitution is the authoritative source for development, review, and release
practices. Amendments require a documented proposal (PR) and approval by the
project maintainers. Major governance changes (removing or redefining core
principles) constitute a MAJOR version bump.

All PRs and releases MUST reference relevant constitution sections where they
change behavior or policy.

**Version**: 1.0.0 | **Ratified**: TODO(RATIFICATION_DATE): confirm original adoption date | **Last Amended**: 2026-06-17
