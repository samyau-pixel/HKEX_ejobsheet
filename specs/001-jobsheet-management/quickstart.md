# Quickstart: Role-Based Jobsheet Management System

**Phase**: 1 (Design) | **Date**: 2026-06-17

Local development setup guide. Get the full-stack application running in <10 minutes.

---

## Prerequisites

- **Node.js**: 18+ (LTS recommended; check with `node --version`)
- **npm**: 9+ (comes with Node.js)
- **Git**: For cloning repository
- **Text Editor/IDE**: VS Code recommended (with extensions: ESLint, Prettier, Thunder Client)

---

## Repository Structure

```
ejobsheet/                          # Root project directory
├── backend/                        # Node.js/Express API server
│   ├── src/
│   ├── tests/
│   ├── package.json
│   └── .env.example
├── frontend/                       # Next.js React web app
│   ├── src/
│   ├── tests/
│   ├── package.json
│   └── .env.local.example
├── docker-compose.yml              # Optional: SQLite + dev container
└── README.md
```

---

## Step 1: Clone Repository & Install Dependencies

```bash
# Clone the repository (or init if new)
git clone <repository-url> ejobsheet
cd ejobsheet

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies (in new terminal)
cd ../frontend
npm install

# Return to root for next steps
cd ..
```

**Expected Output**:
```
added XXX packages in X.XXs
npm notice created a lockfile as package-lock.json
```

---

## Step 2: Setup Environment Variables

### Backend Configuration

```bash
cd backend

# Copy example environment file
cp .env.example .env.local

# Edit .env.local with your settings
cat > .env.local << 'EOF'
# Server
NODE_ENV=development
PORT=3001
HOST=localhost

# Database
DATABASE_URL=./data/jobsheet.db

# JWT
JWT_SECRET=your-super-secret-key-min-32-characters-for-production
JWT_EXPIRY=1h
REFRESH_TOKEN_EXPIRY=7d

# Logging
LOG_LEVEL=info

# CORS (frontend URL)
FRONTEND_URL=http://localhost:3000
EOF
```

### Frontend Configuration

```bash
cd ../frontend

# Copy example environment file
cp .env.local.example .env.local

# Edit .env.local
cat > .env.local << 'EOF'
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Feature Flags (optional)
NEXT_PUBLIC_ENABLE_MOCK_DATA=false
EOF
```

---

## Step 3: Initialize Database

The backend will auto-initialize SQLite on first run, but you can manually seed test data:

```bash
cd backend

# Create data directory
mkdir -p data

# Seed test data (optional)
npm run db:seed
```

**What it does**:
- Creates `data/jobsheet.db` SQLite file
- Initializes tables (users, templates, jobs, procedures, execution_jobsheets, etc.)
- Inserts test users:
  - Manager: `manager@test.com` / `Password123!`
  - Operator Leader: `leader@test.com` / `Password123!`
  - Operator: `operator@test.com` / `Password123!`

---

## Step 4: Start Backend Server

```bash
cd backend
npm run dev
```

**Expected Output**:
```
[info] Server listening on http://localhost:3001
[info] Database connected: ./data/jobsheet.db
[info] JWT configured with 1h expiry
```

The backend is now running on `http://localhost:3001`.

**Note**: Keep this terminal open or run in background.

---

## Step 5: Start Frontend Development Server

In a **new terminal**:

```bash
cd frontend
npm run dev
```

**Expected Output**:
```
  ▲ Next.js 14.x.x
  - Local:        http://localhost:3000
  - Environments: .env.local

✓ Ready in 2.5s
```

The frontend is now running on `http://localhost:3000`.

---

## Step 6: Access the Application

Open your browser to:

```
http://localhost:3000
```

You should see the **Login Page**. Use test credentials:

### Test Users

| Role | Email | Password | Access |
|------|-------|----------|--------|
| Manager | manager@test.com | Password123! | All dashboards, approvals, reports |
| Operator Leader | leader@test.com | Password123! | Templates, execution, completed sheets |
| Operator | operator@test.com | Password123! | Create templates, execute jobsheets |

---

## Step 7: Run Tests

### Backend Tests

```bash
cd backend

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode (auto-rerun on file changes)
npm run test:watch
```

### Frontend Tests

```bash
cd frontend

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run end-to-end tests (requires servers running)
npm run test:e2e
```

---

## Step 8: Verify API Endpoints

Use Thunder Client, Postman, or curl to test API:

### 1. Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "operator@test.com",
    "password": "Password123!"
  }'
```

**Response**:
```json
{
  "status": 200,
  "data": {
    "user": { "id": "user-001", "email": "operator@test.com", "role": "Operator" },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "1h"
  }
}
```

### 2. Get Templates

```bash
TOKEN="<paste-token-from-login-response>"

curl -X GET http://localhost:3001/api/templates \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Create Execution Sheet

```bash
curl -X POST http://localhost:3001/api/execution-sheets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": "tmpl-001",
    "name": "Daily Maint - June 17",
    "jobs": [{"jobId": "job-001"}]
  }'
```

See [contracts/](contracts/) for full API documentation.

---

## Common Workflows

### Create a Jobsheet Template (Operator)

1. Login as **Operator** (`operator@test.com`)
2. Navigate to **Templates** → **Create Template**
3. Enter:
   - Name: "Equipment Inspection"
   - Job 1: "Pre-flight checks" (procedures: "Battery", "Fuel", "Lights")
   - Job 2: "Safety check" (procedures: "Brakes", "Steering", "Tires")
4. Click **Submit** → Template saved as "Pending"

### Approve Template (Manager)

1. Login as **Manager** (`manager@test.com`)
2. Go to **Templates** → **Pending Templates**
3. Click template → Review details
4. Click **Approve** → State transitions to "Approved"

### Execute Jobsheet (Operator)

1. Login as **Operator** (`operator@test.com`)
2. Navigate to **Execution** → **Create New**
3. Select approved template → Customize dates if needed
4. Click **Create** → Sheet appears in "Processing" dashboard
5. Click **Check-In** → "Processing" state, exclusive access locked
6. Click **Job 1** → Expand procedures
7. After completing procedures, click **Mark Complete**
8. Repeat for remaining jobs
9. Click **Complete Jobsheet** → Transitions to "Completed"

### Partial Execution with Checkout (Operator)

1. Check-in to an Execution Jobsheet
2. Mark Job 1 complete
3. Click **Check-Out** → State returns to "Pending", progress saved
4. Later: Check-in again → Job 1 still marked complete
5. Mark remaining jobs complete
6. Click **Complete Jobsheet**

### Review Completed Jobsheets (Manager/Leader)

1. Login as **Manager** or **Operator Leader**
2. Navigate to **Completed Jobsheets**
3. Click any jobsheet to view:
   - All jobs and procedures
   - Completion status and timestamps
   - Operator who executed
   - Duration and notes

---

## Troubleshooting

### Backend fails to start: "Port 3001 already in use"

```bash
# Find process using port 3001
lsof -i :3001      # macOS/Linux
netstat -ano | findstr :3001  # Windows

# Kill process (replace PID)
kill -9 <PID>   # macOS/Linux
taskkill /PID <PID> /F  # Windows

# Or use different port in .env.local
PORT=3002
```

### Database locked error: "SQLITE_BUSY"

```bash
# SQLite is single-threaded; ensure only one backend instance running
ps aux | grep "node"   # Check running processes

# Delete database to reset
cd backend
rm data/jobsheet.db
npm run db:seed
```

### Frontend can't connect to backend: "CORS error" or "Failed to fetch"

1. Verify backend is running: `curl http://localhost:3001/health`
2. Check `FRONTEND_URL` in backend `.env.local` matches frontend origin
3. Check `NEXT_PUBLIC_API_URL` in frontend `.env.local`

### Tests fail with "Cannot find module"

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild backend TypeScript
npm run build
```

---

## Development Tips

### Hot Reload

- **Backend**: Changes auto-reload in dev mode (nodemon)
- **Frontend**: Changes auto-reload (Next.js dev server)
- **Database**: Changes persist; restart server if schema modified

### Linting & Formatting

```bash
# Fix formatting across backend
cd backend
npm run lint:fix

# Format code
npm run format

# Run in frontend too
cd ../frontend
npm run lint:fix
npm run format
```

### Database Inspection

```bash
# SQLite CLI (install if needed: brew install sqlite3)
sqlite3 backend/data/jobsheet.db

# Common queries in sqlite CLI
.tables                              # List tables
SELECT * FROM users;                # View users
SELECT * FROM templates;            # View templates
.schema users                        # Show table schema
```

### Mock Data Generation

Test workflows with seed data:

```bash
cd backend
npm run db:seed       # Insert test users + templates
npm run db:reset      # Wipe database + reseed
```

---

## Deploy to Production (Future)

When ready to deploy:

1. **Build frontend**: `cd frontend && npm run build`
2. **Build backend**: `cd backend && npm run build`
3. **Set production environment variables** (use secrets manager, not .env files)
4. **Use PostgreSQL** instead of SQLite for multi-server scaling
5. **Run behind reverse proxy** (nginx, AWS ALB) for HTTPS
6. **Setup CI/CD pipeline** (GitHub Actions, GitLab CI)

For now, local development setup is complete!

---

## Next Steps

1. ✅ Backend + frontend running
2. ✅ Test API endpoints
3. 👉 **Run tests** to ensure quality baseline
4. 👉 **Create first template** and test workflow
5. 👉 **Review tasks.md** for implementation checklist

---

**Quickstart Version**: 1.0.0 | **Status**: Ready for Local Development
