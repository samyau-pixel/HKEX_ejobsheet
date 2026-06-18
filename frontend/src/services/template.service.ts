import { apiClient } from './api.client';
import { CreateTemplateInput, Template } from '@/types/template';

export class TemplateService {
  static async createTemplate(input: CreateTemplateInput): Promise<Template> {
    const response = await apiClient.post('/templates', input);
    return response.data.data;
  }

  static async getTemplates(
    state?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Template[]> {
    const response = await apiClient.get('/templates', {
      params: { state, limit, offset },
    });
    return response.data.data;
  }

  static async getTemplate(id: string): Promise<Template> {
    const response = await apiClient.get(`/templates/${id}`);
    return response.data.data;
  }

  static async approveTemplate(id: string): Promise<Template> {
    const response = await apiClient.post(`/templates/${id}/approve`);
    return response.data.data;
  }

  static async rejectTemplate(id: string): Promise<void> {
    const response = await apiClient.post(`/templates/${id}/reject`);
    return response.data.data;
  }

  static async updateTemplate(id: string, input: CreateTemplateInput): Promise<Template> {
    const response = await apiClient.put(`/templates/${id}`, input);
    return response.data.data;
  }

  static async cloneTemplate(id: string): Promise<Template> {
    const response = await apiClient.post(`/templates/${id}/clone`);
    return response.data.data;
  }

  static async deleteTemplate(id: string): Promise<void> {
    const response = await apiClient.delete(`/templates/${id}`);
    return response.data.data;
  }
}
