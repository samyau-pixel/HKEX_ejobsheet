# Implementation Plan: Role-Based Jobsheet Management System

**Branch**: `001-jobsheet-management` | **Date**: 2026-06-17 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-jobsheet-management/spec.md`

## Summary

Build a web-based job execution management system with role-based workflows (Manager, Operator Leader, Operator). Users create reusable Jobsheet templates with jobs/procedures, managers approve templates, operators execute jobs with check-in/check-out capabilities, and support for partial completion with session resumability. Data persists across browser sessions via SQLite backend.

**Technology Stack** (Enforced):
- **Frontend**: Next.js (App Router) with React, TypeScript, Tailwind CSS
- **Backend**: Node.js/Express with TypeScript
- **Database**: SQLite for persistent storage
- **API**: REST API with JSON payloads and structured error responses
- **Testing**: Jest (unit), Supertest (integration), React Testing Library (UI)
- **Deployment**: Single-server setup (frontend co-hosted with backend static assets, or separate deployments)

## Technical Context

**Language/Version**: TypeScript 5.x (frontend + backend), Node.js 18+, React 18+, Next.js 14+

**Primary Dependencies**: 
- Frontend: Next.js, React, TypeScript, Tailwind CSS, axios, zustand (state management)
- Backend: Express, TypeScript, SQLite3, bcryptjs, jsonwebtoken, joi (validation)
- Testing: Jest, Supertest, React Testing Library

**Storage**: SQLite (embedded, single-file database; 2-year retention lifecycle with archive export)

**Testing**: 
- Unit: Jest (backend services, frontend utilities)
- Integration: Supertest + Jest (API endpoints + database state transitions)
- Contract: Postman/Insomnia (API schema validation)
- UI: React Testing Library + Cypress (critical user workflows)
- Accessibility: axe DevTools, WAVE, manual keyboard/screen reader testing

**Target Platform**: Web (desktop/tablet browsers); Chrome, Firefox, Safari, Edge

**Project Type**: Web application (full-stack: React frontend + Express backend, shared TypeScript)

**Performance Goals**:
- API response: <200ms p95 latency for all endpoints (medium load, 10–50 concurrent users)
- Template dashboard load: <2 seconds for 100+ records
- Job check-in/check-out: <500ms response time
- Frontend first paint: <1.5 seconds (Next.js optimized)

**Constraints**:
- Single SQLite file (no distributed DB initially)
- No file uploads (procedures are text-based)
- No real-time multi-user collaboration (exclusive check-in per jobsheet)
- Stateless API (session tokens in JWT or secure cookies)

**Scale/Scope**: 
- Users: 10–50 concurrent office workers
- Templates: <1,000 active templates
- Execution sheets: <10,000 total (2-year retention)
- Data volume: ≤10GB SQLite database
- Initial MVP: Core workflows (create template, approve, execute, complete, review)

## Constitution Check

### Principles Audit

| Principle | Requirement | Plan Status | Notes |
|-----------|------------|------------|-------|
| I. Code Quality & Maintainability | Linters, formatters, <400 LOC PRs, clear interfaces | ✅ PASS | ESLint + Prettier in CI, shared TypeScript interfaces, modular services/components |
| II. Test-First & Test Coverage (NON-NEGOTIABLE) | TDD, unit/integration/contract tests, 80% coverage baseline | ✅ PASS | Jest + Supertest setup, tests written before impl, coverage gates in CI |
| III. User Experience Consistency | Design system, WCAG AA, UX acceptance in spec | ✅ PASS | Tailwind CSS component system, WCAG AA compliance (FR-016), accessibility testing in CI |
| IV. Performance & Resource Constraints | Perf budgets, benchmarks, <10% regression gate | ✅ PASS | API latency targets (<200ms p95), dashboard load target (<2s), Lighthouse monitoring |
| V. Observability & Release Discipline | JSON logs, metrics, semantic versioning, changelog | ✅ PASS | Structured JSON logging (pino), request metrics, v1.0.0 versioning, changelog.md required |

### Gating Decisions

- ✅ **No violations**: Stack (Next.js + Express + SQLite) is well-maintained, minimal-dependency, and widely used for this use case. TypeScript enforces strong typing across frontend/backend.
- ✅ **Test infrastructure**: Jest + Supertest + React Testing Library cover unit/integration/UI; accessibility testing (axe + manual) meets WCAG AA requirement.
- ✅ **Observability ready**: Structured JSON logging (pino), request tracking headers (correlation IDs), metrics collection for dashboards.
- ✅ **Performance targets defined**: <200ms p95, <2s dashboard, no unbounded queries (pagination, filtering on dashboards).

**Constitution gates**: PASS (no blocking violations identified)

## Project Structure

### Documentation (this feature)

```
specs/001-jobsheet-management/
├── plan.md                    # This file
├── research.md                # Phase 0: Research findings (tech decisions, dependencies, best practices)
├── data-model.md              # Phase 1: Database schema + entity relationships
├── quickstart.md              # Phase 1: Local dev setup guide (npm install, db seed, run servers)
├── contracts/                 # Phase 1: API contract definitions
│   ├── auth.md                # Login/logout endpoints, token format
│   ├── templates.md           # Template CRUD + approval workflow
│   ├── execution-sheets.md    # Execution sheet CRUD + check-in/check-out + state transitions
│   └── admin.md               # Dashboard data queries (pending, approved, processing, completed)
└── checklists/
    └── requirements.md        # Quality checklist (shared)
```

### Source Code (repository root)

```
backend/
├── src/
│   ├── db/
│   │   ├── schema.ts          # SQLite schema initialization
│   │   ├── migrations/        # Future: versioned schema changes
│   │   └── seed.ts            # Test data generation
│   ├── models/
│   │   ├── user.model.ts      # User entity + auth helpers
│   │   ├── template.model.ts  # Jobsheet template entity
│   │   ├── execution.model.ts # Execution jobsheet entity
│   │   └── job.model.ts       # Job + procedure entities
│   ├── services/
│   │   ├── auth.service.ts    # Login/logout, token validation
│   │   ├── template.service.ts # Template CRUD + approval workflow
│   │   ├── execution.service.ts # Execution sheet lifecycle (check-in/out, state transitions)
│   │   └── dashboard.service.ts # Queries for dashboard views
│   ├── middleware/
│   │   ├── auth.middleware.ts # JWT verification, role extraction
│   │   ├── error.middleware.ts # Global error handler, JSON logging
│   │   └── validation.middleware.ts # Input validation (joi schemas)
│   ├── routes/
│   │   ├── auth.routes.ts     # POST /login, /logout, /register
│   │   ├── templates.routes.ts # GET/POST/PUT templates, /templates/:id/approve
│   │   ├── execution.routes.ts # GET/POST execution sheets, /sheets/:id/check-in, /check-out
│   │   └── admin.routes.ts    # GET dashboards (pending, processing, completed)
│   ├── app.ts                 # Express app setup (middleware, routes, error handler)
│   └── server.ts              # Server entry point (listen on port)
├── tests/
│   ├── unit/
│   │   ├── services/          # Service logic tests (auth, template, execution)
│   │   └── models/            # Model tests (entity validation)
│   ├── integration/
│   │   ├── auth.test.ts       # Login/logout flows
│   │   ├── template.test.ts   # Create, approve, list templates
│   │   ├── execution.test.ts  # Create, check-in, mark complete, check-out
│   │   └── concurrent.test.ts # Concurrent check-in rejection, exclusive access
│   └── contract/              # API schema validation
├── package.json
├── tsconfig.json
├── jest.config.js
└── .env.example               # DB path, JWT secret, port

frontend/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx      # Login form + session handling
│   │   │   └── layout.tsx
│   │   ├── (protected)/
│   │   │   ├── layout.tsx          # Auth guard, role-based sidebar
│   │   │   ├── templates/
│   │   │   │   ├── page.tsx        # Template list (pending + approved tabs)
│   │   │   │   ├── [id]/page.tsx   # Template detail + approval/edit forms
│   │   │   │   └── create/page.tsx # Template creation form (multi-step)
│   │   │   ├── execution/
│   │   │   │   ├── page.tsx        # Execution sheet list (processing + completed tabs)
│   │   │   │   ├── [id]/page.tsx   # Execution sheet detail (job expansion, checkboxes, state display)
│   │   │   │   └── create/page.tsx # Clone template → create execution sheet form
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx        # Role-specific home dashboard (pending templates, in-progress sheets, etc.)
│   │   │   └── settings/
│   │   │       └── page.tsx        # User profile, logout
│   │   └── error.tsx           # Global error boundary
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx   # Email/password input with validation
│   │   │   └── SessionProvider.tsx # Auth context, token refresh
│   │   ├── templates/
│   │   │   ├── TemplateForm.tsx # Form for creating/editing templates
│   │   │   ├── TemplateList.tsx # List with pagination, filtering
│   │   │   └── TemplateDetail.tsx # Read-only detail view
│   │   ├── execution/
│   │   │   ├── ExecutionForm.tsx # Form to clone template + customize dates
│   │   │   ├── JobList.tsx      # Expandable job list with procedures
│   │   │   ├── CheckinCheckout.tsx # Check-in/check-out buttons
│   │   │   └── StateTransition.tsx # State badge + action buttons (Approve, Complete, etc.)
│   │   ├── shared/
│   │   │   ├── Navbar.tsx       # Navigation, role indicator
│   │   │   ├── Sidebar.tsx      # Role-based menu
│   │   │   ├── Button.tsx       # Reusable button component
│   │   │   ├── Modal.tsx        # Reusable modal dialog
│   │   │   ├── Table.tsx        # Reusable data table
│   │   │   └── ErrorBoundary.tsx # Error boundary wrapper
│   ├── services/
│   │   ├── api.ts              # Axios instance with auth headers
│   │   ├── auth.service.ts     # API calls for login/logout
│   │   ├── template.service.ts # API calls for template CRUD
│   │   └── execution.service.ts # API calls for execution sheets
│   ├── hooks/
│   │   ├── useAuth.ts          # Auth context hook
│   │   ├── useFetch.ts         # Async data fetching with caching
│   │   └── useForm.ts          # Form state + validation
│   ├── store/
│   │   ├── auth.store.ts       # Zustand auth store (user, token, role)
│   │   └── ui.store.ts         # Zustand UI state (modals, notifications, dark mode)
│   ├── lib/
│   │   ├── format.ts           # Date/time formatting, number formatting
│   │   ├── validate.ts         # Shared validation utilities
│   │   └── constants.ts        # Enums, config constants
│   └── styles/
│       ├── globals.css         # Tailwind imports, global styles
│       └── variables.css       # CSS custom properties (colors, typography)
├── tests/
│   ├── unit/
│   │   ├── hooks/              # useAuth, useFetch, useForm tests
│   │   └── utils/              # Format, validate utility tests
│   ├── integration/
│   │   ├── auth.test.tsx       # Login/logout user flows
│   │   ├── templates.test.tsx  # Template list, create, approve workflows
│   │   ├── execution.test.tsx  # Execution sheet, check-in, completion workflows
│   │   └── concurrent.test.tsx # Concurrent check-in error handling
│   └── a11y/
│       ├── login.a11y.test.tsx # Accessibility tests (axe integration)
│       ├── templates.a11y.test.tsx
│       └── execution.a11y.test.tsx
├── package.json
├── tsconfig.json
├── jest.config.js
├── next.config.js
└── .env.local.example          # API URL, auth settings

root/
├── docker-compose.yml          # Optional: Local dev DB container
├── README.md                   # Project overview
├── CONTRIBUTING.md             # Dev guidelines (testing, code style, PR process)
├── .github/
│   ├── workflows/
│   │   ├── test.yml            # Run tests on PR
│   │   ├── lint.yml            # ESLint + Prettier check
│   │   └── a11y.yml            # Accessibility check (axe, Lighthouse)
│   └── PULL_REQUEST_TEMPLATE.md # PR checklist (tests, types, a11y, docs)
└── .gitignore
```

**Structure Decision**: 
- **Monorepo approach**: Separate `backend/` and `frontend/` directories for clarity, shared `src/` at each root. Simplifies local dev (single npm install in each) and deployment (independently scalable).
- **Next.js App Router**: Modern, file-based routing, React Server Components for data fetching, built-in middleware support.
- **Express backend**: Lightweight REST API, JSON request/response, middleware-based architecture fits our auth/logging/validation needs.
- **SQLite**: Single-file database (easy backup, portable), sufficient for <10GB medium-scale data, no operational overhead of managing separate DB server.

## Complexity Tracking

> Constitution gates passed; no violations identified. All decisions aligned with principles.

| Design Decision | Rationale | Simpler Alternative Rejected | 
|---|---|---|
| TypeScript on frontend + backend | Strong typing reduces bugs, improves IDE support, enables safe refactoring | JavaScript: Loses type safety, increases runtime errors in mid-project refactoring |
| SQLite (not PostgreSQL) | Embedded, zero ops overhead, fast for <10GB data, suits single-server deployment | Postgres: Overkill for current scale, requires separate DB management, adds deployment complexity |
| JWT-based auth (not sessions) | Stateless, scalable to multi-server if needed, simpler refresh token flow | Session store: Ties auth to single server, harder to scale horizontally |
| Exclusive check-in (not collaborative) | Prevents concurrent edit conflicts, simpler data model, matches fieldwork patterns | Multi-user concurrent: Complex conflict resolution, higher storage for conflict history |
| Next.js App Router (not Pages Router) | Modern, server components reduce client JS, simpler layouts and middleware | Pages Router: Legacy, more boilerplate, separate middleware handling |
| Structured JSON logs (not plain text) | Queryable in log aggregation systems, enables correlation IDs, metric parsing | Plain text: Manual log parsing, hard to automate alerting, poor searchability at scale |

---

**Plan Version**: 1.0.0 | **Status**: Ready for Phase 0 (Research) | **Created**: 2026-06-17
