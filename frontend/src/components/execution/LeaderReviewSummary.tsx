"use client";

import React from 'react';

interface LeaderReviewSummaryProps {
  summary: {
    allReviewed: boolean;
    pendingCount: number;
    reviewedCount: number;
    reviews: any[];
  };
  onClose: () => void;
}

export default function LeaderReviewSummary({ summary, onClose }: LeaderReviewSummaryProps) {
  if (!summary) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="summary-title"
    >
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <h2 id="summary-title" className="text-xl font-semibold mb-4">Leader Review Summary</h2>
        
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="text-sm">
            <span className="font-medium">Progress:</span> {summary.reviewedCount} of {summary.reviewedCount + summary.pendingCount} jobs reviewed
            {summary.allReviewed ? (
              <span className="ml-2 text-green-600 font-medium">✓ All reviews complete</span>
            ) : (
              <span className="ml-2 text-amber-600">({summary.pendingCount} pending)</span>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium text-gray-700">Review Details:</h3>
          
          {summary.reviews.length === 0 ? (
            <div className="text-sm text-gray-600">No reviews yet.</div>
          ) : (
            <div className="space-y-2">
              {summary.reviews.map((review: any, index: number) => (
                <div 
                  key={index} 
                  className={`p-3 border rounded-md ${
                    review.leader_reviewed 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-amber-50 border-amber-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{review.job_id}</div>
                      {review.leader_reviewed ? (
                        <div className="text-sm text-green-700 mt-1">
                          ✓ Approved by {review.leader_name || review.leader_reviewed_by} 
                          {review.leader_reviewed_at && (
                            <span> at {new Date(review.leader_reviewed_at).toLocaleString()}</span>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-amber-700 mt-1">
                          ⏳ Pending leader review
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {review.leader_reviewed ? 'Approved' : 'Pending'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
