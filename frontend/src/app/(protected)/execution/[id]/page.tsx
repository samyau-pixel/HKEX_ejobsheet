"use client";

import React from 'react';
import ExecutionDetail from '../../../../components/execution/ExecutionDetail';

export default function Page({ params }: { params: { id: string } }) {
  const { id } = params;
  return (
    <div className="p-4">
      <ExecutionDetail id={id} />
    </div>
  );
}
