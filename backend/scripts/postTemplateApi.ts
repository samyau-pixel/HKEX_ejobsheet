import fetch from 'node-fetch';
import { initializeDatabase } from '../src/db/schema.js';
import { seedDatabase } from '../src/db/seed.js';
import { AuthService } from '../src/services/auth.service.js';

(async () => {
  await initializeDatabase();
  await seedDatabase();

  const manager = { id: 'user-manager-001', email: 'manager@test.com', name: 'Jane Manager', role: 'Manager' };
  const token = AuthService.generateToken(manager as any);

  const payload = {
    name: 'API Create Template',
    jobs: [
      { name: 'API Job A', order: 1, procedures: [{ name: 'PA', order: 1 }], timeDependency: '2026-07-02T11:00', prerequisiteOrders: [] },
      { name: 'API Job B', order: 2, procedures: [{ name: 'PB', order: 1 }], prerequisiteOrders: [1] }
    ]
  };

  const res = await fetch('http://localhost:3001/api/templates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });

  console.log('status', res.status);
  const body = await res.text();
  console.log('body:', body);
})();
