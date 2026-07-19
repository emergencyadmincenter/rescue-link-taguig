import { PrismaService } from '../../src/database/prisma/prisma.service';
type PermissionRecord = { id: string; name: string; resource: string; action: string };

const ALL_PERMISSIONS = [
  // Users
  { resource: 'users', action: 'view' },
  { resource: 'users', action: 'create' },
  { resource: 'users', action: 'update' },
  { resource: 'users', action: 'delete' },
  // Logs
  { resource: 'logs', action: 'view' },
  { resource: 'logs', action: 'create' },
  { resource: 'logs', action: 'update' },
  { resource: 'logs', action: 'assign' },
  { resource: 'logs', action: 'resolve' },
  // Calls
  { resource: 'calls', action: 'view' },
  { resource: 'calls', action: 'manage' },
  // Messages
  { resource: 'messages', action: 'view' },
  { resource: 'messages', action: 'create' },
];

export async function seedPermissions(prisma: PrismaService) {
  console.log('Seeding permissions...');

  // 1. Create all default permissions if they don't exist
  const permissionRecords: PermissionRecord[] = [];
  for (const p of ALL_PERMISSIONS) {
    const name = `${p.resource}:${p.action}`;
    const record = await prisma.permission.upsert({
      where: { name },
      update: {},
      create: {
        name,
        resource: p.resource,
        action: p.action,
        description: `Allows ${p.action} on ${p.resource}`,
      },
    });
    permissionRecords.push(record);
  }
  console.log(`✅ ${permissionRecords.length} permissions seeded`);

  // 2. Fetch built-in roles
  const roles = await prisma.role.findMany({
    where: {
      name: { in: ['admin', 'coordinator', 'resident'] },
    },
  });

  const adminRole = roles.find((r) => r.name === 'admin');
  const coordinatorRole = roles.find((r) => r.name === 'coordinator');
  const residentRole = roles.find((r) => r.name === 'resident');

  // 3. Define assignments
  const adminPermissions = permissionRecords; // Admin gets everything
  
  const coordinatorPermissions = permissionRecords.filter((p) => {
    return (
      (p.resource === 'logs' && ['view', 'create', 'update', 'assign', 'resolve'].includes(p.action)) ||
      (p.resource === 'calls' && ['view', 'manage'].includes(p.action)) ||
      (p.resource === 'messages' && ['view', 'create'].includes(p.action))
    );
  });

  const residentPermissions = permissionRecords.filter((p) => {
    return (
      (p.resource === 'logs' && ['create', 'view'].includes(p.action)) ||
      (p.resource === 'messages' && ['view', 'create'].includes(p.action))
    );
  });

  // 4. Assign permissions to roles idempotently
  const assignPermissions = async (roleId: string, perms: typeof permissionRecords) => {
    for (const p of perms) {
      await prisma.rolePermission.upsert({
        where: {
          role_id_permission_id: {
            role_id: roleId,
            permission_id: p.id,
          },
        },
        update: {},
        create: {
          role_id: roleId,
          permission_id: p.id,
        },
      });
    }
  };

  if (adminRole) {
    await assignPermissions(adminRole.id, adminPermissions);
    console.log(`✅ Admin role provisioned with ${adminPermissions.length} permissions`);
  }

  if (coordinatorRole) {
    await assignPermissions(coordinatorRole.id, coordinatorPermissions);
    console.log(`✅ Coordinator role provisioned with ${coordinatorPermissions.length} permissions`);
  }

  if (residentRole) {
    await assignPermissions(residentRole.id, residentPermissions);
    console.log(`✅ Resident role provisioned with ${residentPermissions.length} permissions`);
  }
}
