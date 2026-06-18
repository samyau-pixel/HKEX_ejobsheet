"use client";

import React from 'react';
import { ExecutionService } from '../../services/execution.service';

export default function CompleteSheetButton({
  id,
  onDone,
  disabled,
}: {
  id: string;
  onDone: () => void;
  disabled?: boolean;
}) {
  const handleComplete = async () => {
    if (disabled) return;
    try {
      await ExecutionService.completeExecution(id);
      onDone();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Unable to complete execution');
    }
  };

  return (
    <button
      className={`btn btn-primary ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={handleComplete}
      disabled={disabled}
      title={disabled ? 'All jobs must be completed before completing the sheet' : 'Complete sheet'}
    >
      Complete Sheet
    </button>
  );
}
