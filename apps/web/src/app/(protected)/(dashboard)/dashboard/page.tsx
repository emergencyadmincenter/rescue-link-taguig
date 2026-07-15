import React from 'react';

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="w-max">
        <h1 className="display-small text-gray-900 inline-block">Dashboard</h1>
        <div className="divider-primary-half" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="title-medium text-gray-900 mb-2">Welcome Back</h3>
          <p className="body-medium text-gray-500">Your command center overview will appear here.</p>
        </div>
      </div>
    </div>
  );
}
