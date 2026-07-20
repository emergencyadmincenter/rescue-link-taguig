import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/server-auth";
import { AuthProvider } from "@/providers/AuthProvider";
import { IncomingCallProvider } from "@/providers/IncomingCallProvider";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const user = await getUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <AuthProvider user={user}>
      <IncomingCallProvider>
        {children}
      </IncomingCallProvider>
    </AuthProvider>
  );
}
