import { create } from 'zustand';
import { Template, Job, Procedure, CreateTemplateInput } from '@/types/template';

interface TemplateFormState {
  name: string;
  description: string;
  jobs: Job[];
  setName: (name: string) => void;
  setDescription: (description: string) => void;
  addJob: (job: Job) => void;
  updateJob: (index: number, job: Job) => void;
  removeJob: (index: number) => void;
  addProcedure: (jobIndex: number, procedure: Procedure) => void;
  updateProcedure: (jobIndex: number, procIndex: number, procedure: Procedure) => void;
  removeProcedure: (jobIndex: number, procIndex: number) => void;
  reset: () => void;
  getFormData: () => CreateTemplateInput;
}

export const useTemplateFormStore = create<TemplateFormState>((set, get) => ({
  name: '',
  description: '',
  jobs: [],
  setName: (name: string) => set({ name }),
  setDescription: (description: string) => set({ description }),
  addJob: (job: Job) =>
    set((state) => ({
      jobs: [
        ...state.jobs,
        {
          ...job,
          order: state.jobs.length + 1,
          procedures: [],
        },
      ],
    })),
  updateJob: (index: number, job: Job) =>
    set((state) => {
      const newJobs = [...state.jobs];
      newJobs[index] = job;
      return { jobs: newJobs };
    }),
  removeJob: (index: number) =>
    set((state) => ({
      jobs: state.jobs.filter((_, i) => i !== index),
    })),
  addProcedure: (jobIndex: number, procedure: Procedure) =>
    set((state) => {
      const newJobs = [...state.jobs];
      if (newJobs[jobIndex]) {
        newJobs[jobIndex].procedures = [
          ...(newJobs[jobIndex].procedures || []),
          {
            ...procedure,
            order: (newJobs[jobIndex].procedures?.length || 0) + 1,
          },
        ];
      }
      return { jobs: newJobs };
    }),
  updateProcedure: (jobIndex: number, procIndex: number, procedure: Procedure) =>
    set((state) => {
      const newJobs = [...state.jobs];
      if (newJobs[jobIndex]?.procedures) {
        newJobs[jobIndex].procedures[procIndex] = procedure;
      }
      return { jobs: newJobs };
    }),
  removeProcedure: (jobIndex: number, procIndex: number) =>
    set((state) => {
      const newJobs = [...state.jobs];
      if (newJobs[jobIndex]?.procedures) {
        newJobs[jobIndex].procedures = newJobs[jobIndex].procedures.filter((_, i) => i !== procIndex);
      }
      return { jobs: newJobs };
    }),
  reset: () => set({ name: '', description: '', jobs: [] }),
  getFormData: () => {
    const state = get();
    return {
      name: state.name,
      description: state.description,
      jobs: state.jobs,
    };
  },
}));

interface TemplateListStore {
  templates: Template[];
  loading: boolean;
  setTemplates: (templates: Template[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useTemplateListStore = create<TemplateListStore>((set) => ({
  templates: [],
  loading: false,
  setTemplates: (templates: Template[]) => set({ templates }),
  setLoading: (loading: boolean) => set({ loading }),
}));
