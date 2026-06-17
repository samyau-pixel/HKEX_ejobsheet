'use client';

import React, { useState } from 'react';
import { useTemplateFormStore } from '@/store/template.store';
import { Job, Procedure } from '@/types/template';

export const CreateTemplateForm: React.FC<{
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
  error?: string;
}> = ({ onSubmit, isLoading = false, error = '' }) => {
  const store = useTemplateFormStore();
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!store.name.trim()) {
      setFormError('Template name is required');
      return;
    }

    if (store.jobs.length === 0) {
      setFormError('At least one job is required');
      return;
    }

    for (const job of store.jobs) {
      if (!job.procedures || job.procedures.length === 0) {
        setFormError(`Job "${job.name}" must have at least one procedure`);
        return;
      }
    }

    try {
      await onSubmit(store.getFormData());
      store.reset();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create template');
    }
  };

  const addJob = () => {
    const newJob: Job = {
      name: '',
      description: '',
      order: store.jobs.length + 1,
      procedures: [],
    };
    store.addJob(newJob);
  };

  const addProcedure = (jobIndex: number) => {
    const newProcedure: Procedure = {
      name: '',
      description: '',
      order: (store.jobs[jobIndex]?.procedures?.length || 0) + 1,
    };
    store.addProcedure(jobIndex, newProcedure);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {(formError || error) && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {formError || error}
        </div>
      )}

      {/* Template name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          Template Name *
        </label>
        <input
          id="name"
          type="text"
          value={store.name}
          onChange={(e) => store.setName(e.target.value)}
          placeholder="e.g., Daily Maintenance"
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* Template description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">
          Description
        </label>
        <textarea
          id="description"
          value={store.description}
          onChange={(e) => store.setDescription(e.target.value)}
          placeholder="Optional: Describe what this template is used for"
          rows={3}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Jobs section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Jobs</h3>
        {store.jobs.map((job, jobIndex) => (
          <div
            key={jobIndex}
            className="border rounded-lg p-4 space-y-3 bg-gray-50"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={job.name}
                  onChange={(e) =>
                    store.updateJob(jobIndex, {
                      ...job,
                      name: e.target.value,
                    })
                  }
                  placeholder="Job name"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <button
                type="button"
                onClick={() => store.removeJob(jobIndex)}
                className="ml-2 px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
              >
                Remove
              </button>
            </div>

            {/* Procedures */}
            <div className="ml-2 space-y-2">
              <label className="block text-sm font-medium">Procedures:</label>
              {job.procedures?.map((proc, procIndex) => (
                <div key={procIndex} className="flex gap-2 items-center bg-white p-2 rounded">
                  <input
                    type="text"
                    value={proc.name}
                    onChange={(e) =>
                      store.updateProcedure(jobIndex, procIndex, {
                        ...proc,
                        name: e.target.value,
                      })
                    }
                    placeholder="Procedure name"
                    className="flex-1 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => store.removeProcedure(jobIndex, procIndex)}
                    className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addProcedure(jobIndex)}
                className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
              >
                + Add Procedure
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addJob}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          + Add Job
        </button>
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
      >
        {isLoading ? 'Creating...' : 'Create Template'}
      </button>
    </form>
  );
};
