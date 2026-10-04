"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, notFound, useSearchParams } from "next/navigation";
import { logsApi } from "@/features/logs/api/logs.api";
import SharedLogView from "@/features/logs/components/SharedLogView";

function PublicLogContent() {
  const { token } = useParams<{ token: string }>();
  const searchParams = useSearchParams();
  const agencyToken = searchParams.get("agencyToken");
  const [log, setLog] = useState<any>(null);
  const [agencyInfo, setAgencyInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchLog() {
      try {
        const data = await logsApi.getPublicLog(token);
        setLog(data);
        
        if (agencyToken) {
          try {
            const agencyData = await logsApi.validateAgencyToken(token, agencyToken);
            setAgencyInfo(agencyData);
            
            // Inject coordination updates directly into the log object for SharedLogView
            if (agencyData.coordination_updates) {
              setLog((prev: any) => ({
                ...prev,
                coordination_updates: agencyData.coordination_updates,
              }));
            }
          } catch (rErr) {
            console.error("Invalid agency token", rErr);
            // Non-fatal, just no agency info
          }
        }
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    if (token) fetchLog();
  }, [token, agencyToken]);

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
      shareToken={token} 
      recipientInfo={agencyInfo} 
      recipientToken={agencyToken || undefined} 
    />
  );
}

export default function PublicLogPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
      <PublicLogContent />
    </Suspense>
  );
}
