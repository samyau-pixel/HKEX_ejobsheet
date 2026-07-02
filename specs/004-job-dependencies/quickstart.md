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

