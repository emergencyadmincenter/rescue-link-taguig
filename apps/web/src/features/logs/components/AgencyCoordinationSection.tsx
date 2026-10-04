import React, { useEffect } from "react";
import {
  FiShield,
  FiCheck,
  FiClock,
  FiPlus,
  FiPhoneForwarded,
  FiX,
} from "react-icons/fi";
import { logsApi } from "../api/logs.api";
import { toast } from "react-hot-toast";

interface AgencyCoordinationSectionProps {
  logId: string;
  isReadOnly: boolean;
  updateTrigger?: string;
}

export function AgencyCoordinationSection({
  logId,
  isReadOnly,
  updateTrigger,
}: AgencyCoordinationSectionProps) {
  const [recommended, setRecommended] = React.useState<any[]>([]);
  const [coordinations, setCoordinations] = React.useState<any[]>([]);
  const [allAgencies, setAllAgencies] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [showAddMenu, setShowAddMenu] = React.useState(false);

  useEffect(() => {
    fetchData();
  }, [logId, updateTrigger]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [coordRes, agenciesRes] = await Promise.all([
        logsApi.getLogCoordinations(logId),
        logsApi.getAgencies(),
      ]);
      setRecommended(coordRes.recommendedAgencies || []);
      setCoordinations(coordRes.coordinations || []);
      setAllAgencies(agenciesRes || []);
    } catch (error) {
      console.error("Failed to fetch coordinations", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCoordination = async (agencyId: string) => {
    if (isReadOnly) return;
    try {
      await logsApi.deleteLogCoordination(logId, agencyId);
      toast.success('Agency coordination removed');
      fetchData();
    } catch (error) {
      toast.error('Failed to remove agency');
    }
  };

  const handleUpdateStatus = async (agencyId: string, status: string) => {
    if (isReadOnly) return;
    try {
      await logsApi.updateLogCoordination(logId, agencyId, { status });
      toast.success("Coordination updated");
      fetchData();
    } catch (error) {
      toast.error("Failed to update coordination");
    }
  };

  if (isLoading && allAgencies.length === 0) {
    return (
      <div className="p-4 text-xs opacity-50">Loading coordination data...</div>
    );
  }

  const involvedAgencyIds = new Set([
    ...recommended.map((a) => a.id),
    ...coordinations.map((c) => c.agency_id),
  ]);

  const involvedList = allAgencies.filter((a) => involvedAgencyIds.has(a.id));
  const unassignedAgencies = allAgencies.filter(
    (a) => !involvedAgencyIds.has(a.id),
  );

  return (
    <div className={`space-y-4 transition-opacity duration-200 ${isLoading ? "opacity-50 pointer-events-none" : ""}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-foreground/70 uppercase tracking-wider flex items-center gap-2">
          <FiShield className="w-4 h-4" /> Agency Coordination
        </h3>
        {!isReadOnly && (
          <div className="relative">
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary-hover px-2 py-1 rounded bg-primary/10 transition-colors"
            >
              <FiPlus className="w-3 h-3" /> Add Agency
            </button>
            {showAddMenu && unassignedAgencies.length > 0 && (
              <div className="absolute right-0 top-full mt-1 w-64 bg-background border border-background-subtle shadow-lg rounded-md z-10 py-1 max-h-60 overflow-y-auto">
                {unassignedAgencies.map((agency) => (
                  <button
                    key={agency.id}
                    onClick={() => {
                      handleUpdateStatus(agency.id, "pending");
                      setShowAddMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-background-subtle flex items-center justify-between"
                  >
                    <span className="truncate">{agency.name}</span>
                  </button>
                ))}
              </div>
            )}
            {showAddMenu && unassignedAgencies.length === 0 && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-background border border-background-subtle shadow-lg rounded-md z-10 p-3 text-xs text-center text-foreground/50">
                All available agencies are already involved.
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2">
        {involvedList.length === 0 ? (
          <p className="body-small text-foreground/40 italic">
            No agencies recommended or coordinated yet.
          </p>
        ) : (
          involvedList.map((agency) => {
            const isRecommended = recommended.some((r) => r.id === agency.id);
            const coordRecord = coordinations.find(
              (c) => c.agency_id === agency.id,
            );
            const status = coordRecord?.status || "pending";

            return (
              <div
                key={agency.id}
                className="relative group p-4 bg-background border border-background-subtle rounded-xl hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                {isRecommended && (
                  <span className="absolute -top-2.5 -right-2 bg-info text-info-foreground text-[10px] uppercase font-bold px-2 py-0.5 rounded-full shadow-sm border border-background">
                    Recommended
                  </span>
                )}

                <div className="flex items-start gap-3 flex-1 min-w-0">
                  

                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold flex flex-wrap items-center gap-2">
                      <span className="truncate">{agency.name}</span>
                      
                    </h4>
                    {agency.contact_info ? (
                      <p className="text-xs text-foreground/60 mt-1 flex items-center gap-1.5 truncate">
                        <FiPhoneForwarded className="w-3 h-3 shrink-0" />{" "}
                        {agency.contact_info}
                      </p>
                    ) : (
                      <p className="text-xs text-foreground/40 mt-1 italic">
                        No contact info available
                      </p>
                    )}
                  </div>
                </div>

                {!isReadOnly && (
                  <div className="flex flex-wrap items-center gap-3 sm:shrink-0 pt-2 sm:pt-0 mt-2 sm:mt-0 border-t sm:border-0 border-background-subtle">
                    <div className="flex bg-background-subtle/50 p-1 rounded-lg border border-background-subtle items-center">
                      <button
                        onClick={() => handleUpdateStatus(agency.id, "pending")}
                        disabled={status === "pending"}
                        className={`px-3 py-1 text-xs rounded-md font-semibold transition-all ${
                          status === "pending"
                            ? "bg-background text-warning shadow-sm ring-1 ring-background-subtle"
                            : "text-foreground/50 hover:text-foreground hover:bg-background-subtle/50"
                        }`}
                      >
                        Pending
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(agency.id, "contacted")}
                        disabled={status === "contacted"}
                        className={`px-3 py-1 text-xs rounded-md font-semibold transition-all ${
                          status === "contacted"
                            ? "bg-background text-primary shadow-sm ring-1 ring-background-subtle"
                            : "text-foreground/50 hover:text-foreground hover:bg-background-subtle/50"
                        }`}
                      >
                        Contacted
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(agency.id, "completed")}
                        disabled={status === "completed"}
                        className={`px-3 py-1 text-xs rounded-md font-semibold transition-all ${
                          status === "completed"
                            ? "bg-background text-success shadow-sm ring-1 ring-background-subtle"
                            : "text-foreground/50 hover:text-foreground hover:bg-background-subtle/50"
                        }`}
                      >
                        Completed
                      </button>
                    </div>

                    {!isRecommended && (
                      <button
                        onClick={() => handleDeleteCoordination(agency.id)}
                        title="Remove manually added agency"
                        className="p-1.5 text-foreground/40 hover:text-danger hover:bg-danger/10 rounded-md transition-colors active:scale-95"
                      >
                        <FiX className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
                
                {coordRecord?.updated_at && (
                    <p className="text-[9px] text-foreground/40 absolute -bottom-5 right-0 hidden sm:block">
                      Updated by {coordRecord.created_by?.name || "System"} at {new Date(coordRecord.updated_at).toLocaleString()}
                    </p>
                )}
              </div>
            );
          })
        )}

        </div>
      </div>
    );
}




