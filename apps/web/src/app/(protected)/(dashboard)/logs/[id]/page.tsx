"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { logsApi } from "@/features/logs/api/logs.api";
import { Log, Resource } from "@/features/logs/types/logs.types";
import LogDetailsPanel from "@/features/logs/components/LogDetailsPanel";
import { toast } from "react-hot-toast";

export default function LogDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [log, setLog] = useState<Log | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([logsApi.getLog(id), logsApi.getResources()])
      .then(([logData, resourcesData]) => {
        setLog(logData);
        setResources(resourcesData);
      })
      .catch(() => {
        toast.error("Failed to load log details");
        router.push("/logs");
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full bg-background-subtle">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!log) return null;

  return (
    <div className="flex h-full overflow-hidden bg-background-subtle">
      <div className="w-full h-full bg-background border-l border-r border-background-subtle">
        <LogDetailsPanel
          log={log}
          resources={resources}
          onBack={() => router.push("/logs")}
          onUpdate={setLog}
        />
      </div>
    </div>
  );
}
