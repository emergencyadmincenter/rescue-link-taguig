"use client";

/**
 * AddPersonnelForm
 *
 * Dialog form for creating a new personnel account.
 *
 * API calls (real backend — no mocks):
 *   GET  /api/roles       — populates the Role dropdown on mount
 *   POST /api/personnel   — submits name + email + role_id to create the account
 *
 * On success:
 *   - calls `onSuccess()` so the parent can refresh the personnel list
 *   - calls `onCancel()` to close the dialog
 *
 * Error handling:
 *   - field-level: duplicate email (409), validation errors (400) shown inline
 *   - generic: network or unexpected errors shown as a banner
 *
 * The activation email is sent by the backend automatically after creation —
 * the frontend does not need to trigger it separately (see PersonnelService.create()).
 */

import { useState, useEffect } from "react";
import { FiUser, FiLoader } from "react-icons/fi";
import { createPersonnel, getRoles, RoleOption } from "../api/personnel.api";

interface AddPersonnelFormProps {
  onCancel?: () => void;
  /** Called after a successful create so the parent list can refresh */
  onSuccess?: () => void;
}

export default function AddPersonnelForm({
  onCancel,
  onSuccess,
}: AddPersonnelFormProps) {
  // ── Form state ──────────────────────────────────────────────────────────
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState("");

  // ── Roles dropdown ───────────────────────────────────────────────────────
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [rolesError, setRolesError] = useState<string | null>(null);

  // ── Submission state ─────────────────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // ── Load roles on mount ──────────────────────────────────────────────────
  useEffect(() => {
    let active = true;

    getRoles()
      .then((data) => {
        if (active) {
          setRoles(data);
          setRolesLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setRolesError("Could not load roles. Please close and try again.");
          setRolesLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  // ── Client-side validation ───────────────────────────────────────────────
  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = "Name is required.";
    if (!email.trim()) errors.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errors.email = "Enter a valid email address.";
    if (!roleId) errors.roleId = "Please select a role.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Submit handler ───────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      await createPersonnel({ name: name.trim(), email: email.trim(), role_id: roleId });
      // Notify parent to refresh the personnel list, then close
      onSuccess?.();
      onCancel?.();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";

      // Surface duplicate-email conflict as a field-level error
      if (message.toLowerCase().includes("already exists")) {
        setFieldErrors((prev) => ({ ...prev, email: message }));
      } else {
        setSubmitError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-lg shadow-lg w-full max-w-[360px]">
      <div className="px-6 pt-6 pb-5">
        {/* Title */}
        <div className="flex items-center gap-2 mb-6">
          <FiUser className="w-[18px] h-[18px] text-gray-700" />
          <h2 className="title-small text-gray-900">Add Personnel</h2>
        </div>

        {/* Generic error banner */}
        {submitError && (
          <div className="mb-4 px-3 py-2 rounded-md bg-danger/10 text-danger body-xsmall">
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Name */}
          <div>
            <input
              id="add-personnel-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setFieldErrors((prev) => ({ ...prev, name: "" }));
              }}
              placeholder="Name"
              className={`w-full px-0 py-2 body-small text-gray-900 placeholder:text-gray-400 border-0 border-b focus:ring-0 outline-none bg-transparent transition-colors ${
                fieldErrors.name
                  ? "border-danger focus:border-danger"
                  : "border-gray-300 focus:border-gray-900"
              }`}
              disabled={isSubmitting}
            />
            {/* Reserve space for inline error to prevent layout shift */}
            <p className="min-h-[16px] body-xsmall text-danger mt-0.5">
              {fieldErrors.name ?? ""}
            </p>
          </div>

          {/* Email */}
          <div>
            <input
              id="add-personnel-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setFieldErrors((prev) => ({ ...prev, email: "" }));
              }}
              placeholder="Email"
              className={`w-full px-0 py-2 body-small text-gray-900 placeholder:text-gray-400 border-0 border-b focus:ring-0 outline-none bg-transparent transition-colors ${
                fieldErrors.email
                  ? "border-danger focus:border-danger"
                  : "border-gray-300 focus:border-gray-900"
              }`}
              disabled={isSubmitting}
            />
            <p className="min-h-[16px] body-xsmall text-danger mt-0.5">
              {fieldErrors.email ?? ""}
            </p>
          </div>

          {/* Role — populated from GET /api/roles */}
          <div className="relative">
            {rolesError ? (
              <p className="body-xsmall text-danger">{rolesError}</p>
            ) : (
              <>
                <select
                  id="add-personnel-role"
                  value={roleId}
                  onChange={(e) => {
                    setRoleId(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, roleId: "" }));
                  }}
                  className={`w-full px-0 py-2 body-small text-gray-900 border-0 border-b focus:ring-0 outline-none bg-transparent appearance-none cursor-pointer transition-colors disabled:text-gray-400 ${
                    fieldErrors.roleId
                      ? "border-danger"
                      : "border-gray-300 focus:border-gray-900"
                  }`}
                  disabled={isSubmitting || rolesLoading}
                >
                  <option value="" disabled>
                    {rolesLoading ? "Loading roles…" : "Role"}
                  </option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {/* Display in Title Case */}
                      {r.name.charAt(0).toUpperCase() + r.name.slice(1)}
                    </option>
                  ))}
                </select>
                <svg
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </>
            )}
            <p className="min-h-[16px] body-xsmall text-danger mt-0.5">
              {fieldErrors.roleId ?? ""}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-5 py-2 body-small font-medium text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || rolesLoading}
              className="flex items-center gap-2 px-6 py-2 body-small font-semibold text-primary-foreground bg-primary hover:bg-primary-hover rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting && (
                <FiLoader className="w-3.5 h-3.5 animate-spin shrink-0" />
              )}
              {isSubmitting ? "Adding…" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
