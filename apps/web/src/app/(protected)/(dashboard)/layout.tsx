import { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { FiBell } from "react-icons/fi";
import { UserProfileMenu } from "@/components/shared/user-profile-menu";
import { Sidebar } from "@/components/layout/sidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
        <div className="h-screen bg-background-subtle font-inter text-foreground flex flex-col overflow-hidden">
        {/* ===== Top Navbar ===== */}
        <header className="bg-white border-b border-gray-100 h-[60px] flex items-center justify-between px-6 z-50 relative shrink-0">
          <div className="flex items-center">
            <Link href="/">
              <Image
                src="/images/logos/rlt-cc-logo.png"
                alt="RescueLink Taguig Command Center"
                width={160}
                height={45}
                className="object-contain"
              />
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <button
              className="text-gray-500 hover:text-gray-700 transition-colors p-1"
              aria-label="Notifications"
            >
              <FiBell className="w-[20px] h-[20px]" />
            </button>
            <UserProfileMenu />
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* ===== Sidebar ===== */}
          <Sidebar />

          {/* ===== Main Content Area ===== */}
          <main className="px-5 py-5 flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
  );
}
