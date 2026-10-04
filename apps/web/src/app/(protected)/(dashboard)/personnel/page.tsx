import PersonnelPageView from "@/features/personnel/components/personnel-page-view";
import { getUser } from "@/lib/server-auth";
import { Unauthorized } from "@/components/shared/unauthorized";

export default async function Page() {
  const user = await getUser();

  if (!user || !user.roles.includes("admin")) {
    return <Unauthorized />;
  }

  return <PersonnelPageView />;
}
