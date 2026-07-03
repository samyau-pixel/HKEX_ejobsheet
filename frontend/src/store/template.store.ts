import { create } from 'zustand';
import { Template, Job, Procedure, CreateTemplateInput } from '@/types/template';

interface TemplateFormState {
  name: string;
  description: string;
  jobs: Job[];
  setJobs: (jobs: Job[]) => void;
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
          procedures: job.procedures || [],
          timeDependency: job.timeDependency || undefined,
          prerequisiteOrders: job.prerequisiteOrders || [],
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
      jobs: (() => {
        const removed = state.jobs[index];
        const removedOrder = removed?.order;
        const newJobs = state.jobs.filter((_, i) => i !== index).map((j, idx) => ({
          ...j,
          order: idx + 1,
          prerequisiteOrders: (j.prerequisiteOrders || [])
            .map((o) => (removedOrder && o > removedOrder ? o - 1 : o))
            .filter((o) => o !== idx + 1),
        }));
        return newJobs;
      })(),
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
  setJobs: (jobs: Job[]) => set({ jobs }),
  reset: () => set({ name: '', description: '', jobs: [] }),
  getFormData: () => {
    const state = get();
    return {
      name: state.name,
      description: state.description,
      jobs: state.jobs.map((j) => ({
        name: j.name,
        description: j.description,
        order: j.order,
        expectedStart: j.expectedStart,
        expectedEnd: j.expectedEnd,
        timeDependency: j.timeDependency,
        prerequisiteOrders: j.prerequisiteOrders || [],
        procedures: j.procedures || [],
      })),
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
