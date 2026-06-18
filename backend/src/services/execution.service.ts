import { TemplateModel } from '../models/template.model.js';
import { JobModel } from '../models/job.model.js';
// ProcedureModel not required here; kept import removed to avoid unused var
import { ExecutionModel } from '../models/execution.model.js';
import { ExecutionJobModel } from '../models/execution-job.model.js';
import { JobCompletionModel } from '../models/job-completion.model.js';
import { ProcedureModel } from '../models/procedure.model.js';
import { ApiError } from '../middleware/error.middleware.js';

export class ExecutionService {
  static async createExecutionFromTemplate(userId: string, templateId: string, name?: string) {
    const template = await TemplateModel.getTemplate(templateId);
    if (!template) throw new ApiError(404, 'TEMPLATE_NOT_FOUND', `Template ${templateId} not found`);
    if (template.state !== 'Approved') throw new ApiError(400, 'TEMPLATE_NOT_APPROVED', 'Template must be approved to create execution sheet');

    const sheetName = name || `${template.name} - Execution ${new Date().toISOString()}`;

    const execution = await ExecutionModel.createExecutionSheet(templateId, userId, sheetName);

    const jobs = await JobModel.getJobsByTemplate(templateId);

    for (const job of jobs) {
      // create execution job
      await ExecutionJobModel.createExecutionJob(execution.id, job.id, job.expected_start, job.expected_end);
      // create job completion stub
      await JobCompletionModel.createJobCompletion(execution.id, job.id);
    }

    return execution;
  }

  static async checkInExecution(executionId: string, userId: string) {
    const execution: any = await ExecutionModel.getExecutionById(executionId);
    if (!execution) throw new ApiError(404, 'EXECUTION_NOT_FOUND', `Execution ${executionId} not found`);

    if (execution.state !== 'Pending') {
      throw new ApiError(409, 'INVALID_STATE', 'Execution must be in Pending state to check-in');
    }

    await ExecutionModel.setCheckedIn(executionId, userId);
    return await ExecutionModel.getExecutionById(executionId);
  }

  static async markJobComplete(executionId: string, jobId: string, userId: string) {
    const execution: any = await ExecutionModel.getExecutionById(executionId);
    if (!execution) throw new ApiError(404, 'EXECUTION_NOT_FOUND', `Execution ${executionId} not found`);

    if (execution.state !== 'Processing') {
      throw new ApiError(409, 'INVALID_STATE', 'Execution must be Processing to complete jobs');
    }

    await JobCompletionModel.markCompleted(executionId, jobId, userId);
    return { executionId, jobId };
  }

  static async unmarkJobComplete(executionId: string, jobId: string) {
    const execution: any = await ExecutionModel.getExecutionById(executionId);
    if (!execution) throw new ApiError(404, 'EXECUTION_NOT_FOUND', `Execution ${executionId} not found`);
    if (execution.state !== 'Processing') {
      throw new ApiError(409, 'INVALID_STATE', 'Execution must be Processing to change job completion');
    }
    await JobCompletionModel.unmarkCompleted(executionId, jobId);
    return { executionId, jobId };
  }

  static async completeExecutionSheet(executionId: string, _userId: string) {
    const execution: any = await ExecutionModel.getExecutionById(executionId);
    if (!execution) throw new ApiError(404, 'EXECUTION_NOT_FOUND', `Execution ${executionId} not found`);

    if (execution.state !== 'Processing') {
      throw new ApiError(409, 'INVALID_STATE', 'Execution must be Processing to be completed');
    }

    const completed = await JobCompletionModel.countCompleted(executionId);
    const total = await JobCompletionModel.countTotal(executionId);

    if (total === 0) throw new ApiError(400, 'NO_JOBS', 'Execution has no jobs');
    if (completed < total) throw new ApiError(400, 'INCOMPLETE_JOBS', 'Not all jobs are completed');

    await ExecutionModel.updateState(executionId, 'Completed');
    return await ExecutionModel.getExecutionById(executionId);
  }

  static async listExecutions(userId?: string, state?: string) {
    return ExecutionModel.listExecutions(userId, state as any);
  }

  static async getExecutionDetail(executionId: string) {
    const execution: any = await ExecutionModel.getExecutionById(executionId);
    if (!execution) throw new ApiError(404, 'EXECUTION_NOT_FOUND', `Execution ${executionId} not found`);

    const jobs = await ExecutionJobModel.getJobsByExecution(executionId);
    const completions = await JobCompletionModel.getCompletionsByExecution(executionId);

    const jobsWithStatus = [];
    for (const j of jobs) {
      const comp = completions.find((c: any) => c.job_id === j.job_id) || null;
      const procedures = await ProcedureModel.getProceduresByJob(j.job_id);
      jobsWithStatus.push({
        ...j,
        completed: comp ? !!comp.completed : false,
        completed_by: comp ? comp.completed_by : null,
        procedures,
      });
    }

    return {
      ...execution,
      jobs: jobsWithStatus,
    };
  }
}
