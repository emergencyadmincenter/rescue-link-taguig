import WeatherPageView from "@/features/weather/components/WeatherPageView";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Weather Monitoring | Rescue Link Taguig",
  description: "Real-time weather conditions across all Taguig City barangays.",
};

export default function WeatherPage() {
  return <WeatherPageView />;
}
