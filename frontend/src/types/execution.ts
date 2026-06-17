export interface ExecutionJobsheet {
  id: string;
  template_id: string;
  user_id: string;
  name: string;
  state: 'Pending' | 'Approved' | 'Processing' | 'Completed';
  checked_in_by?: string | null;
  checked_in_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ExecutionJob {
  id: string;
  execution_id: string;
  job_id: string;
  expected_start?: string | null;
  expected_end?: string | null;
  actual_start?: string | null;
  actual_end?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface JobCompletion {
  id: string;
  execution_id: string;
  job_id: string;
  completed: number;
  completed_by?: string | null;
  completed_at?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}
