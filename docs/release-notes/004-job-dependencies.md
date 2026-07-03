# Release Notes: Job Dependencies (004-job-dependencies)

Summary:
- Adds `timeDependency` and `prerequisiteJobIds` to template and execution jobs.
- Enforces time-based and job-based prerequisites when marking jobs complete.
- Seed data includes an example template demonstrating dependencies.

Developer notes:
- Schema migration and backfill are idempotent; schema initialization will ignore existing columns.
- Use `npm run build && npm start` for stable runs.
