import { initializeDatabase } from '../src/db/schema.js';
import { seedDatabase } from '../src/db/seed.js';
import { TemplateService } from '../src/services/template.service.js';

const id = process.argv[2];
(async () => {
  await initializeDatabase();
  await seedDatabase();
  const t = await TemplateService.getTemplate(id);
  console.log(JSON.stringify(t, null, 2));
})();
