import { TemplateService } from '../../src/services/template.service.js';
import { ExecutionService } from '../../src/services/execution.service.js';

export async function createApprovedTemplateWithOneJob(userId = 'user-manager-001') {
  const input = {
    name: 'Fixture Template',
    jobs: [
      {
        name: 'Fixture Job 1',
        order: 1,
        procedures: [
          { name: 'Step 1', order: 1 },
        ],
      },
    ],
  };

  const template = await TemplateService.createTemplate(userId, input as any);
  await TemplateService.approveTemplate(template.id);
  return template;
}

export async function createExecutionFromTemplateAndCheckIn(userId = 'user-operator-001', templateId: string) {
  const execution = await ExecutionService.createExecutionFromTemplate(userId, templateId);
  await ExecutionService.checkInExecution(execution.id, userId);
  return execution;
}

export default {
  createApprovedTemplateWithOneJob,
  createExecutionFromTemplateAndCheckIn,
};
