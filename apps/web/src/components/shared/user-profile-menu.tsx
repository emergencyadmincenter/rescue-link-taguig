"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiUser, FiLogOut } from "react-icons/fi";
import { signOut } from "@/features/auth/api/auth.api";
import { useAuth } from "@/providers/AuthProvider";

export function UserProfileMenu() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
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

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut();
    } catch (error) {
      // Even if API fails (e.g., session already expired), we still want to log them out locally
      console.warn("Logout API failed, continuing with client logout.", error);
    } finally {
      setIsLoggingOut(false);
      setIsOpen(false);

      // Force a hard navigation to clear all client-side state
      window.location.href = "/sign-in";
    }
  };

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

          <div className="py-1">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full text-left px-4 py-2 body-small text-danger hover:bg-red-50 flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              role="menuitem"
            >
              {isLoggingOut ? (
                <>
                  <svg
                    className="animate-spin w-4 h-4 text-danger"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Logging out...
                </>
              ) : (
                <>
                  <FiLogOut className="w-[16px] h-[16px]" />
                  Logout
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
