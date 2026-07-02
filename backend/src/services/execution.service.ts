import { TemplateModel } from '../models/template.model.js';
import { JobModel } from '../models/job.model.js';
// ProcedureModel not required here; kept import removed to avoid unused var
import { ExecutionModel } from '../models/execution.model.js';
import { ExecutionJobModel } from '../models/execution-job.model.js';
import { JobCompletionModel } from '../models/job-completion.model.js';
import { ProcedureModel } from '../models/procedure.model.js';
import { ApiError } from '../middleware/error.middleware.js';
import { LeaderReviewService } from './leader-review.service.js';

export class ExecutionService {
  static async createExecutionFromTemplate(userId: string, templateId: string, name?: string) {
    const template = await TemplateModel.getTemplate(templateId);
    if (!template) throw new ApiError(404, 'TEMPLATE_NOT_FOUND', `Template ${templateId} not found`);
    if (template.state !== 'Approved') throw new ApiError(400, 'TEMPLATE_NOT_APPROVED', 'Template must be approved to create execution sheet');

    const sheetName = name || `${template.name} - Execution ${new Date().toISOString()}`;

    const execution = await ExecutionModel.createExecutionSheet(templateId, userId, sheetName);

    const jobs = await JobModel.getJobsByTemplate(templateId);

    // First pass: create execution jobs and map template job ids -> execution job ids
    const mapping: Record<string, string> = {};
    for (const job of jobs) {
      const execJob = await ExecutionJobModel.createExecutionJob(
        execution.id,
        job.id,
        job.expected_start,
        job.expected_end,
        job.timeDependency || job.time_dependency,
        null // prerequisites will be set in second pass
      );
      mapping[job.id] = execJob.id;
      // create job completion stub
      await JobCompletionModel.createJobCompletion(execution.id, job.id);
    }

    // Second pass: update execution_jobs prerequisite_job_ids to point to execution job ids
    for (const job of jobs) {
      const rawPrereq = job.prerequisite_job_ids || job.prerequisiteJobIds || null;
      let prereqTemplateIds: string[] = [];
      if (rawPrereq) {
        try {
          prereqTemplateIds = Array.isArray(rawPrereq) ? rawPrereq : JSON.parse(rawPrereq);
        } catch (e) {
          prereqTemplateIds = [];
        }
      }
      if (prereqTemplateIds.length > 0) {
        const execJobId = mapping[job.id];
        await new Promise<void>((resolve, reject) => {
          const now = new Date().toISOString();
          const db = (await import('../db/schema.js')).getDatabase();
          db.run(
            'UPDATE execution_jobs SET prerequisite_job_ids = ?, updated_at = ? WHERE id = ?',
            [JSON.stringify(prereqTemplateIds), now, execJobId],
            function (err) {
              if (err) reject(err);
              else resolve();
            }
          );
        });
      }
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
    // Invalidate leader review when job is unmarked
    await JobCompletionModel.invalidateLeaderReview(executionId, jobId);
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

    // Check if all jobs have been leader reviewed
    const reviewStatus = await LeaderReviewService.checkAllJobsReviewed(executionId);
    if (!reviewStatus.allReviewed) {
      throw new ApiError(
        400, 
        'PENDING_LEADER_REVIEWS', 
        `All jobs must be reviewed by the Operator Leader before completion. ${reviewStatus.pendingCount} of ${total} jobs pending review.`
      );
    }

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
        job_name: j.job_name || j.name,
        completed: comp ? !!comp.completed : false,
        completed_by: comp ? comp.completed_by : null,
        leader_reviewed: comp ? !!comp.leader_reviewed : false,
        leader_reviewed_by: comp ? comp.leader_reviewed_by : null,
        leader_name: comp ? comp.leader_reviewed_by : null, // Will be populated with a join if needed
        leader_reviewed_at: comp ? comp.leader_reviewed_at : null,
        procedures,
      });
    }

    return {
      ...execution,
      jobs: jobsWithStatus,
    };
  }
}
