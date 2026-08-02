"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, notFound } from "next/navigation";
import { logsApi } from "@/features/logs/api/logs.api";
import SharedLogView from "@/features/logs/components/SharedLogView";

export default function ResidentLogPage() {
  const { callId } = useParams<{ callId: string }>();
  const router = useRouter();
  const [log, setLog] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchLog() {
      try {
        const data = await logsApi.getResidentLogByCallId(callId);
        setLog(data);
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    if (callId) fetchLog();
  }, [callId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-gray-500 font-medium">Loading emergency log...</p>
        </div>
      </div>
    );
  }

  if (error || !log) {
    notFound();
  }

  return (
    <SharedLogView
      log={log}
      titleBadge="Your Emergency Log"
      footerText="This is your personal emergency record. Sensitive internal data has been redacted."
      onBack={() => router.push("/resident/logs")}
    />
  );
}
