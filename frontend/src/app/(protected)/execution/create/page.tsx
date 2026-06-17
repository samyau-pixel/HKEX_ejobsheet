"use client";

import React from 'react';
import CreateExecutionForm from '../../../../components/execution/CreateExecutionForm';

export default function Page() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Create Execution Jobsheet</h1>
      <CreateExecutionForm />
    </div>
  );
}
