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
    timeDependency?: string;
    prerequisiteOrders?: number[];
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

    // First pass: create jobs (without prerequisites)
    const orderToJobId: Record<number, string> = {};
    for (const jobInput of sortedJobs) {
      const job = await JobModel.createJob(
        template.id,
        jobInput.name,
        jobInput.order,
        jobInput.description,
        jobInput.expectedStart,
        jobInput.expectedEnd,
        jobInput.timeDependency || undefined,
        undefined
      );
      orderToJobId[job.job_order] = job.id;

      // create procedures later (after prerequisites set)
      jobsWithProcedures.push({
        ...job,
        procedures: [],
      });
    }

    // Second pass: set prerequisites and create procedures
    for (let i = 0; i < sortedJobs.length; i++) {
      const jobInput = sortedJobs[i];
      const created = jobsWithProcedures[i];

      // Map prerequisiteOrders (if any) to job ids
      if (jobInput.prerequisiteOrders && jobInput.prerequisiteOrders.length > 0) {
        const prereqIds = jobInput.prerequisiteOrders.map((o) => orderToJobId[o]).filter(Boolean);
        if (prereqIds.length > 0) {
          await JobModel.setPrerequisites(created.id, prereqIds);
          created.prerequisiteJobIds = prereqIds;
        }
      }

      // Sort procedures by order
      const sortedProcedures = jobInput.procedures.sort((a, b) => a.order - b.order);

      const procedures: Procedure[] = [];
      for (const procInput of sortedProcedures) {
        const procedure = await ProcedureModel.createProcedure(
          created.id,
          procInput.name,
          procInput.order,
          procInput.description
        );
        procedures.push(procedure);
      }

      created.procedures = procedures;
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

  static async updateTemplate(id: string, input: CreateTemplateInput): Promise<TemplateDetail> {
    const template = await TemplateModel.getTemplate(id);
    if (!template) {
      throw new ApiError(404, 'TEMPLATE_NOT_FOUND', `Template ${id} not found`);
    }

    // Allow editing when Approved or Pending
    if (template.state !== 'Approved' && template.state !== 'Pending') {
      throw new ApiError(409, 'INVALID_STATE', 'Template cannot be edited in its current state');
    }

    const prevState = template.state;

    // Update template metadata
    // If template has executions, create a new template (version) instead of modifying in-place
    const hasExec = await TemplateModel.hasExecutions(id as string);
    if (hasExec) {
      // Create a new template owned by the same user as the original
      const newTemplate = await TemplateService.createTemplate(template.user_id, input);
      return newTemplate;
    }

    await TemplateModel.updateTemplate(id, input.name, input.description);

    // Remove existing procedures and jobs
    const existingJobs = await JobModel.getJobsByTemplate(id);
    for (const job of existingJobs) {
      await ProcedureModel.deleteProceduresByJob(job.id);
    }
    await JobModel.deleteJobsByTemplate(id);

    // Recreate jobs and procedures
    const sortedJobs = input.jobs.sort((a, b) => a.order - b.order);
    const jobsWithProcedures: Array<
      Job & {
        procedures: Procedure[];
      }
    > = [];

    // First pass: create jobs
    const orderToJobId: Record<number, string> = {};
    for (const jobInput of sortedJobs) {
      const job = await JobModel.createJob(
        id,
        jobInput.name,
        jobInput.order,
        jobInput.description,
        jobInput.expectedStart,
        jobInput.expectedEnd,
        jobInput.timeDependency || undefined,
        undefined
      );
      orderToJobId[job.job_order] = job.id;
      jobsWithProcedures.push({ ...job, procedures: [] });
    }

    // Second pass: set prerequisites and create procedures
    for (let i = 0; i < sortedJobs.length; i++) {
      const jobInput = sortedJobs[i];
      const created = jobsWithProcedures[i];

      if (jobInput.prerequisiteOrders && jobInput.prerequisiteOrders.length > 0) {
        const prereqIds = jobInput.prerequisiteOrders.map((o) => orderToJobId[o]).filter(Boolean);
        if (prereqIds.length > 0) {
          await JobModel.setPrerequisites(created.id, prereqIds);
          created.prerequisiteJobIds = prereqIds;
        }
      }

      const sortedProcedures = jobInput.procedures.sort((a, b) => a.order - b.order);
      const procedures: Procedure[] = [];
      for (const procInput of sortedProcedures) {
        const procedure = await ProcedureModel.createProcedure(
          created.id,
          procInput.name,
          procInput.order,
          procInput.description
        );
        procedures.push(procedure);
      }

      created.procedures = procedures;
    }

    // If editing an approved template, mark it as Pending for re-approval
    if (prevState === 'Approved') {
      await TemplateModel.updateState(id, 'Pending');
    }

    return {
      ...template,
      name: input.name,
      description: input.description,
      state: prevState === 'Approved' ? 'Pending' : prevState,
      jobs: jobsWithProcedures,
    };
  }

  static async rejectTemplate(id: string): Promise<void> {
    const template = await TemplateModel.getTemplate(id);
    if (!template) {
      throw new ApiError(404, 'TEMPLATE_NOT_FOUND', `Template ${id} not found`);
    }

    if (template.state !== 'Pending') {
      throw new ApiError(409, 'INVALID_STATE', 'Only pending templates can be rejected');
    }

    // Delete procedures and jobs, then template
    const existingJobs = await JobModel.getJobsByTemplate(id);
    for (const job of existingJobs) {
      await ProcedureModel.deleteProceduresByJob(job.id);
    }
    await JobModel.deleteJobsByTemplate(id);
    await TemplateModel.deleteTemplate(id);
  }

  static async deleteTemplate(id: string): Promise<void> {
    const template = await TemplateModel.getTemplate(id);
    if (!template) {
      throw new ApiError(404, 'TEMPLATE_NOT_FOUND', `Template ${id} not found`);
    }

    // Allow deletion for Approved or Pending templates
    if (template.state !== 'Pending' && template.state !== 'Approved') {
      throw new ApiError(409, 'INVALID_STATE', 'Template cannot be deleted in its current state');
    }

    const existingJobs = await JobModel.getJobsByTemplate(id);
    for (const job of existingJobs) {
      await ProcedureModel.deleteProceduresByJob(job.id);
    }
    await JobModel.deleteJobsByTemplate(id);
    await TemplateModel.deleteTemplate(id);
  }

  static async cloneTemplate(id: string, userId: string): Promise<TemplateDetail> {
    const template = await TemplateModel.getTemplate(id);
    if (!template) throw new ApiError(404, 'TEMPLATE_NOT_FOUND', `Template ${id} not found`);

    const jobs = await JobModel.getJobsByTemplate(id);

    const jobsInput = [];
    for (const j of jobs) {
      const procedures = await ProcedureModel.getProceduresByJob(j.id);
      jobsInput.push({
        name: j.name,
        description: j.description || undefined,
        order: j.job_order,
        expectedStart: j.expected_start || undefined,
        expectedEnd: j.expected_end || undefined,
        procedures: procedures.map((p) => ({ name: p.name, description: p.description || undefined, order: p.procedure_order })),
      });
    }

    const input: CreateTemplateInput = {
      name: `${template.name} (Clone)`,
      description: template.description || undefined,
      jobs: jobsInput,
    };

    const newTemplate = await TemplateService.createTemplate(userId, input);
    return newTemplate;
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

    // Cycle detection for prerequisiteOrders if provided
    const orderSet = new Set<number>(input.jobs.map((j) => j.order));
    const adj: Record<number, number[]> = {};
    for (const j of input.jobs) {
      adj[j.order] = (j.prerequisiteOrders || []).filter((o) => orderSet.has(o));
    }

    const visited: Record<number, boolean> = {};
    const recStack: Record<number, boolean> = {};

    function hasCycle(node: number): boolean {
      if (!visited[node]) {
        visited[node] = true;
        recStack[node] = true;

        for (const neigh of adj[node] || []) {
          if (!visited[neigh] && hasCycle(neigh)) return true;
          else if (recStack[neigh]) return true;
        }
      }
      recStack[node] = false;
      return false;
    }

    for (const n of Object.keys(adj).map((k) => parseInt(k, 10))) {
      if (hasCycle(n)) {
        throw new ApiError(422, 'VALIDATION_ERROR', 'Circular job dependency detected');
      }
    }
  }
}
