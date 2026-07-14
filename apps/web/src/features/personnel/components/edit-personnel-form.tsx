"use client";

import { useState } from "react";
import { FiEdit2 } from "react-icons/fi";

const ROLES = ["Admin", "Dispatcher", "Responder", "Coordinator"];

interface EditPersonnelFormProps {
  initialName?: string;
  initialEmail?: string;
  initialRole?: string;
  onCancel?: () => void;
  onSave?: (data: { name: string; email: string; role: string }) => void;
}

export default function EditPersonnelForm({ 
  initialName = "", 
  initialEmail = "", 
  initialRole = "", 
  onCancel,
  onSave
}: EditPersonnelFormProps) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [role, setRole] = useState(initialRole);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !role) return;

    setIsSubmitting(true);

    // TODO (RLT-xx): wire up PATCH /api/personnel/:id when that endpoint is built.
    // For now, call onSave with the local values so the UI can reflect the changes
    // optimistically. The data will not persist until the API is connected.
    onSave?.({ name, email, role });
    onCancel?.();

    setIsSubmitting(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg w-full max-w-[360px]">
      <div className="px-6 pt-6 pb-5">
        {/* Title */}
        <div className="flex items-center gap-2 mb-6">
          <FiEdit2 className="w-[16px] h-[16px] text-gray-700" />
          <h2 className="title-small text-gray-900">Edit Personnel</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              className="w-full px-0 py-2 body-small text-gray-900 placeholder:text-gray-400 border-0 border-b border-gray-300 focus:border-gray-900 focus:ring-0 outline-none bg-transparent transition-colors"
              required
            />
          </div>

          {/* Email */}
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full px-0 py-2 body-small text-gray-900 placeholder:text-gray-400 border-0 border-b border-gray-300 focus:border-gray-900 focus:ring-0 outline-none bg-transparent transition-colors"
              required
            />
          </div>

          {/* Role */}
          <div className="relative">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-0 py-2 body-small text-gray-900 border-0 border-b border-gray-300 focus:border-gray-900 focus:ring-0 outline-none bg-transparent appearance-none cursor-pointer transition-colors"
              required
            >
              <option value="" disabled>Coordinator</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <svg className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2 body-small font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 body-small font-semibold text-success-foreground bg-success hover:bg-success-hover rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
