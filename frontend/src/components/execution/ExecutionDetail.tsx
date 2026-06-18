"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ExecutionService } from '../../services/execution.service';
import CheckInModal from './CheckInModal';
import CompleteSheetButton from './CompleteSheetButton';

export default function ExecutionDetail({ id }: { id: string }) {
  const [detail, setDetail] = useState<any>(null);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const load = async () => {
    const d = await ExecutionService.getExecution(id);
    setDetail(d);
  };

  useEffect(() => { load(); }, [id]);
  const router = useRouter();

  const toggleComplete = async (jobId: string, completed: boolean) => {
    if (completed) {
      await ExecutionService.unmarkJobComplete(id, jobId);
    } else {
      await ExecutionService.markJobComplete(id, jobId);
    }
    await load();
  };

  return (
    <div>
      {!detail && <div>Loading...</div>}
      {detail && (
        <div>
          <h2 className="text-xl font-bold">{detail.name}</h2>
          <div className="text-sm text-gray-600">State: {detail.state}</div>
          <div className="mt-4 mb-4">
            {detail.state === 'Pending' && ( 
              <div className="space-x-2"> 
                <button className="btn" onClick={() => setShowCheckIn(true)}>Check In</button> 
              </div> 
            )} 
            {detail.state === 'Processing' && ( 
              <div className="space-x-2"> 
                {/** Only enable complete when all jobs are marked completed */} 
                <CompleteSheetButton id={id} onDone={load} disabled={!(detail.jobs && detail.jobs.length > 0 && detail.jobs.every((j: any) => !!j.completed))} /> 
                <button className="btn" onClick={() => router.back()}>Check Out</button> 
              </div> 
            )} 
            {detail.state === 'Completed' && ( 
              <div className="text-sm text-green-600">This sheet is completed.</div> 
            )} 
          </div>

          <div className="mt-4 space-y-3">
            {detail.jobs.map((j: any) => (
              <div key={j.id} className="border p-3 rounded">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{j.job_name}</div>
                    <div className="text-sm text-gray-600">Expected: {j.expected_start} → {j.expected_end}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={!!j.completed}
                        disabled={detail.state !== 'Processing'}
                        onChange={() => toggleComplete(j.job_id, !!j.completed)}
                      />
                      <span className="text-sm">Completed</span>
                    </label>
                    <button className="btn btn-sm" onClick={() => setExpanded((s) => ({ ...s, [j.job_id]: !s[j.job_id] }))}>
                      {expanded[j.job_id] ? 'Hide Procedures' : 'Show Procedures'}
                    </button>
                  </div>
                </div>
                {expanded[j.job_id] && (
                  <div className="mt-3 ml-4 space-y-2">
                    {j.procedures && j.procedures.length > 0 ? (
                      j.procedures.map((p: any) => (
                        <div key={p.id} className="p-2 border rounded bg-gray-50">
                          <div className="font-medium">{p.name}</div>
                          {p.description && <div className="text-sm text-gray-600">{p.description}</div>}
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-600">No procedures defined.</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {showCheckIn && (
            <div className="mt-4">
              <CheckInModal id={id} onClose={() => setShowCheckIn(false)} onDone={load} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
