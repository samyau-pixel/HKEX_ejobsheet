import { TemplateService } from '../dist/services/template.service.js';
import { ApiError } from '../dist/middleware/error.middleware.js';

async function run() {
  console.log('Running template cycle-detection checks...');

  const circular = {
    name: 'Circular Test',
    jobs: [
      { name: 'A', procedures: [{ name: 'p', order: 1 }], order: 1, prerequisiteOrders: [3] },
      { name: 'B', procedures: [{ name: 'p', order: 1 }], order: 2, prerequisiteOrders: [1] },
      { name: 'C', procedures: [{ name: 'p', order: 1 }], order: 3, prerequisiteOrders: [2] },
    ],
  };

  try {
    await TemplateService.validateTemplate(circular);
    console.error('ERROR: Circular input did not throw');
    process.exitCode = 2;
  } catch (e) {
    if (e && e.code === 'VALIDATION_ERROR') console.log('OK: Circular detected');
    else console.error('ERROR: unexpected error for circular test', e);
  }

  const acyclic = {
    name: 'Acyclic Test',
    jobs: [
      { name: 'A', procedures: [{ name: 'p', order: 1 }], order: 1 },
      { name: 'B', procedures: [{ name: 'p', order: 1 }], order: 2, prerequisiteOrders: [1] },
      { name: 'C', procedures: [{ name: 'p', order: 1 }], order: 3, prerequisiteOrders: [1, 2] },
    ],
  };

  try {
    await TemplateService.validateTemplate(acyclic);
    console.log('OK: Acyclic accepted');
  } catch (e) {
    console.error('ERROR: Acyclic test failed', e);
    process.exitCode = 2;
  }
}

run();
