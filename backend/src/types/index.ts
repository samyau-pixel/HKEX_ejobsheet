export interface User {
  id: string;
  email: string;
  name: string;
  role: 'Manager' | 'OperatorLeader' | 'Operator';
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface ExecutionJobsheet {
  id: string;
  template_id: string;
  user_id: string;
  name: string;
  state: 'Pending' | 'Approved' | 'Processing' | 'Completed';
  checked_in_by?: string;
  checked_in_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ExecutionJob {
  id: string;
  execution_id: string;
  job_id: string;
  expected_start?: string;
  expected_end?: string;
  timeDependency?: string;
  prerequisiteJobIds?: string[];
  actual_start?: string;
  actual_end?: string;
  created_at: string;
  updated_at: string;
}

export interface JobCompletion {
  id: string;
  execution_id: string;
  job_id: string;
  completed: boolean;
  completed_by?: string;
  completed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}
export interface Template {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  state: 'Pending' | 'Approved';
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: string;
  template_id: string;
  name: string;
  description?: string;
  job_order: number;
  expected_start?: string;
  expected_end?: string;
  timeDependency?: string;
  prerequisiteJobIds?: string[];
  created_at: string;
  updated_at: string;
}

export interface Procedure {
  id: string;
  job_id: string;
  name: string;
  description?: string;
  procedure_order: number;
  created_at: string;
  updated_at: string;
}

export interface ExecutionJobsheet {
  id: string;
  template_id: string;
  user_id: string;
  name: string;
  state: 'Pending' | 'Approved' | 'Processing' | 'Completed';
  checked_in_by?: string;
  checked_in_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ExecutionJob {
  id: string;
  execution_id: string;
  job_id: string;
  expected_start?: string;
  expected_end?: string;
  timeDependency?: string;
  prerequisiteJobIds?: string[];
  actual_start?: string;
  actual_end?: string;
  created_at: string;
  updated_at: string;
}

export interface JobCompletion {
  id: string;
  execution_id: string;
  job_id: string;
  completed: boolean;
  completed_by?: string;
  completed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthPayload {
  userId: string;
  email: string;
  name: string;
  role: User['role'];
  iat: number;
  exp: number;
}

export interface ApiResponse<T> {
  status: number;
  data?: T;
  message: string;
  requestId: string;
}

export interface ApiError {
  status: number;
  code: string;
  message: string;
  requestId: string;
  details?: Record<string, unknown>;
}
