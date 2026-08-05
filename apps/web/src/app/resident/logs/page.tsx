import React from "react";
import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";
import { LandingHeader } from "@/features/landing/components/LandingHeader";
import { LandingFooter } from "@/features/landing/components/LandingFooter";
import { ResidentMyLogsSection } from "@/features/landing/components/ResidentMyLogsSection";
import { LocationBanner } from "@/features/landing/components/LocationBanner";

export default function ResidentLogsPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans overflow-x-hidden w-full max-w-full">
      <LocationBanner />
      <LandingHeader />

      <main className="flex-1 flex flex-col items-center pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-7xl">
          <div className="mb-6 flex">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm hover:shadow-md"
            >
              <FiArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-auto h-[500px]">
            <ResidentMyLogsSection standalone={true} />
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
