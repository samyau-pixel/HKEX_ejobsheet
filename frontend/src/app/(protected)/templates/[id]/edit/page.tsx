"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreateTemplateForm } from '@/components/templates/CreateTemplateForm';
import { TemplateService } from '@/services/template.service';
import { useTemplateFormStore } from '@/store/template.store';

export default function EditTemplatePage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const setName = useTemplateFormStore((s) => s.setName);
  const setDescription = useTemplateFormStore((s) => s.setDescription);
  const addJob = useTemplateFormStore((s) => s.addJob);
  const updateJob = useTemplateFormStore((s) => s.updateJob);
  const addProcedure = useTemplateFormStore((s) => s.addProcedure);
  const reset = useTemplateFormStore((s) => s.reset);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        reset();
        const t = await TemplateService.getTemplate(id);
        setName(t.name || '');
        setDescription(t.description || '');

        for (const job of t.jobs || []) {
          addJob({ name: job.name, description: job.description || '', order: job.job_order || 1, procedures: [] });
          const jobIndex = (useTemplateFormStore.getState().jobs.length || 1) - 1;
          // set procedures
          for (const proc of job.procedures || []) {
            addProcedure(jobIndex, { name: proc.name, description: proc.description || '', order: proc.procedure_order });
          }
          // update job details to set expected times if present
          const currentJob = useTemplateFormStore.getState().jobs[jobIndex];
          updateJob(jobIndex, { ...currentJob, expected_start: job.expected_start, expected_end: job.expected_end });
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to load template');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleSubmit = async (data: any) => {
    try {
      await TemplateService.updateTemplate(id, data);
      router.push('/templates');
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to update template');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Edit Template</h1>
      {loading ? (
        <div>Loading…</div>
      ) : (
        <CreateTemplateForm onSubmit={handleSubmit} isLoading={false} error={error} />
      )}
    </div>
  );
}
