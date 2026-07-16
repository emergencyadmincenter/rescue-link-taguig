import { Metadata } from "next";
import { DashboardPageView } from "@/features/dashboard/components/dashboard-page-view";

export const metadata: Metadata = {
  title: "Dashboard - Rescue Link Taguig",
  description: "Overview of system status, logs, and resources.",
};

export default function DashboardPage() {
  return (
    <DashboardPageView />
  );
}
