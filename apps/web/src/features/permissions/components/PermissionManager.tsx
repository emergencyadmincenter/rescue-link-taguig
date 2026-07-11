"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { FiArrowLeft, FiPlus, FiAlertCircle } from "react-icons/fi";
import { Role, Permission } from "../types/permissions.types";
import { permissionsApi } from "../api/permissions.api";
import { RoleList } from "./RoleList";
import { PermissionGroup } from "./PermissionGroup";
import { PermissionFormModal } from "./PermissionFormModal";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import toast from "react-hot-toast";

export function PermissionManager() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<Set<string>>(
    new Set(),
  );
  const [initialRolePermissions, setInitialRolePermissions] = useState<
    Set<string>
  >(new Set());

  const [isLoading, setIsLoading] = useState(true);
  const [isRoleLoading, setIsRoleLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(
    null,
  );

  const selectedRole = roles.find((r) => r.id === selectedRoleId);
  const hasChanges =
    Array.from(rolePermissions).sort().join(",") !==
    Array.from(initialRolePermissions).sort().join(",");

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [rolesRes, permsRes] = await Promise.all([
        permissionsApi.getRoles(),
        permissionsApi.getPermissions(),
      ]);
      setRoles(rolesRes);
      setPermissions(permsRes);
      if (rolesRes.length > 0 && !selectedRoleId) {
        setSelectedRoleId(rolesRes[0].id);
      }
    } catch (err: any) {
      toast.error(
        err.response?.data?.error?.message ||
          "Failed to load roles and permissions.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedRoleId) {
      const loadRolePermissions = async () => {
        setIsRoleLoading(true);
        try {
          const rolePerms =
            await permissionsApi.getRolePermissions(selectedRoleId);
          const permSet = new Set<string>(
            rolePerms.map((p: Permission) => p.id),
          );
          setRolePermissions(permSet);
          setInitialRolePermissions(permSet);
        } catch (err: any) {
          toast.error(
            err.response?.data?.error?.message ||
              "Failed to load role permissions.",
          );
        } finally {
          setIsRoleLoading(false);
        }
      };
      loadRolePermissions();
    }
  }, [selectedRoleId]);

  const [updatingPermissionId, setUpdatingPermissionId] = useState<
    string | null
  >(null);

  const handleTogglePermission = async (permissionId: string) => {
    if (!selectedRoleId || updatingPermissionId) return;

    const isAdding = !rolePermissions.has(permissionId);

    // Optimistic UI update
    setRolePermissions((prev) => {
      const next = new Set(prev);
      if (isAdding) next.add(permissionId);
      else next.delete(permissionId);
      return next;
    });

    setUpdatingPermissionId(permissionId);

    try {
      const nextPermissions = isAdding
        ? [...Array.from(rolePermissions), permissionId]
        : Array.from(rolePermissions).filter((id) => id !== permissionId);

      await permissionsApi.updateRolePermissions(
        selectedRoleId,
        nextPermissions,
      );
      setInitialRolePermissions(new Set(nextPermissions));
      toast.success(isAdding ? "Permission assigned" : "Permission removed", {
        id: "toggle-perm",
      });
    } catch (err: any) {
      // Revert optimistic UI
      setRolePermissions((prev) => {
        const next = new Set(prev);
        if (isAdding) next.delete(permissionId);
        else next.add(permissionId);
        return next;
      });
      toast.error(
        err.response?.data?.error?.message ||
          "Failed to update permission. Changes reverted.",
      );
    } finally {
      setUpdatingPermissionId(null);
    }
  };

  const groupedPermissions = useMemo(() => {
    return permissions.reduce(
      (acc, perm) => {
        if (!acc[perm.resource]) acc[perm.resource] = [];
        acc[perm.resource].push(perm);
        return acc;
      },
      {} as Record<string, Permission[]>,
    );
  }, [permissions]);

  const handleSaveMasterPermission = async (data: any) => {
    try {
      if (editingPermission) {
        await permissionsApi.updatePermission(editingPermission.id, data);
        toast.success("Permission updated successfully.");
      } else {
        await permissionsApi.createPermission(data);
        toast.success("System permission created.");
      }
      loadData();
    } catch (err: any) {
      throw err;
    }
  };

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteMasterPermission = async () => {
    if (!deleteConfirmId) return;
    setIsDeleting(true);
    try {
      await permissionsApi.deletePermission(deleteConfirmId);
      toast.success("Permission deleted.");
      loadData();
    } catch (err: any) {
      toast.error(
        err.response?.data?.error?.message || "Failed to delete permission.",
      );
    } finally {
      setIsDeleting(false);
      setDeleteConfirmId(null);
    }
  };

  return (
    <div className="h-full flex flex-col max-w-[1400px] mx-auto p-2">
      {/* Page Header */}
      <div className="mb-3 relative flex items-center justify-center py-4">
        <div className="absolute left-0">
          <Link
            href="/personnel"
            className="text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1 text-sm font-medium"
          >
            <FiArrowLeft className="w-4 h-4" />
            Back to Personnel
          </Link>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Permission Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Configure access controls and provision roles.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row flex-1 bg-white rounded-xl shadow-sm border border-gray-100 min-h-0">
        {/* Sidebar */}
        <div className="w-full md:w-72 flex-shrink-0 bg-gray-50/50 border-r border-gray-100">
          <RoleList
            roles={roles}
            selectedRoleId={selectedRoleId}
            onSelectRole={setSelectedRoleId}
            isLoading={isLoading}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          {selectedRole ? (
            <>
              {/* Role Header Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between px-8 py-5 border-b border-gray-100 bg-white sticky top-0 z-10">
                <div className="mb-4 sm:mb-0">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 capitalize">
                    {selectedRole.name}
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                      Role
                    </span>
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedRole.description || "No description provided."}
                  </p>
                </div>

                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPermission(null);
                      setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
                  >
                    <FiPlus className="w-4 h-4" />
                    New System Permission
                  </button>
                </div>
              </div>

              {/* Permissions Canvas */}
              <div className="flex-1 overflow-y-auto p-8 bg-gray-50/30">
                {isRoleLoading ? (
                  <div className="w-full space-y-8 animate-pulse">
                    {[1, 2].map((i) => (
                      <div
                        key={i}
                        className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm"
                      >
                        <div className="bg-gray-50/80 px-5 py-3 border-b border-gray-100 flex items-center">
                          <div className="h-4 w-32 bg-gray-200 rounded"></div>
                        </div>
                        <div className="p-5">
                          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                            {[1, 2, 3, 4].map((j) => (
                              <div
                                key={j}
                                className="bg-white rounded-lg border border-gray-100 flex p-4 space-x-3 items-start shadow-sm"
                              >
                                <div className="w-4 h-4 bg-gray-200 rounded shrink-0 mt-0.5"></div>
                                <div className="flex-1 space-y-3 mt-0.5">
                                  <div className="h-3.5 bg-gray-200 rounded w-1/2"></div>
                                  <div className="space-y-2 mt-2">
                                    <div className="h-2.5 bg-gray-100 rounded w-full"></div>
                                    <div className="h-2.5 bg-gray-100 rounded w-4/5"></div>
                                  </div>
                                  <div className="h-4 bg-gray-100 rounded w-1/3 mt-2"></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : Object.keys(groupedPermissions).length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <FiAlertCircle className="w-12 h-12 mb-3 opacity-20" />
                    <p>No permissions defined in the system.</p>
                  </div>
                ) : (
                  <div className="w-full space-y-8">
                    {Object.entries(groupedPermissions)
                      .sort((a, b) => {
                        const maxA = Math.max(
                          ...a[1].map((p) =>
                            new Date(p.created_at || 0).getTime(),
                          ),
                        );
                        const maxB = Math.max(
                          ...b[1].map((p) =>
                            new Date(p.created_at || 0).getTime(),
                          ),
                        );
                        return maxB - maxA;
                      })
                      .map(([resource, perms]) => (
                        <PermissionGroup
                          key={resource}
                          resource={resource}
                          permissions={perms}
                          selectedPermissionIds={rolePermissions}
                          onTogglePermission={handleTogglePermission}
                          onEditPermission={(perm) => {
                            setEditingPermission(perm);
                            setIsModalOpen(true);
                          }}
                          onDeletePermission={(id) => setDeleteConfirmId(id)}
                          updatingPermissionId={updatingPermissionId}
                        />
                      ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-gray-50/50">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 mb-4">
                <svg
                  className="w-8 h-8 text-gray-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-600 mb-1">
                No Role Selected
              </h3>
              <p className="text-sm text-gray-400">
                Select a role from the sidebar to view and manage its
                permissions.
              </p>
            </div>
          )}
        </div>
      </div>

      <PermissionFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveMasterPermission}
        initialData={editingPermission}
      />

      <ConfirmationDialog
        isOpen={!!deleteConfirmId}
        title="Delete System Permission"
        message="Are you sure you want to delete this permission? This will permanently remove it from all roles."
        confirmLabel="Delete"
        onConfirm={handleDeleteMasterPermission}
        onCancel={() => setDeleteConfirmId(null)}
        isDestructive={true}
        isLoading={isDeleting}
      />
    </div>
  );
}
