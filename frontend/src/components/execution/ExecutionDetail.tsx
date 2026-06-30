"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ExecutionService } from '../../services/execution.service';
import CheckInModal from './CheckInModal';
import CompleteSheetButton from './CompleteSheetButton';
import LeaderReviewModal from './LeaderReviewModal';
import LeaderReviewSummary from './LeaderReviewSummary';

export default function ExecutionDetail({ id }: { id: string }) {
  const [detail, setDetail] = useState<any>(null);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [leaderReviewModal, setLeaderReviewModal] = useState<{
    open: boolean;
    jobId: string | null;
    jobName: string | null;
  }>({ open: false, jobId: null, jobName: null });
  const [showLeaderSummary, setShowLeaderSummary] = useState(false);
  const [leaderReviewSummary, setLeaderReviewSummary] = useState<any>(null);

  const load = async () => {
    const d = await ExecutionService.getExecution(id);
    setDetail(d);
    
    // Load leader review summary
    try {
      const summary = await ExecutionService.getLeaderReviewSummary(id);
      setLeaderReviewSummary(summary);
    } catch (err) {
      console.error('Failed to load leader review summary:', err);
    }
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

  const handleLeaderReviewClick = async (jobId: string, jobName: string) => {
    // Check if already reviewed
    try {
      const status = await ExecutionService.getLeaderReviewStatus(id, jobId);
      if (status.leader_reviewed) {
        alert('This job has already been reviewed by the leader.');
        return;
      }
    } catch (err) {
      console.error('Failed to get leader review status:', err);
    }
    
    setLeaderReviewModal({ open: true, jobId, jobName });
  };

  const handleLeaderReviewSuccess = async () => {
    await load();
  };

  return (
    <div>
      {!detail && <div>Loading...</div>}
      {detail && (
        <div>
          <h2 className="text-xl font-bold">{detail.name}</h2>
          <div className="text-sm text-gray-600">State: {detail.state}</div>
          
          {/* Leader Review Summary */}
          {detail.state === 'Processing' && leaderReviewSummary && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex justify-between items-center">
                <div className="text-sm">
                  <span className="font-medium">Leader Reviews:</span> {leaderReviewSummary.reviewedCount} of {leaderReviewSummary.reviewedCount + leaderReviewSummary.pendingCount} completed
                  {!leaderReviewSummary.allReviewed && (
                    <span className="ml-2 text-amber-600">({leaderReviewSummary.pendingCount} pending)</span>
                  )}
                </div>
                <button 
                  className="btn btn-sm"
                  onClick={() => setShowLeaderSummary(true)}
                >
                  View Summary
                </button>
              </div>
            </div>
          )}

          <div className="mt-4 mb-4">
            {detail.state === 'Pending' && ( 
              <div className="space-x-2"> 
                <button className="btn" onClick={() => setShowCheckIn(true)}>Check In</button> 
              </div> 
            )} 
            {detail.state === 'Processing' && ( 
              <div className="space-x-2"> 
                {/** Only enable complete when all jobs are marked completed and leader reviewed */} 
                <CompleteSheetButton id={id} onDone={load} disabled={!(detail.jobs && detail.jobs.length > 0 && detail.jobs.every((j: any) => !!j.completed))} /> 
                <button className="btn" onClick={() => router.back()}>Check Out</button> 
              </div> 
            )} 
            {detail.state === 'Completed' && ( 
              <div className="text-sm text-green-600">This sheet is completed.</div> 
            )} 
          </div>

          <div className="mt-4 space-y-3">
            {detail.jobs.map((j: any) => {
              const isLeaderReviewed = j.leader_reviewed === true;
              const leaderName = j.leader_name || j.leader_reviewed_by;
              const leaderReviewTime = j.leader_reviewed_at;
              
              return (
                <div key={j.id} className="border p-3 rounded">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{j.job_name}</div>
                      <div className="text-sm text-gray-600">Expected: {j.expected_start} → {j.expected_end}</div>
                      {isLeaderReviewed && (
                        <div className="text-sm text-green-600 mt-1">
                          ✓ Approved by {leaderName} at {new Date(leaderReviewTime).toLocaleString()}
                        </div>
                      )}
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
                      {j.completed && !isLeaderReviewed && detail.state === 'Processing' && (
                        <button 
                          className="btn btn-sm bg-amber-500 hover:bg-amber-600 text-white" 
                          onClick={() => handleLeaderReviewClick(j.job_id, j.job_name)}
                          title="Click to request leader review"
                        >
                          Leader Review
                        </button>
                      )}
                      {isLeaderReviewed && (
                        <span className="text-sm text-green-600 font-medium">✓ Reviewed</span>
                      )}
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
              );
            })}
          </div>

          {showCheckIn && (
            <div className="mt-4">
              <CheckInModal id={id} onClose={() => setShowCheckIn(false)} onDone={load} />
            </div>
          )}

          {leaderReviewModal.open && leaderReviewModal.jobId && leaderReviewModal.jobName && (
            <div className="mt-4">
              <LeaderReviewModal
                executionId={id}
                jobId={leaderReviewModal.jobId}
                jobName={leaderReviewModal.jobName}
                onClose={() => setLeaderReviewModal({ open: false, jobId: null, jobName: null })}
                onSuccess={handleLeaderReviewSuccess}
              />
            </div>
          )}

          {showLeaderSummary && leaderReviewSummary && (
            <div className="mt-4">
              <LeaderReviewSummary
                summary={leaderReviewSummary}
                onClose={() => setShowLeaderSummary(false)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
