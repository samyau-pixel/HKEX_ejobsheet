/**
 * Manual Test Runner for Jobsheet Management System
 * This script runs key test scenarios against the running dev server
 * 
 * Usage: node --loader ts-node/esm tests/manual-test-runner.ts
 */

import fetch from 'node-fetch';
import { initializeDatabase } from '../src/db/schema.js';
import { seedDatabase } from '../src/db/seed.js';
import { AuthService } from '../src/services/auth.service.js';
import { TemplateService } from '../src/services/template.service.js';

const BASE_URL = 'http://localhost:3001/api';

// Test results tracking
const results: { passed: number; failed: number; tests: string[] } = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name: string, passed: boolean, message?: string) {
  if (passed) {
    console.log(`✅ PASS: ${name}`);
    results.passed++;
  } else {
    console.log(`❌ FAIL: ${name}${message ? ` - ${message}` : ''}`);
    results.failed++;
  }
  results.tests.push(`${passed ? 'PASS' : 'FAIL'}: ${name}`);
}

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    logTest(name, true);
  } catch (error: any) {
    logTest(name, false, error.message);
  }
}

async function runTests() {
  console.log('\n🧪 Running Manual Tests...\n');

  // Initialize database
  await initializeDatabase();
  await seedDatabase();

  // Get tokens
  const manager = { id: 'user-manager-001', email: 'manager@test.com', name: 'Jane Manager', role: 'Manager' };
  const operator = { id: 'user-operator-001', email: 'operator@test.com', name: 'Alice Operator', role: 'Operator' };
  const managerToken = AuthService.generateToken(manager as any);
  const operatorToken = AuthService.generateToken(operator as any);

  // ==================== T019-T023: Template Tests ====================
  console.log('\n--- Template Creation Tests (T019-T023) ---\n');

  await test('T019: Requires authorization for template creation', async () => {
    const res = await fetch(`${BASE_URL}/templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test', jobs: [] })
    });
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  await test('T020: Manager can create template', async () => {
    const res = await fetch(`${BASE_URL}/templates`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${managerToken}`
      },
      body: JSON.stringify({
        name: 'Manager Template',
        jobs: [{ name: 'Job 1', order: 1, procedures: [{ name: 'Proc 1', order: 1 }] }]
      })
    });
    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`);
    const data = await res.json();
    if (data.data.state !== 'Pending') throw new Error('Template should be Pending');
  });

  await test('T021: Template validation - requires jobs', async () => {
    const res = await fetch(`${BASE_URL}/templates`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${managerToken}`
      },
      body: JSON.stringify({ name: 'Test', jobs: [] })
    });
    if (res.status !== 422) throw new Error(`Expected 422, got ${res.status}`);
  });

  await test('T022: Operator cannot create template (403)', async () => {
    const res = await fetch(`${BASE_URL}/templates`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${operatorToken}`
      },
      body: JSON.stringify({
        name: 'Operator Template',
        jobs: [{ name: 'Job 1', order: 1, procedures: [{ name: 'Proc 1', order: 1 }] }]
      })
    });
    if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
  });

  await test('T023: Template persists correctly', async () => {
    const createRes = await fetch(`${BASE_URL}/templates`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${managerToken}`
      },
      body: JSON.stringify({
        name: 'Persistence Test',
        jobs: [{ name: 'Job 1', order: 1, procedures: [{ name: 'Proc 1', order: 1 }] }]
      })
    });
    const template = await createRes.json();
    const templateId = template.data.id;

    const getRes = await fetch(`${BASE_URL}/templates/${templateId}`, {
      headers: { 'Authorization': `Bearer ${managerToken}` }
    });
    if (getRes.status !== 200) throw new Error(`Expected 200, got ${getRes.status}`);
  });

  // ==================== T035-T037: Approval Tests ====================
  console.log('\n--- Template Approval Tests (T035-T037) ---\n');

  // Create a pending template first
  const pendingTemplateRes = await fetch(`${BASE_URL}/templates`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${managerToken}`
    },
    body: JSON.stringify({
      name: 'Approval Test Template',
      jobs: [{ name: 'Job 1', order: 1, procedures: [{ name: 'Proc 1', order: 1 }] }]
    })
  });
  const pendingTemplate = await pendingTemplateRes.json();
  const pendingTemplateId = pendingTemplate.data.id;

  await test('T035: Manager can approve template', async () => {
    const res = await fetch(`${BASE_URL}/templates/${pendingTemplateId}/approve`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${managerToken}` }
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = await res.json();
    if (data.data.state !== 'Approved') throw new Error('Template should be Approved');
  });

  await test('T036: Operator cannot approve template (403)', async () => {
    // Create another pending template
    const pendingRes = await fetch(`${BASE_URL}/templates`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${managerToken}`
      },
      body: JSON.stringify({
        name: 'Another Template',
        jobs: [{ name: 'Job 1', order: 1, procedures: [{ name: 'Proc 1', order: 1 }] }]
      })
    });
    const template = await pendingRes.json();
    
    const res = await fetch(`${BASE_URL}/templates/${template.data.id}/approve`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${operatorToken}` }
    });
    if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
  });

  // ==================== T045-T048: Execution Creation Tests ====================
  console.log('\n--- Execution Creation Tests (T045-T048) ---\n');

  // Create an approved template for execution tests
  const execTemplateRes = await fetch(`${BASE_URL}/templates`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${managerToken}`
    },
    body: JSON.stringify({
      name: 'Execution Test Template',
      jobs: [{ name: 'Job 1', order: 1, procedures: [{ name: 'Proc 1', order: 1 }] }]
    })
  });
  const execTemplate = await execTemplateRes.json();
  
  await fetch(`${BASE_URL}/templates/${execTemplate.data.id}/approve`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${managerToken}` }
  });

  await test('T045: Manager can create execution sheet', async () => {
    const res = await fetch(`${BASE_URL}/execution-sheets`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${managerToken}`
      },
      body: JSON.stringify({ templateId: execTemplate.data.id, name: 'Test Execution' })
    });
    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`);
  });

  await test('T046: OperatorLeader can create execution sheet', async () => {
    const operatorLeader = { id: 'user-leader-001', email: 'leader@test.com', name: 'John Leader', role: 'OperatorLeader' };
    const operatorLeaderToken = AuthService.generateToken(operatorLeader as any);
    
    const res = await fetch(`${BASE_URL}/execution-sheets`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${operatorLeaderToken}`
      },
      body: JSON.stringify({ templateId: execTemplate.data.id, name: 'Leader Execution' })
    });
    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`);
  });

  await test('T047: Operator cannot create execution sheet (403)', async () => {
    const res = await fetch(`${BASE_URL}/execution-sheets`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${operatorToken}`
      },
      body: JSON.stringify({ templateId: execTemplate.data.id, name: 'Operator Execution' })
    });
    if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
  });

  await test('T048: Cannot create execution from unapproved template', async () => {
    const unapprovedRes = await fetch(`${BASE_URL}/templates`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${managerToken}`
      },
      body: JSON.stringify({
        name: 'Unapproved Template',
        jobs: [{ name: 'Job 1', order: 1, procedures: [{ name: 'Proc 1', order: 1 }] }]
      })
    });
    const unapproved = await unapprovedRes.json();
    
    const res = await fetch(`${BASE_URL}/execution-sheets`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${managerToken}`
      },
      body: JSON.stringify({ templateId: unapproved.data.id, name: 'Test' })
    });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  // ==================== T060-T065: Execution Tests ====================
  console.log('\n--- Execution Workflow Tests (T060-T065) ---\n');

  // Setup: Create and check-in an execution sheet
  const setupExecRes = await fetch(`${BASE_URL}/execution-sheets`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${managerToken}`
    },
    body: JSON.stringify({ templateId: execTemplate.data.id, name: 'Workflow Test' })
  });
  const setupExec = await setupExecRes.json();
  const executionId = setupExec.data.id;
  const jobId = setupExec.data.jobs[0].id;

  await fetch(`${BASE_URL}/execution-sheets/${executionId}/check-in`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${operatorToken}` }
  });

  await test('T060: Check-in transitions state to Processing', async () => {
    const res = await fetch(`${BASE_URL}/execution-sheets/${executionId}`, {
      headers: { 'Authorization': `Bearer ${operatorToken}` }
    });
    const data = await res.json();
    if (data.data.state !== 'Processing') throw new Error('State should be Processing');
  });

  await test('T061: Can mark job as complete', async () => {
    const res = await fetch(`${BASE_URL}/execution-sheets/${executionId}/jobs/${jobId}/complete`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${operatorToken}` }
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  });

  await test('T062: Job completion is tracked', async () => {
    const res = await fetch(`${BASE_URL}/execution-sheets/${executionId}`, {
      headers: { 'Authorization': `Bearer ${operatorToken}` }
    });
    const data = await res.json();
    const job = data.data.jobs.find((j: any) => j.job_id === jobId);
    if (!job.completed) throw new Error('Job should be completed');
  });

  await test('T063: Cannot complete sheet with incomplete jobs', async () => {
    // Create another execution with 2 jobs
    const multiJobTemplateRes = await fetch(`${BASE_URL}/templates`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${managerToken}`
      },
      body: JSON.stringify({
        name: 'Multi Job Template',
        jobs: [
          { name: 'Job 1', order: 1, procedures: [{ name: 'Proc 1', order: 1 }] },
          { name: 'Job 2', order: 2, procedures: [{ name: 'Proc 2', order: 1 }] }
        ]
      })
    });
    const multiJobTemplate = await multiJobTemplateRes.json();
    
    await fetch(`${BASE_URL}/templates/${multiJobTemplate.data.id}/approve`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${managerToken}` }
    });

    const multiExecRes = await fetch(`${BASE_URL}/execution-sheets`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${managerToken}`
      },
      body: JSON.stringify({ templateId: multiJobTemplate.data.id, name: 'Multi Job Exec' })
    });
    const multiExec = await multiExecRes.json();
    const multiExecId = multiExec.data.id;
    const multiJob1Id = multiExec.data.jobs[0].id;

    await fetch(`${BASE_URL}/execution-sheets/${multiExecId}/check-in`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${operatorToken}` }
    });

    // Mark only first job complete
    await fetch(`${BASE_URL}/execution-sheets/${multiExecId}/jobs/${multiJob1Id}/complete`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${operatorToken}` }
    });

    // Try to complete sheet
    const res = await fetch(`${BASE_URL}/execution-sheets/${multiExecId}/complete`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${operatorToken}` }
    });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  await test('T064: Can complete sheet when all jobs done', async () => {
    // Mark second job complete
    const multiExecId = (await (await fetch(`${BASE_URL}/execution-sheets`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${managerToken}`
      },
      body: JSON.stringify({ templateId: execTemplate.data.id, name: 'Complete Test' })
    })).json()).data.id;
    
    const multiJobId = (await (await fetch(`${BASE_URL}/execution-sheets/${multiExecId}`, {
      headers: { 'Authorization': `Bearer ${managerToken}` }
    })).json()).data.jobs[0].id;

    await fetch(`${BASE_URL}/execution-sheets/${multiExecId}/check-in`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${operatorToken}` }
    });

    await fetch(`${BASE_URL}/execution-sheets/${multiExecId}/jobs/${multiJobId}/complete`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${operatorToken}` }
    });

    const res = await fetch(`${BASE_URL}/execution-sheets/${multiExecId}/complete`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${operatorToken}` }
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = await res.json();
    if (data.data.state !== 'Completed') throw new Error('State should be Completed');
  });

  await test('T065: Concurrent check-in is rejected', async () => {
    // Create new execution
    const concExecRes = await fetch(`${BASE_URL}/execution-sheets`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${managerToken}`
      },
      body: JSON.stringify({ templateId: execTemplate.data.id, name: 'Concurrent Test' })
    });
    const concExec = await concExecRes.json();
    const concExecId = concExec.data.id;

    // First check-in
    await fetch(`${BASE_URL}/execution-sheets/${concExecId}/check-in`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${operatorToken}` }
    });

    // Second check-in should fail
    const res = await fetch(`${BASE_URL}/execution-sheets/${concExecId}/check-in`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${managerToken}` }
    });
    if (res.status !== 409) throw new Error(`Expected 409, got ${res.status}`);
  });

  // ==================== Summary ====================
  console.log('\n' + '='.repeat(50));
  console.log(`📊 Test Results: ${results.passed} passed, ${results.failed} failed`);
  console.log('='.repeat(50) + '\n');

  if (results.failed > 0) {
    console.log('Failed tests:');
    results.tests.filter(t => t.startsWith('FAIL')).forEach(t => console.log(`  - ${t}`));
    process.exit(1);
  } else {
    console.log('✅ All tests passed!');
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
