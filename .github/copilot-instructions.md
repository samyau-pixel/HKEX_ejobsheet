<!-- SPECKIT START -->
**Active Feature**: Job Dependencies (`004-job-dependencies`)

**Spec**: [specs/004-job-dependencies/spec.md](specs/004-job-dependencies/spec.md)  
**Plan**: [specs/004-job-dependencies/plan.md](specs/004-job-dependencies/plan.md)

**Tech Stack** (Enforced):
- Frontend: Next.js 14+ (App Router) with React 18+, TypeScript, Tailwind CSS
- Backend: Node.js 18+, Express, TypeScript
- Database: SQLite (single-file, <10GB, 2-year retention lifecycle)
- Testing: Jest (unit), Supertest (integration), React Testing Library (UI), axe (accessibility)
- Auth: JWT tokens (1h expiry) + email/password (bcryptjs hashing)

**Key Decisions**:
- Exclusive single check-in per jobsheet (no concurrent access)
- Stateless REST API with JSON payloads
- Structured JSON logging (pino) for observability
- WCAG AA accessibility compliance target
- 80% test coverage baseline (constitution II requirement)

**Artifacts**:
- plan.md: Technical context, project structure, constitution gates
- research.md: Technology validation, best practices (auth, state machine, TDD)
- data-model.md: 6 normalized entities, DDL, query patterns
- contracts/: auth.md, templates.md, execution-sheets.md (API endpoints)
- quickstart.md: Local dev setup in <10 minutes

For detailed information, read the active plan and related design documents.
<!-- SPECKIT END -->
