import SignInPageView from "@/features/auth/components/sign-in-page-view";
import { getUser } from "@/lib/server-auth";
import { redirect } from "next/navigation";

export default async function Page() {
  const user = await getUser();
  if (user) {
    redirect("/dashboard");
  }
  return <SignInPageView />;
}
