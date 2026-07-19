import LogsPageView from "@/features/logs/components/LogsPageView";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Emergency Logs | Rescue Link Taguig",
  description: "Centralized record of logged emergency requests.",
};

export default function LogsPage() {
  return <LogsPageView />;
}
