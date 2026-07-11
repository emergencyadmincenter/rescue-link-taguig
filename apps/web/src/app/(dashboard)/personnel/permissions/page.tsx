import { PermissionManager } from '@/features/permissions/components/PermissionManager';

export const metadata = {
  title: 'Permission Management | RescueLink Taguig',
};

export default function PermissionsPage() {
  return (
    <div className="p-4 md:p-6 lg:p-8 h-full">
      <PermissionManager />
    </div>
  );
}
