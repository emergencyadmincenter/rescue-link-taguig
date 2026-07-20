/**
 * Check if a user has a specific role.
 */
export function hasRole(userRoles: string[], requiredRole: string): boolean {
  return userRoles.includes(requiredRole);
}

/**
 * Check if a user has at least one of the required roles.
 */
export function hasAnyRole(
  userRoles: string[],
  requiredRoles: string[],
): boolean {
  return requiredRoles.some((role) => userRoles.includes(role));
}

/**
 * Check if a user has a specific permission (resource + action pair).
 */
export function hasPermission(
  permissions: { resource: string; action: string }[],
  resource: string,
  action: string,
): boolean {
  return permissions.some(
    (perm) => perm.resource === resource && perm.action === action,
  );
}
