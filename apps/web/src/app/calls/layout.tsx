import { getUser } from "@/lib/server-auth";
import { AuthProvider } from "@/providers/AuthProvider";

export default async function CallsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  return (
    <AuthProvider user={user}>
      {children}
    </AuthProvider>
  );
}
