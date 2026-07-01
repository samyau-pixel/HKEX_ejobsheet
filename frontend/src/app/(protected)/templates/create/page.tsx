'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CreateTemplateForm } from '@/components/templates/CreateTemplateForm';
import { TemplateService } from '@/services/template.service';
import { useTemplateFormStore } from '@/store/template.store';

export default function CreateTemplatePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const reset = useTemplateFormStore((s) => s.reset);

  useEffect(() => {
    // Ensure form store is cleared when opening the create page
    reset();
  }, []);

  const handleSubmit = async (data: any) => {
    try {
      setIsLoading(true);
      setError('');
      await TemplateService.createTemplate(data);
      router.push('/templates');
      router.refresh();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create template');
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button
            type="button"
            onClick={() => router.push('/templates')}
            className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            ← Back
          </button>
        </div>
        <h1 className="text-3xl font-bold">Create New Template</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <CreateTemplateForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
          error={error}
        />
      </div>
    </div>
  );
}
