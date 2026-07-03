import { initializeDatabase } from '../src/db/schema.js';
import { seedDatabase } from '../src/db/seed.js';
import { TemplateService } from '../src/services/template.service.js';

(async () => {
  await initializeDatabase();
  await seedDatabase();
  const input = {
    name: 'Direct Create Template',
    jobs: [
      { name: 'Job A', order: 1, procedures: [{ name: 'PA1', order: 1 }], timeDependency: '2026-07-02T10:00', prerequisiteOrders: [] },
      { name: 'Job B', order: 2, procedures: [{ name: 'PB1', order: 1 }], timeDependency: undefined, prerequisiteOrders: [1] },
    ],
  };

  const t = await TemplateService.createTemplate('user-manager-001', input as any);
  console.log(JSON.stringify(t, null, 2));
})();
