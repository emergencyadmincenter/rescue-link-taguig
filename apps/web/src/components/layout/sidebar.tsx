"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiFileText, FiBarChart2 } from "react-icons/fi";
import { HiOutlineViewGrid, HiOutlineUserGroup } from "react-icons/hi";
import { TiWeatherPartlySunny } from "react-icons/ti";
import { useAuth } from "@/providers/AuthProvider";
import { signOut } from "@/features/auth/api/auth.api";
import { FiLogOut } from "react-icons/fi";

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  roles?: string[]; // If undefined, accessible by all
};

const NAVIGATION: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: HiOutlineViewGrid,
    // Accessible by all authenticated users
  },
  {
    label: "Logs",
    href: "/logs",
    icon: FiFileText,
    roles: ["coordinator", "admin"],
  },
  {
    label: "Weather",
    href: "/weather",
    icon: TiWeatherPartlySunny,
    roles: ["coordinator", "admin"],
  },
  {
    label: "Personnel",
    href: "/personnel",
    icon: HiOutlineUserGroup,
    roles: ["admin"], // Only Admin
  },
  {
    label: "Insights",
    href: "/insights",
    icon: FiBarChart2,
    roles: ["admin", "coordinator"],
  },
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname() || "";
  const { user } = useAuth();
  const toggleSidebar = () => setIsCollapsed((prev) => !prev);

  // Check if a nav item is active (either directly or via a child route)
  const isItemActive = (href: string) => {
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.warn("Logout API failed, continuing with client logout.", error);
    } finally {
      window.location.href = "/sign-in";
    }
  };

  return (
    <aside
      className={`bg-white border-r border-gray-100 flex flex-col pt-4 shrink-0 transition-all duration-300 ease-in-out ${
        isCollapsed ? "w-[68px]" : "w-[240px]"
      }`}
    >
      <div
        className={`flex mb-3 px-4 transition-all duration-300 ${isCollapsed ? "justify-center" : "justify-end"}`}
      >
        <button
          onClick={toggleSidebar}
          className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1.5 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`transition-transform duration-300 ease-in-out ${isCollapsed ? "rotate-180" : ""}`}
          >
            <path
              d="M15 18L9 12L15 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M11 18L5 12L11 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <nav className="flex flex-col mt-1 flex-1 overflow-y-auto overflow-x-hidden px-2 gap-1 pb-4">
        {NAVIGATION.filter(
          (item) =>
            !item.roles ||
            (user?.roles && item.roles.some((r) => user.roles.includes(r))),
        ).map((item) => (
          <SidebarItem
            key={item.href}
            item={item}
            isCollapsed={isCollapsed}
            isActive={isItemActive(item.href)}
          />
        ))}
      </nav>

      <div className="p-2 mt-auto border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-danger hover:bg-danger/10 transition-all duration-200 ease-in-out group"
          title={isCollapsed ? "Logout" : undefined}
        >
          <FiLogOut className="w-5 h-5 shrink-0" />
          {!isCollapsed && (
            <span className="body-medium font-medium">Logout</span>
          )}
        </button>
      </div>
    </aside>
  );
}

function SidebarItem({
  item,
  isCollapsed,
  isActive,
}: {
  item: NavItem;
  isCollapsed: boolean;
  isActive: boolean;
}) {
  const Icon = item.icon;

  return (
    <div className="flex flex-col relative group">
      <Link
        href={item.href}
        className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 ease-in-out group ${
          isActive
            ? "bg-primary-subtle text-primary"
            : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
        }`}
        title={isCollapsed ? item.label : undefined}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <Icon
            className={`w-5 h-5 shrink-0 transition-colors duration-200 ${isActive ? "text-primary" : "text-gray-400 group-hover:text-gray-600"}`}
          />
          {!isCollapsed && (
            <span
              className={`body-medium truncate font-medium transition-colors duration-200 ${isActive ? "text-primary" : ""}`}
            >
              {item.label}
            </span>
          )}
        </div>
      </Link>
    </div>
  );
}
