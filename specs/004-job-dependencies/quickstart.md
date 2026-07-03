# Quickstart — Job Dependencies Feature

Developer quickstart to run locally with the new job-dependencies feature.

1. From the repo root, run:

```powershell
cd backend
npm install
npm run build
npm start
```

2. (Dev) For iterative work, delete the DB to reseed example templates:

```powershell
Remove-Item .\data\jobsheet.db -Force
npm run dev
```

3. Example template seeded: `Dependency Example` includes three jobs: initial job, a job depending on the initial job, and a time-dependent job.

4. API endpoints of interest:
- `POST /api/execution-sheets` — create execution from template
- `POST /api/execution-sheets/:id/jobs/:jobId/complete` — mark job complete (enforced dependencies)
# Quickstart: Job Dependencies Feature (local)

1. Ensure the repo is on the feature branch:

```powershell
git checkout 004-job-dependencies
```

2. Install dependencies (root uses separate frontend/backend):

```bash
# backend
cd backend
npm install
# frontend
cd ../frontend
npm install
```

3. Run local dev servers (two terminals):

```bash
# backend
cd backend
npm run dev
# frontend
cd frontend
npm run dev
```

4. Run tests for new feature (after implementation):

```bash
# backend tests
cd backend
npm test -- -t "job dependency"
# frontend tests
cd frontend
npm test -- -t "job dependency"
```

