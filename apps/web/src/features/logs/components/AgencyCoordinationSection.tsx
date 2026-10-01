import React, { useEffect } from "react";
import {
  FiShield,
  FiCheck,
  FiClock,
  FiPlus,
  FiPhoneForwarded,
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

  if (isLoading) {
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
    <div className="space-y-4">
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
                className="p-3 bg-background-subtle/30 border border-background-subtle rounded-lg flex flex-col gap-2 relative"
              >
                {isRecommended && (
                  <span className="absolute -top-2 -left-2 bg-info text-info-foreground text-[9px] uppercase font-bold px-1.5 py-0.5 rounded shadow-sm">
                    Recommended
                  </span>
                )}

                <div className="flex justify-between items-start pt-1">
                  <div>
                    <h4 className="text-sm font-medium">{agency.name}</h4>
                    {agency.contact_info && (
                      <p className="text-[11px] text-foreground/60 mt-0.5 flex items-center gap-1">
                        <FiPhoneForwarded className="w-3 h-3" />{" "}
                        {agency.contact_info}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {status === "pending" && (
                      <span className="px-2 py-1 bg-warning/10 text-warning text-[10px] font-bold uppercase rounded flex items-center gap-1">
                        <FiClock className="w-3 h-3" /> Pending
                      </span>
                    )}
                    {status === "contacted" && (
                      <span className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold uppercase rounded flex items-center gap-1">
                        <FiPhoneForwarded className="w-3 h-3" /> Contacted
                      </span>
                    )}
                    {status === "completed" && (
                      <span className="px-2 py-1 bg-success/10 text-success text-[10px] font-bold uppercase rounded flex items-center gap-1">
                        <FiCheck className="w-3 h-3" /> Completed
                      </span>
                    )}
                  </div>
                </div>

                {!isReadOnly && (
                  <div className="flex gap-2 mt-2 pt-2 border-t border-background-subtle/50">
                    <button
                      onClick={() => handleUpdateStatus(agency.id, "pending")}
                      disabled={status === "pending"}
                      className="text-[10px] font-medium px-2 py-1 rounded transition-colors disabled:opacity-50 disabled:bg-foreground/5 disabled:text-foreground/40 bg-background hover:bg-background-subtle border border-background-subtle"
                    >
                      Reset to Pending
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(agency.id, "contacted")}
                      disabled={status === "contacted"}
                      className="text-[10px] font-medium px-2 py-1 rounded transition-colors disabled:opacity-50 disabled:bg-primary/20 disabled:text-primary bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/20"
                    >
                      Mark Contacted
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(agency.id, "completed")}
                      disabled={status === "completed"}
                      className="text-[10px] font-medium px-2 py-1 rounded transition-colors disabled:opacity-50 disabled:bg-success/20 disabled:text-success bg-success/10 text-success hover:bg-success hover:text-success-foreground border border-success/20"
                    >
                      Mark Completed
                    </button>
                  </div>
                )}

                {coordRecord?.updated_at && (
                  <p className="text-[10px] text-foreground/40 text-right w-full mt-1">
                    Last updated by {coordRecord.created_by?.name || "System"}{" "}
                    at {new Date(coordRecord.updated_at).toLocaleString()}
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
