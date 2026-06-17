"use client";

import React from 'react';
import { ExecutionService } from '../../services/execution.service';

export default function CompleteSheetButton({ id, onDone }: { id: string; onDone: () => void }) {
  const handleComplete = async () => {
    try {
      await ExecutionService.completeExecution(id);
      onDone();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Unable to complete execution');
    }
  };

  return (
    <button className="btn btn-primary" onClick={handleComplete}>Complete Sheet</button>
  );
}
