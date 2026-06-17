"use client";

import React from 'react';
import { ExecutionService } from '../../services/execution.service';

export default function CheckInModal({ id, onClose, onDone }: { id: string; onClose: () => void; onDone: () => void }) {
  const handleCheckIn = async () => {
    try {
      await ExecutionService.checkIn(id);
      onDone();
      onClose();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Unable to check in');
    }
  };

  return (
    <div className="p-4 border rounded bg-white shadow">
      <div className="text-lg font-semibold mb-2">Confirm Check-In</div>
      <div className="mb-4">Are you sure you want to check in to this jobsheet?</div>
      <div className="flex space-x-2">
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={handleCheckIn}>Confirm Check-In</button>
      </div>
    </div>
  );
}
