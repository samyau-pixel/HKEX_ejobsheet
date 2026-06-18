"use client";

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/services/auth.service';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="bg-white shadow rounded-lg p-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Welcome{user ? `, ${user.name}` : ''}</h1>
        <p className="text-gray-600 mb-6">Select an area to proceed</p>

        <div className="flex justify-center gap-4">
          <Link
            href="/templates"
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Templates
          </Link>

          <Link
            href="/execution"
            className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Execution
          </Link>
        </div>
      </div>
    </div>
  );
}
