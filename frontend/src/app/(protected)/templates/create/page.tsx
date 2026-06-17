'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CreateTemplateForm } from '@/components/templates/CreateTemplateForm';
import { TemplateService } from '@/services/template.service';

export default function CreateTemplatePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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
      <div className="mb-6">
        <Link href="/templates" className="text-blue-600 hover:underline">
          ← Back to Templates
        </Link>
        <h1 className="text-3xl font-bold mt-4">Create New Template</h1>
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
