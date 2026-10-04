import React from "react";
import Link from "next/link";

export function Unauthorized() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center px-4">
      <div className="w-64 h-64 relative mb-6">
        <div className="absolute inset-0 bg-gray-100 rounded-full flex items-center justify-center">
          <span className="text-gray-400 text-6xl">🔒</span>
        </div>
      </div>
      <h2 className="title-large text-gray-900 mb-2">Access Denied</h2>
      <p className="body-medium text-gray-500 mb-6">
        This page isn't available for your account.
      </p>
      <Link
        href="/dashboard"
        className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary-hover transition-colors"
      >
        Return to Dashboard
      </Link>
    </div>
  );
}
