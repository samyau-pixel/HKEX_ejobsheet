import { Template, Job, Procedure } from '../types/index.js';
import { TemplateModel } from '../models/template.model.js';
import { JobModel } from '../models/job.model.js';
import { ProcedureModel } from '../models/procedure.model.js';
import { ApiError } from '../middleware/error.middleware.js';

export interface CreateTemplateInput {
  name: string;
  description?: string;
  jobs: Array<{
    name: string;
    description?: string;
    order: number;
    expectedStart?: string;
    expectedEnd?: string;
    procedures: Array<{
      name: string;
      description?: string;
      order: number;
    }>;
  }>;
}

export interface TemplateDetail extends Template {
  jobs: Array<
    Job & {
      procedures: Procedure[];
    }
  >;
}

export class TemplateService {
  static async createTemplate(
    userId: string,
    input: CreateTemplateInput
  ): Promise<TemplateDetail> {
    // Create template
    const template = await TemplateModel.createTemplate(userId, input.name, input.description);

    // Sort jobs by order
    const sortedJobs = input.jobs.sort((a, b) => a.order - b.order);

    const jobsWithProcedures: Array<
      Job & {
        procedures: Procedure[];
      }
    > = [];

    // Create jobs and procedures
    for (const jobInput of sortedJobs) {
      const job = await JobModel.createJob(
        template.id,
        jobInput.name,
        jobInput.order,
        jobInput.description,
        jobInput.expectedStart,
        jobInput.expectedEnd
      );

      // Sort procedures by order
      const sortedProcedures = jobInput.procedures.sort((a, b) => a.order - b.order);

      const procedures: Procedure[] = [];

      for (const procInput of sortedProcedures) {
        const procedure = await ProcedureModel.createProcedure(
          job.id,
          procInput.name,
          procInput.order,
          procInput.description
        );
        procedures.push(procedure);
      }

      jobsWithProcedures.push({
        ...job,
        procedures,
      });
    }

    return {
      ...template,
      jobs: jobsWithProcedures,
    };
  }

  static async getTemplate(id: string): Promise<TemplateDetail> {
    const template = await TemplateModel.getTemplate(id);
    if (!template) {
      throw new ApiError(404, 'TEMPLATE_NOT_FOUND', `Template ${id} not found`);
    }

    const jobs = await JobModel.getJobsByTemplate(id);

    const jobsWithProcedures: Array<
      Job & {
        procedures: Procedure[];
      }
    > = [];

    for (const job of jobs) {
      const procedures = await ProcedureModel.getProceduresByJob(job.id);
      jobsWithProcedures.push({
        ...job,
        procedures,
      });
    }

    return {
      ...template,
      jobs: jobsWithProcedures,
    };
  }

  static async listTemplates(
    userId?: string,
    state?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Template[]> {
    return TemplateModel.listTemplates(userId, state, limit, offset);
  }

  static async approveTemplate(id: string): Promise<void> {
    const template = await TemplateModel.getTemplate(id);
    if (!template) {
      throw new ApiError(404, 'TEMPLATE_NOT_FOUND', `Template ${id} not found`);
    }

    if (template.state === 'Approved') {
      throw new ApiError(400, 'ALREADY_APPROVED', 'Template is already approved');
    }

    await TemplateModel.updateState(id, 'Approved');
  }

  static async validateTemplate(input: CreateTemplateInput): Promise<void> {
    if (!input.name || input.name.trim().length === 0) {
      throw new ApiError(422, 'VALIDATION_ERROR', 'Template name is required');
    }

    if (!input.jobs || input.jobs.length === 0) {
      throw new ApiError(422, 'VALIDATION_ERROR', 'At least one job is required');
    }

    for (const job of input.jobs) {
      if (!job.name || job.name.trim().length === 0) {
        throw new ApiError(422, 'VALIDATION_ERROR', 'Job name is required');
      }

      if (!job.procedures || job.procedures.length === 0) {
        throw new ApiError(
          422,
          'VALIDATION_ERROR',
          `Job "${job.name}" must have at least one procedure`
        );
      }

      for (const proc of job.procedures) {
        if (!proc.name || proc.name.trim().length === 0) {
          throw new ApiError(422, 'VALIDATION_ERROR', 'Procedure name is required');
        }
      }
    }
  }
}
