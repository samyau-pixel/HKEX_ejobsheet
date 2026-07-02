export interface Procedure {
  id?: string;
  name: string;
  description?: string;
  order: number;
}

export interface Job {
  id?: string;
  name: string;
  description?: string;
  order: number;
  expectedStart?: string;
  expectedEnd?: string;
  timeDependency?: string;
  prerequisiteOrders?: number[];
  procedures: Procedure[];
}

export interface Template {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  state: 'Pending' | 'Approved';
  created_at: string;
  updated_at: string;
  jobs?: Job[];
}

export interface CreateTemplateInput {
  name: string;
  description?: string;
  jobs: Job[];
}
