import Link from "next/link";
import { FiClock, FiMapPin, FiPhone, FiMessageCircle, FiAlertCircle, FiChevronRight } from "react-icons/fi";

export interface EmergencyLog {
  id: string;
  status: "active" | "dispatched" | "resolved" | "cancelled";
  source: "voice_call" | "chat" | "manual";
  address: string;
  timestamp: string;
  assignedCoordinator?: string;
}

interface ActiveEmergenciesWidgetProps {
  logs: EmergencyLog[];
  className?: string;
}

export function ActiveEmergenciesWidget({ logs, className = "" }: ActiveEmergenciesWidgetProps) {
  const activeOrDispatched = logs.filter(
    (log) => log.status === "active" || log.status === "dispatched"
  );

  return (
    <div className={`bg-background rounded-xl border border-gray-100 shadow-sm flex flex-col ${className}`}>
      <div className="p-lg border-b border-gray-100 flex justify-between items-center bg-background-subtle rounded-t-xl">
        <h2 className="title-medium text-foreground flex items-center gap-sm">
          <span className="w-2 h-2 rounded-full bg-danger animate-pulse" />
          Active Emergencies
        </h2>
        <Link href="/logs" className="body-small text-primary hover:text-primary-hover font-medium interactive">
          View All
        </Link>
      </div>

      <div className="flex-1 overflow-auto p-2">
        {activeOrDispatched.length === 0 ? (
          <div className="p-xl text-center text-gray-500 body-medium">
            No active emergencies at this time.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {activeOrDispatched.map((log) => (
              <Link 
                key={log.id} 
                href={`/logs/${log.id}`}
                className="p-md rounded-lg flex items-center justify-between hover:bg-background-subtle border border-transparent hover:border-gray-100 transition-all duration-200 interactive group"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-xs">
                    <span className={`px-2 py-0.5 rounded-md text-[0.7rem] font-bold uppercase tracking-wider ${
                      log.status === "active" ? "bg-danger/10 text-danger" : "bg-warning-subtle text-warning-hover"
                    }`}>
                      {log.status}
                    </span>
                    <span className="text-gray-400 text-xs flex items-center gap-1 px-2">
                      <FiClock className="w-3 h-3" />
                      {log.timestamp}
                    </span>
                    <span className="text-gray-400 text-xs flex items-center gap-1 border-l border-gray-200 pl-2">
                      {log.source === "voice_call" && <FiPhone className="w-3 h-3" />}
                      {log.source === "chat" && <FiMessageCircle className="w-3 h-3" />}
                      {log.source === "manual" && <FiAlertCircle className="w-3 h-3" />}
                      <span className="capitalize">{log.source.replace("_", " ")}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground body-medium font-medium mt-1">
                    <FiMapPin className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="truncate max-w-[300px] sm:max-w-md">{log.address}</span>
                  </div>
                </div>

                <div className="flex items-center gap-md">
                  {log.assignedCoordinator && (
                    <div className="hidden sm:flex flex-col items-end">
                      <span className="text-[0.7rem] text-gray-400 uppercase tracking-wider font-medium">Assigned To</span>
                      <span className="body-small text-foreground">{log.assignedCoordinator}</span>
                    </div>
                  )}
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-50 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200">
                    <FiChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary-foreground" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
