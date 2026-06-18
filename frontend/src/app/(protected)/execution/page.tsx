"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ExecutionService } from '../../../services/execution.service';
import { ExecutionJobsheet } from '../../types/execution';

export default function ExecutionListPage() {
  const [sheets, setSheets] = useState<ExecutionJobsheet[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const list = await ExecutionService.listExecutions();
      setSheets(list || []);
    } catch (e) {
      console.error('Failed to load executions', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCheckIn = async (id: string) => {
    await ExecutionService.checkIn(id);
    // After check-in, navigate to the execution detail and replace history
    window.location.replace(`/execution/${id}`);
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Execution Jobsheets</h1>
        <div>
          <Link href="/execution/create" className="btn btn-primary">Add Jobsheet</Link>
        </div>
      </div>
      {loading && <div>Loading...</div>}
      <div className="space-y-4">
        {sheets.length === 0 && !loading && <div>No execution jobsheets found.</div>}
        {sheets.map((s) => (
          <div key={s.id} className="border p-3 rounded">
            <div className="flex justify-between">
              <div>
                <div className="font-semibold">{s.name}</div>
                <div className="text-sm text-gray-600">State: {s.state}</div>
                <div className="text-sm text-gray-600">Template: {s.template_id}</div>
              </div>
              <div className="space-x-2">
                <Link href={`/execution/${s.id}`} className="btn">Open</Link>
                {s.state === 'Pending' && (
                  <button className="btn" onClick={() => handleCheckIn(s.id)}>Check In</button>
                )}
                {s.state === 'Processing' && (
                  <></>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
