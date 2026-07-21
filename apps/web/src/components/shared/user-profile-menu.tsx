"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiUser } from "react-icons/fi";
import { useAuth } from "@/providers/AuthProvider";

export function UserProfileMenu() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-300 hover:text-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 shrink-0"
        aria-label="User menu"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <FiUser className="w-[16px] h-[16px]" />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50 animate-fade-in origin-top-right"
          role="menu"
        >
          <div className="px-4 py-3 border-b border-gray-50">
            <p className="body-small font-medium text-gray-900 truncate">
              {user?.name || "User"}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.email || ""}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
