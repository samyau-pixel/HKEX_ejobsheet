"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ExecutionService } from '../../services/execution.service';

interface LeaderReviewModalProps {
  executionId: string;
  jobId: string;
  jobName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function LeaderReviewModal({ executionId, jobId, jobName, onClose, onSuccess }: LeaderReviewModalProps) {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer countdown
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleTimeout = () => {
    setError('Session timed out. Please try again.');
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId || !password) {
      setError('Please enter both user ID and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await ExecutionService.submitLeaderReview(executionId, jobId, userId, password);
      
      if (result.success) {
        onSuccess();
        onClose();
      } else {
        throw new Error(result.error || 'Leader review failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit leader review');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 id="modal-title" className="text-xl font-semibold mb-4">Operator Leader Review</h2>
        
        <div className="mb-4">
          <p className="text-gray-700 mb-2">Job: <span className="font-medium">{jobName}</span></p>
          <p className="text-sm text-gray-600">
            Please review the job and enter your credentials to approve.
          </p>
        </div>

        <div className="mb-4 text-sm">
          <span className="text-gray-600">Time remaining: </span>
          <span className={`font-mono ${timeLeft < 60 ? 'text-red-600' : 'text-gray-700'}`}>
            {formatTime(timeLeft)}
          </span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-1">
              Leader User ID
            </label>
            <input
              type="text"
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your user ID"
              required
              autoComplete="off"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your password"
              required
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm" role="alert">
              {error}
            </div>
          )}

          <div className="flex space-x-2">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Approve'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
