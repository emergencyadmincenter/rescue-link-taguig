import { PermissionManager } from '@/features/permissions/components/PermissionManager';
import { getUser } from "@/lib/server-auth";
import { Unauthorized } from "@/components/shared/unauthorized";

export const metadata = {
  title: 'Permission Management | RescueLink Taguig',
};

export default async function PermissionsPage() {
  const user = await getUser();
  
  if (!user || !user.roles.includes('admin')) {
    return <Unauthorized />;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 h-full">
      <PermissionManager />
    </div>
  );
}
