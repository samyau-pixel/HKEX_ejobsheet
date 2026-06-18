"use client";

import React, { useEffect, useState } from 'react';
import { Template } from '../../types/template';
import { TemplateService } from '../../services/template.service';
import { ExecutionService } from '../../services/execution.service';
import { useRouter } from 'next/navigation';

export default function CreateExecutionForm() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateId, setTemplateId] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [name, setName] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const list = await TemplateService.getTemplates('Approved');
      setTemplates(list);
      if (list.length > 0) setTemplateId(list[0].id);
      else setTemplateId('');
    })();
  }, []);

  useEffect(() => {
    if (!templateId) {
      setSelectedTemplate(null);
      return;
    }

    let mounted = true;
    (async () => {
      try {
        const tpl = await TemplateService.getTemplate(templateId);
        if (mounted) setSelectedTemplate(tpl);
      } catch (err) {
        console.error('Failed to load template preview', err);
        if (mounted) setSelectedTemplate(null);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [templateId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateId) return alert('No approved template selected');
    await ExecutionService.createExecution(templateId, name || undefined);
    router.push('/execution');
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Template</label>
        <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} className="mt-1 block w-full">
          {templates.map((t) => (
            <option value={t.id} key={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium">Execution Name (optional)</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full" />
      </div>

      {/* Template preview */}
      {selectedTemplate && (
        <div className="border p-4 rounded bg-white">
          <h3 className="text-lg font-semibold">Preview: {selectedTemplate.name}</h3>
          {selectedTemplate.description && <p className="text-sm text-gray-600">{selectedTemplate.description}</p>}

          <div className="mt-3 space-y-3">
            {(selectedTemplate.jobs || []).sort((a, b) => a.order - b.order).map((job) => (
              <div key={job.id || job.order} className="p-3 border rounded">
                <div className="font-medium">{job.order}. {job.name}</div>
                {job.description && <div className="text-sm text-gray-600">{job.description}</div>}
                <ul className="list-decimal list-inside mt-2">
                  {(job.procedures || []).sort((a, b) => a.order - b.order).map((proc) => (
                    <li key={proc.id || proc.order} className="text-sm">{proc.name}{proc.description ? ` — ${proc.description}` : ''}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <button className="btn btn-primary" type="submit" disabled={!templateId}>Create Execution</button>
        {!templateId && <div className="text-sm text-red-600 mt-2">No approved templates available to clone.</div>}
      </div>
    </form>
  );
}
