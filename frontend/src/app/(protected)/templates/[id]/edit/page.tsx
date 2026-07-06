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

        // Build jobs with procedures and dependencies, set them atomically
        const toDateTimeLocal = (val: any) => {
          if (!val) return undefined;
          const d = new Date(val);
          if (isNaN(d.getTime())) return undefined;
          const pad = (n: number) => n.toString().padStart(2, '0');
          return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        };

        const jobsForStore = (t.jobs || []).map((job: any, idx: number) => ({
          name: job.name,
          description: job.description || '',
          order: job.job_order || idx + 1,
          expected_start: job.expected_start,
          expected_end: job.expected_end,
          timeDependency: toDateTimeLocal(job.time_dependency || job.timeDependency),
          prerequisiteOrders: (() => {
            const raw = (job.prerequisite_job_ids || job.prerequisiteJobIds || null);
            let ids: string[] = [];
            if (!raw) ids = [];
            else if (Array.isArray(raw)) ids = raw;
            else if (typeof raw === 'string') {
              try { ids = JSON.parse(raw); } catch (e) { ids = []; }
            }
            return ids
              .map((pid: string) => {
                const prereqJob = t.jobs?.find((j: any) => j.id === pid);
                return prereqJob ? prereqJob.job_order : 0;
              })
              .filter((o: number) => o > 0);
          })(),
          procedures: (job.procedures || []).map((p: any, pIdx: number) => ({
            name: p.name,
            description: p.description || '',
            order: p.procedure_order || pIdx + 1,
          })),
        }));

        // Use setJobs to update the store in one operation
        useTemplateFormStore.getState().setJobs(jobsForStore as any);
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
      setLoading(true);
      await TemplateService.updateTemplate(id, data);
      router.push('/templates');
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to update template');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push('/templates')}
          className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold">Edit Template</h1>
      </div>
      {loading ? (
        <div>Loading…</div>
      ) : (
        <CreateTemplateForm onSubmit={handleSubmit} isLoading={loading} error={error} submitLabel="Update Template" submittingLabel="Updating..." />
      )}
    </div>
  );
}
