"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { TemplateService } from '@/services/template.service';
import { Template } from '@/types/template';
import { useAuth } from '@/services/auth.service';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const t = await TemplateService.getTemplates();
        setTemplates(t || []);
      } catch (err) {
        console.error('Failed to load templates', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const { user } = useAuth();

  const handleApprove = async (id: string) => {
    try {
      await TemplateService.approveTemplate(id);
      // Refresh list
      setLoading(true);
      const t = await TemplateService.getTemplates();
      setTemplates(t || []);
    } catch (err) {
      console.error('Approve failed', err);
      alert('Failed to approve template');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm('Reject and remove this template? This cannot be undone.')) return;
    try {
      await TemplateService.rejectTemplate(id);
      setLoading(true);
      const t = await TemplateService.getTemplates();
      setTemplates(t || []);
    } catch (err) {
      console.error('Reject failed', err);
      alert('Failed to reject template');
    } finally {
      setLoading(false);
    }
  };

  const pending = templates.filter((t) => t.state === 'Pending');
  const approved = templates.filter((t) => t.state === 'Approved');

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Templates</h1>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => (window.location.href = '/home')} className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">← Back</button>
          <Link
            href="/templates/create"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Create New Template
          </Link>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Pending Templates</h2>
          {loading ? (
            <p className="text-gray-600">Loading…</p>
          ) : pending.length === 0 ? (
            <p className="text-gray-600">No pending templates</p>
          ) : (
            <ul className="space-y-3">
              {pending.map((t) => (
                <li key={t.id} className="border p-3 rounded">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold">{t.name}</div>
                      <div className="text-sm text-gray-600">{t.description}</div>
                    </div>
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-gray-500">{new Date(t.created_at).toLocaleString()}</div>
                          <div className="ml-4">
                            <Link href={`/templates/${t.id}/edit`} className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600">Edit</Link>
                          </div>
                        {user?.role === 'Manager' && (
                          <button
                            onClick={() => handleApprove(t.id)}
                            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                          >
                            Approve
                          </button>
                        )}
                          {user?.role === 'Manager' && (
                            <button
                              onClick={() => handleReject(t.id)}
                              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                            >
                              Reject
                            </button>
                          )}
                      </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Approved Templates</h2>
          {loading ? (
            <p className="text-gray-600">Loading…</p>
          ) : approved.length === 0 ? (
            <p className="text-gray-600">No approved templates</p>
          ) : (
            <ul className="space-y-3">
              {approved.map((t) => (
                <li key={t.id} className="border p-3 rounded">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold">{t.name}</div>
                      <div className="text-sm text-gray-600">{t.description}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-gray-500">{new Date(t.created_at).toLocaleString()}</div>
                      {user?.role === 'Manager' && (
                        <div className="ml-4 flex items-center gap-2">
                          <Link href={`/templates/${t.id}/edit`} className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600">Edit</Link>
                          <button
                            onClick={async () => {
                              if (!confirm('Clone this template for editing? A new Pending copy will be created.')) return;
                              try {
                                const cloned = await TemplateService.cloneTemplate(t.id);
                                window.location.href = `/templates/${cloned.id}/edit`;
                              } catch (err) {
                                console.error('Clone failed', err);
                                alert('Failed to clone template');
                              }
                            }}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                          >
                            Clone & Edit
                          </button>
                          <button
                            onClick={async () => {
                              if (!confirm('Delete this template? This cannot be undone.')) return;
                              try {
                                await TemplateService.deleteTemplate(t.id);
                                setLoading(true);
                                const tlist = await TemplateService.getTemplates();
                                setTemplates(tlist || []);
                              } catch (err) {
                                console.error('Delete failed', err);
                                alert('Failed to delete template');
                              } finally {
                                setLoading(false);
                              }
                            }}
                            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
