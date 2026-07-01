import { apiClient } from './api.client';
import { ExecutionJobsheet } from '../types/execution';

export interface LeaderReviewStatus {
  leader_reviewed: boolean;
  leader_reviewed_by: string | null;
  leader_reviewed_at: string | null;
}

export interface LeaderReviewSummary {
  allReviewed: boolean;
  pendingCount: number;
  reviewedCount: number;
  reviews: any[];
}

export const ExecutionService = {
  async createExecution(templateId: string, name?: string): Promise<ExecutionJobsheet> {
    const resp = await apiClient.post('/execution-sheets', { templateId, name });
    return resp.data.data as ExecutionJobsheet;
  },

  async listExecutions(): Promise<ExecutionJobsheet[]> {
    const resp = await apiClient.get('/execution-sheets');
    return resp.data.data || [];
  },
  async getExecution(executionId: string): Promise<any> {
    const resp = await apiClient.get(`/execution-sheets/${executionId}`);
    return resp.data.data;
  },
  async checkIn(executionId: string): Promise<ExecutionJobsheet> {
    const resp = await apiClient.post(`/execution-sheets/${executionId}/check-in`);
    return resp.data.data as ExecutionJobsheet;
  },
  async markJobComplete(executionId: string, jobId: string): Promise<any> {
    const resp = await apiClient.post(`/execution-sheets/${executionId}/jobs/${jobId}/complete`);
    return resp.data.data;
  },
  async unmarkJobComplete(executionId: string, jobId: string): Promise<any> {
    const resp = await apiClient.post(`/execution-sheets/${executionId}/jobs/${jobId}/uncomplete`);
    return resp.data.data;
  },
  async completeExecution(executionId: string): Promise<ExecutionJobsheet> {
    const resp = await apiClient.post(`/execution-sheets/${executionId}/complete`);
    return resp.data.data as ExecutionJobsheet;
  },

  // Leader Review Methods
  async submitLeaderReview(executionId: string, jobId: string, userId: string, password: string): Promise<any> {
    try {
      const resp = await apiClient.post(`/execution-sheets/${executionId}/jobs/${jobId}/leader-review`, { userId, password }, { skipAuthRedirect: true });
      return resp.data.data;
    } catch (err: any) {
      // Handle invalid leader credentials specifically without triggering global logout
      if (err.response?.status === 401 && err.response?.data?.error === 'AUTH_FAILED') {
        return { success: false, message: err.response?.data?.message || 'Invalid credentials', error: 'AUTH_FAILED' };
      }
      throw err;
    }
  },

  async getLeaderReviewStatus(executionId: string, jobId: string): Promise<LeaderReviewStatus> {
    const resp = await apiClient.get(`/execution-sheets/${executionId}/jobs/${jobId}/leader-review`);
    return resp.data.data as LeaderReviewStatus;
  },

  async getLeaderReviewSummary(executionId: string): Promise<LeaderReviewSummary> {
    const resp = await apiClient.get(`/execution-sheets/${executionId}/leader-review-summary`);
    return resp.data.data as LeaderReviewSummary;
  },
};
