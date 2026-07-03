import { TemplateService } from '../../src/services/template.service.js';
import { ApiError } from '../../src/middleware/error.middleware.js';

describe('TemplateService.validateTemplate', () => {
  test('detects circular dependencies', async () => {
    const input = {
      name: 'Circular Test',
      jobs: [
        { name: 'A', procedures: [{ name: 'p', order: 1 }], order: 1, prerequisiteOrders: [3] },
        { name: 'B', procedures: [{ name: 'p', order: 1 }], order: 2, prerequisiteOrders: [1] },
        { name: 'C', procedures: [{ name: 'p', order: 1 }], order: 3, prerequisiteOrders: [2] },
      ],
    } as any;

    await expect(TemplateService.validateTemplate(input)).rejects.toThrow(ApiError);
  });

  test('accepts acyclic dependencies', async () => {
    const input = {
      name: 'Acyclic Test',
      jobs: [
        { name: 'A', procedures: [{ name: 'p', order: 1 }], order: 1 },
        { name: 'B', procedures: [{ name: 'p', order: 1 }], order: 2, prerequisiteOrders: [1] },
        { name: 'C', procedures: [{ name: 'p', order: 1 }], order: 3, prerequisiteOrders: [1, 2] },
      ],
    } as any;

    await expect(TemplateService.validateTemplate(input)).resolves.toBeUndefined();
  });
});
