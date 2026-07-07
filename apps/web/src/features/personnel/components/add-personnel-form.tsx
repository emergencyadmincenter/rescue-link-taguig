"use client";

import { useState } from "react";
import { FiUser } from "react-icons/fi";

const ROLES = ["Admin", "Dispatcher", "Responder", "Coordinator"];

interface AddPersonnelFormProps {
  onCancel?: () => void;
}

export default function AddPersonnelForm({ onCancel }: AddPersonnelFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !role) return;

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setName("");
      setEmail("");
      setRole("");
      onCancel?.();
    }, 1500);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg w-full max-w-[360px]">
      <div className="px-6 pt-6 pb-5">
        {/* Title */}
        <div className="flex items-center gap-2 mb-6">
          <FiUser className="w-[18px] h-[18px] text-gray-700" />
          <h2 className="text-[15px] font-bold text-gray-900">Add Personnel</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              className="w-full px-0 py-2 text-[14px] text-gray-900 placeholder:text-gray-400 border-0 border-b border-gray-300 focus:border-gray-900 focus:ring-0 outline-none bg-transparent transition-colors"
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
              className="w-full px-0 py-2 text-[14px] text-gray-900 placeholder:text-gray-400 border-0 border-b border-gray-300 focus:border-gray-900 focus:ring-0 outline-none bg-transparent transition-colors"
              required
            />
          </div>

          {/* Role */}
          <div className="relative">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-0 py-2 text-[14px] text-gray-900 border-0 border-b border-gray-300 focus:border-gray-900 focus:ring-0 outline-none bg-transparent appearance-none cursor-pointer transition-colors"
              required
            >
              <option value="" disabled>Role</option>
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
              className="px-5 py-2 text-[13px] font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 text-[13px] font-semibold text-white bg-[#e11d48] hover:bg-[#be123c] rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Adding..." : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
