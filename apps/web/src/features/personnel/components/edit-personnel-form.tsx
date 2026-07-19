"use client";

import { useState } from "react";
import { FiEdit2 } from "react-icons/fi";
import { updatePersonnel } from "../api/personnel.api";
import { toast } from "react-hot-toast";

interface EditPersonnelFormProps {
  id: string;
  initialName: string;
  initialEmail: string;
  initialRole: string;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function EditPersonnelForm({ 
  id,
  initialName, 
  initialEmail, 
  initialRole, 
  onCancel,
  onSuccess
}: EditPersonnelFormProps) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email) return;

    setIsSubmitting(true);

    try {
      await updatePersonnel(id, { name, email });
      toast.success(
        email !== initialEmail 
          ? "Personnel updated. New activation email sent." 
          : "Personnel updated successfully"
      );
      onSuccess();
      onCancel();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to update personnel");
    } finally {
      setIsSubmitting(false);
    }
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
            <label className="block body-xsmall text-gray-500 mb-1">Name</label>
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
            <label className="block body-xsmall text-gray-500 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full px-0 py-2 body-small text-gray-900 placeholder:text-gray-400 border-0 border-b border-gray-300 focus:border-gray-900 focus:ring-0 outline-none bg-transparent transition-colors"
              required
            />
          </div>

          {/* Role (Read-only) */}
          <div>
            <label className="block body-xsmall text-gray-500 mb-1">Role</label>
            <input
              type="text"
              value={initialRole}
              readOnly
              className="w-full px-0 py-2 body-small text-gray-500 border-0 border-b border-gray-200 bg-transparent outline-none cursor-not-allowed"
            />
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
