import ActivatePageView from "@/features/auth/components/activate-page-view";
import { getUser } from "@/lib/server-auth";
import { redirect } from "next/navigation";

export default async function ActivatePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const user = await getUser();
  if (user) {
    redirect("/dashboard");
  }

  const resolvedSearchParams = await searchParams;
  const token = resolvedSearchParams.token;

  if (!token) {
    return (
      <div className="min-h-screen bg-background-subtle flex items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full">
          <h1 className="title-medium text-danger mb-4">Missing Token</h1>
          <p className="body-medium text-gray-500">
            No activation token was provided in the URL. Please click the exact
            link from your email.
          </p>
        </div>
      </div>
    );
  }

  return <ActivatePageView token={token} />;
}
