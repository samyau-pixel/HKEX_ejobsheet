"use client";

import React, { useEffect, useState } from 'react';
import { Template } from '../../types/template';
import { TemplateService } from '../../services/template.service';
import { ExecutionService } from '../../services/execution.service';
import { useRouter } from 'next/navigation';

export default function CreateExecutionForm() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateId, setTemplateId] = useState<string>('');
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

      <div>
        <button className="btn btn-primary" type="submit" disabled={!templateId}>Create Execution</button>
        {!templateId && <div className="text-sm text-red-600 mt-2">No approved templates available to clone.</div>}
      </div>
    </form>
  );
}
