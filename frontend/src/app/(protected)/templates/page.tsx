import React from 'react';
import Link from 'next/link';

export default function TemplatesPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Templates</h1>
        <Link
          href="/templates/create"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Create New Template
        </Link>
      </div>

      <div className="grid gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Pending Templates</h2>
          <p className="text-gray-600">Templates awaiting manager approval</p>
          {/* Template list component will be added here */}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Approved Templates</h2>
          <p className="text-gray-600">Ready to use for execution sheets</p>
          {/* Template list component will be added here */}
        </div>
      </div>
    </div>
  );
}
