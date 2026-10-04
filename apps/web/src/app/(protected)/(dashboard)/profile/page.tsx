import { Metadata } from "next";
import { ProfilePageView } from "@/features/profile/components/profile-page-view";

export const metadata: Metadata = {
  title: "Profile | RescueLink Taguig",
  description: "Manage your profile settings.",
};

export default function ProfilePage() {
  return <ProfilePageView />;
}
