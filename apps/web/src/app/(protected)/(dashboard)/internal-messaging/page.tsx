"use client";

import { InternalMessagingView } from "@/features/internal-messaging/InternalMessagingView";

export default function InternalMessagingPage() {
  return (
    <div className="flex flex-col h-full space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Internal Messaging</h1>
        <p className="text-sm text-gray-500">Communicate with administrators and coordinators.</p>
      </div>
      <div className="flex-1 min-h-0">
        <InternalMessagingView />
      </div>
    </div>
  );
}
