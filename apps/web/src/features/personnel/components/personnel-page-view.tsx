"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "react-hot-toast";
import {
  FiSearch,
  FiBell,
  FiChevronDown,
  FiChevronUp,
  FiMoreHorizontal,
  FiMessageSquare,
  FiX,
  FiShield,
} from "react-icons/fi";
import {
  HiOutlineViewGrid,
  HiOutlineUserGroup,
  HiOutlineLocationMarker,
  HiOutlineUser,
} from "react-icons/hi";
import { BiFilterAlt } from "react-icons/bi";
import { MdCheckCircle } from "react-icons/md";
import AddPersonnelForm from "./add-personnel-form";
import EditPersonnelForm from "./edit-personnel-form";
import { PersonnelDetailDialog } from "./personnel-detail-dialog";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { usePersonnel } from "../hooks/use-personnel";
import {
  deactivatePersonnel,
  reactivatePersonnel,
  removePersonnel,
  resendActivationEmail,
} from "../api/personnel.api";
import {
  PersonnelEntry as ApiPersonnelItem,
  PersonnelStatus,
} from "../types/personnel.types";

export default function PersonnelPageView() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPerson, setEditingPerson] = useState<ApiPersonnelItem | null>(
    null,
  );
  const [confirmAction, setConfirmAction] = useState<{
    type: "deactivate" | "reactivate" | "remove";
    person: ApiPersonnelItem;
  } | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [detailPerson, setDetailPerson] = useState<ApiPersonnelItem | null>(
    null,
  );
  const [detailRole, setDetailRole] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<PersonnelStatus | "">("");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const [expandedRoles, setExpandedRoles] = useState<Record<string, boolean>>(
    {},
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // `refresh` triggers a re-fetch of the personnel list (e.g. after creating a new account)
  const { groups, isLoading, error, refresh } = usePersonnel({
    search: debouncedSearchQuery,
    status: statusFilter,
  });

  const handleClearFilters = () => {
    setSearchQuery("");
    setDebouncedSearchQuery("");
    setStatusFilter("");
  };

  const toggleRoleExpand = (roleKey: string) => {
    setExpandedRoles((prev) => ({
      ...prev,
      [roleKey]: prev[roleKey] !== undefined ? !prev[roleKey] : false,
    }));
  };

  return (
    <>
      <div className="bg-white rounded-xl w-full min-h-[calc(100vh-60px-56px)] px-10 py-9">
        {/* Page Title */}
        <div className="mb-8 w-max">
          <h1 className="display-small text-gray-900 inline-block">
            Personnel Management
          </h1>
          <div className="divider-primary-half" />
        </div>

        {/* Search Row */}
        <div className="flex items-center gap-3 mb-8">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name or email..."
              className="w-full pl-5 pr-10 py-2.5 border border-gray-200 rounded-full body-small focus:outline-none focus:border-primary text-gray-700 placeholder:text-gray-400 transition-colors"
            />
            <FiSearch className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 w-[15px] h-[15px]" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 transition-colors"
              >
                <FiX className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              className={`relative flex items-center gap-2 px-4 py-2.5 border rounded-full body-small transition-colors ${statusFilter ? "border-primary text-primary bg-primary-subtle/30" : "border-gray-200 text-gray-700 hover:border-gray-300"}`}
            >
              <BiFilterAlt className="w-[18px] h-[18px]" />
              <span>
                {statusFilter
                  ? statusFilter === "pending_activation"
                    ? "Pending"
                    : statusFilter.charAt(0).toUpperCase() +
                      statusFilter.slice(1)
                  : "All Status"}
              </span>
              {statusFilter && (
                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-danger rounded-full border-2 border-white translate-x-1/3 -translate-y-1/3" />
              )}
            </button>

            {showStatusDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowStatusDropdown(false)}
                />
                <div className="absolute right-0 top-full mt-2 bg-white border border-gray-100 rounded-lg shadow-lg p-3 w-[240px] z-20 flex flex-wrap gap-2">
                  {["", "active", "pending_activation", "inactive"].map(
                    (status) => (
                      <button
                        key={status}
                        onClick={() => {
                          setStatusFilter(status as PersonnelStatus | "");
                          setShowStatusDropdown(false);
                        }}
                        className={`px-3 py-1.5 rounded-full body-xsmall font-medium transition-colors ${statusFilter === status ? "bg-primary text-primary-foreground" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                      >
                        {status === ""
                          ? "All"
                          : status === "pending_activation"
                            ? "Pending"
                            : status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ),
                  )}
                </div>
              </>
            )}
          </div>

          {(searchQuery || statusFilter) && (
            <button
              onClick={handleClearFilters}
              className="text-gray-500 hover:text-gray-700 body-small font-medium transition-colors ml-2 underline decoration-gray-300 underline-offset-2"
            >
              Clear filters
            </button>
          )}

          <div className="flex items-center gap-3 ml-auto pl-4 border-l border-gray-200">
            <Link
              href="/personnel/permissions"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 body-small font-medium transition-colors shrink-0"
            >
              <FiShield className="w-4 h-4" />
              <span>Permissions</span>
            </Link>

            <button
              onClick={() => setShowAddForm(true)}
              className="w-8 h-8 rounded-full bg-primary hover:bg-primary-hover text-primary-foreground flex items-center justify-center transition-colors shrink-0 text-[18px] leading-none font-light"
            >
              +
            </button>
          </div>
        </div>

        {/* Personnel List */}
        {isLoading ? (
          <div className="py-10 text-center text-gray-500 body-small">
            Loading personnel...
          </div>
        ) : error ? (
          <div className="py-10 text-center text-danger body-small">
            Failed to load personnel
          </div>
        ) : groups.length === 0 ? (
          <div className="py-10 text-center text-gray-500 body-small">
            {debouncedSearchQuery || statusFilter
              ? "No results match your search."
              : "No personnel found."}
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {groups.map((group) => {
              const isExpanded = expandedRoles[group.roleKey] !== false; // expanded by default

              return (
                <div key={group.roleKey} className="flex flex-col">
                  {/* Section Header */}
                  <div
                    className="flex justify-between items-center mb-3 cursor-pointer group"
                    onClick={() => toggleRoleExpand(group.roleKey)}
                  >
                    <div className="flex items-center gap-2">
                      <h2 className="body-medium font-bold text-gray-900 group-hover:text-primary transition-colors">
                        {group.role}
                      </h2>
                      <span className="bg-gray-100 text-gray-600 group-hover:bg-primary-subtle group-hover:text-primary transition-colors text-xs px-2 py-0.5 rounded-full font-semibold">
                        {group.count}
                      </span>
                    </div>
                    <FiChevronDown
                      className={`text-gray-400 w-4 h-4 group-hover:text-primary transition-all duration-200 ${isExpanded ? "rotate-180" : ""}`}
                    />
                  </div>

                  <div className="border-t border-gray-100" />

                  {/* Accordion Content */}
                  {isExpanded && (
                    <div className="flex flex-col">
                      {group.personnel.length === 0 ? (
                        <div className="py-8 flex flex-col items-center justify-center text-gray-500">
                          <HiOutlineUserGroup className="w-8 h-8 text-gray-300 mb-2" />
                          <span className="body-small italic">
                            {debouncedSearchQuery || statusFilter
                              ? "No results match your search."
                              : `No ${group.role} accounts yet.`}
                          </span>
                        </div>
                      ) : (
                        group.personnel.map((person) => (
                          <PersonnelItemComponent
                            key={person.id}
                            person={person}
                            isMenuOpen={openMenuId === person.id}
                            isSelected={selectedPersonId === person.id}
                            onClick={() => {
                              setSelectedPersonId(person.id);
                              setDetailPerson(person);
                              setDetailRole(group.role);
                            }}
                            onMenuToggle={() =>
                              setOpenMenuId(
                                openMenuId === person.id ? null : person.id,
                              )
                            }
                            onCloseMenu={() => setOpenMenuId(null)}
                            onEdit={() => {
                              setEditingPerson(person);
                              setOpenMenuId(null);
                            }}
                            onDeactivate={() => {
                              setConfirmAction({ type: "deactivate", person });
                              setOpenMenuId(null);
                            }}
                            onReactivate={() => {
                              setConfirmAction({ type: "reactivate", person });
                              setOpenMenuId(null);
                            }}
                            onResendActivation={async () => {
                              setOpenMenuId(null);
                              try {
                                await resendActivationEmail(person.id);
                                toast.success(
                                  "Activation email resent successfully",
                                );
                              } catch (error: unknown) {
                                toast.error(
                                  error instanceof Error
                                    ? error.message
                                    : "Failed to resend activation email",
                                );
                              }
                            }}
                            onRemove={() => {
                              setConfirmAction({ type: "remove", person });
                              setOpenMenuId(null);
                            }}
                          />
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ===== Personnel Detail Dialog ===== */}
      <PersonnelDetailDialog
        isOpen={!!detailPerson}
        person={detailPerson}
        role={detailRole}
        onClose={() => setDetailPerson(null)}
        onEdit={(person) => {
          setEditingPerson(person);
          setDetailPerson(null);
        }}
      />

      {/* ===== Add Personnel Dialog ===== */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          {/* onSuccess triggers a list refresh after the account is created */}
          <AddPersonnelForm
            onCancel={() => setShowAddForm(false)}
            onSuccess={refresh}
          />
        </div>
      )}

      {/* ===== Edit Personnel Dialog ===== */}
      {editingPerson && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <EditPersonnelForm
            id={editingPerson.id}
            initialName={editingPerson.name}
            initialEmail={editingPerson.email}
            initialRole="Coordinator"
            onCancel={() => setEditingPerson(null)}
            onSuccess={refresh}
          />
        </div>
      )}

      {/* ===== Confirmation Dialog ===== */}
      <ConfirmationDialog
        isOpen={!!confirmAction}
        title={
          confirmAction?.type === "deactivate"
            ? "Deactivate Personnel Account"
            : confirmAction?.type === "reactivate"
              ? "Reactivate Personnel Account"
              : "Remove Personnel Account"
        }
        message={
          confirmAction?.type === "deactivate"
            ? "Are you sure you want to deactivate this personnel account? The personnel will no longer be able to access the system until the account is reactivated."
            : confirmAction?.type === "reactivate"
              ? "Are you sure you want to reactivate this personnel account? The personnel will regain access to the system using their existing credentials."
              : "Are you sure you want to remove this personnel account? The account will be removed from the active personnel list and can no longer be reactivated."
        }
        confirmLabel={
          isActionLoading
            ? "Processing..."
            : confirmAction?.type === "deactivate"
              ? "Deactivate"
              : confirmAction?.type === "reactivate"
                ? "Reactivate"
                : "Remove"
        }
        isDestructive={confirmAction?.type !== "reactivate"}
        onCancel={() => {
          if (!isActionLoading) setConfirmAction(null);
        }}
        onConfirm={async () => {
          if (!confirmAction || isActionLoading) return;
          setIsActionLoading(true);
          try {
            if (confirmAction.type === "deactivate") {
              await deactivatePersonnel(confirmAction.person.id);
              toast.success("Personnel account deactivated successfully");
            } else if (confirmAction.type === "reactivate") {
              await reactivatePersonnel(confirmAction.person.id);
              toast.success("Personnel account reactivated successfully");
            } else if (confirmAction.type === "remove") {
              await removePersonnel(confirmAction.person.id);
              toast.success("Personnel account removed successfully");
            }
            refresh();
            setConfirmAction(null);
          } catch (error: unknown) {
            toast.error(
              error instanceof Error
                ? error.message
                : `Failed to ${confirmAction.type} personnel`,
            );
          } finally {
            setIsActionLoading(false);
          }
        }}
      />
    </>
  );
}

/* ---- Personnel List Item ---- */
interface PersonnelItemProps {
  person: ApiPersonnelItem;
  isMenuOpen: boolean;
  isSelected: boolean;
  onClick: () => void;
  onMenuToggle: () => void;
  onCloseMenu: () => void;
  onEdit: () => void;
  onDeactivate: () => void;
  onReactivate: () => void;
  onResendActivation: () => void;
  onRemove: () => void;
}

function PersonnelItemComponent({
  person,
  isMenuOpen,
  isSelected,
  onClick,
  onMenuToggle,
  onCloseMenu,
  onEdit,
  onDeactivate,
  onReactivate,
  onResendActivation,
  onRemove,
}: PersonnelItemProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onCloseMenu();
      }
    }
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isMenuOpen, onCloseMenu]);

  return (
    <div
      className={`flex items-center justify-between py-3.5 px-4 -mx-4 rounded-lg cursor-pointer transition-colors group ${
        isSelected
          ? "bg-primary-subtle/50"
          : "hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        {/* Avatar circle with initials */}
        <div className="w-9 h-9 rounded-full bg-primary-subtle shrink-0 flex items-center justify-center text-primary font-medium body-small">
          {(() => {
            const parts = person.name.trim().split(" ");
            if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
            return (
              parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
            ).toUpperCase();
          })()}
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900 body-small">
              {person.name}
            </span>
            {person.status === "active" && (
              <span className="flex items-center gap-0.5 bg-success/10 px-2 py-0.5 rounded-full">
                <span className="body-xsmall text-success font-medium">
                  Verified
                </span>
                <MdCheckCircle className="text-success w-[13px] h-[13px]" />
              </span>
            )}
            {person.status === "pending_activation" && (
              <span className="flex items-center gap-1 bg-warning/10 px-2 py-0.5 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-warning shrink-0" />
                <span className="body-xsmall text-warning font-medium">
                  Pending
                </span>
              </span>
            )}
            {person.status === "inactive" && (
              <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-500 shrink-0" />
                <span className="body-xsmall text-gray-500 font-medium">
                  Inactive
                </span>
              </span>
            )}
          </div>
          <span className="body-xsmall text-gray-400 mt-0.5">
            {person.email}
          </span>
        </div>
      </div>

      {/* Three dots menu */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMenuToggle();
          }}
          className="text-gray-400 hover:text-gray-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
        >
          <FiMoreHorizontal className="w-[18px] h-[18px]" />
        </button>

        {isMenuOpen && (
          <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-lg shadow-lg py-1 w-[150px] z-20">
            {person.status === "active" ? (
              <>
                <MenuButton label="Edit" onClick={onEdit} />
                <MenuButton label="Deactivate" onClick={onDeactivate} />
                <MenuButton
                  label="Remove"
                  onClick={onRemove}
                  color="text-danger"
                />
              </>
            ) : person.status === "inactive" ? (
              <>
                <MenuButton label="Edit" onClick={onEdit} />
                <MenuButton
                  label="Reactivate"
                  onClick={onReactivate}
                  color="text-success"
                />
                <MenuButton
                  label="Remove"
                  onClick={onRemove}
                  color="text-danger"
                />
              </>
            ) : (
              <>
                <MenuButton label="Edit" onClick={onEdit} />
                <MenuButton
                  label="Resend Activation"
                  onClick={onResendActivation}
                />
                <MenuButton label="Deactivate" onClick={onDeactivate} />
                <MenuButton
                  label="Remove"
                  onClick={onRemove}
                  color="text-danger"
                />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---- Context Menu Button ---- */
function MenuButton({
  label,
  onClick,
  color = "text-gray-700",
}: {
  label: string;
  onClick: () => void;
  color?: string;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`w-full text-left px-4 py-1.5 body-xsmall hover:bg-gray-50 transition-colors ${color}`}
    >
      {label}
    </button>
  );
}
