// Role-Based Access Control System
export type Role = 'super_admin' | 'admin' | 'analyst' | 'viewer';

export interface Permission {
  resource: string;
  actions: string[];
}

// Permission definitions per role
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  super_admin: [
    { resource: '*', actions: ['*'] }, // Full access to everything
  ],
  admin: [
    { resource: 'dashboard', actions: ['view', 'export'] },
    { resource: 'analytics', actions: ['view', 'export', 'create'] },
    { resource: 'transactions', actions: ['view', 'export'] },
    { resource: 'users', actions: ['view', 'create', 'edit', 'delete'] },
    { resource: 'settings', actions: ['view', 'edit'] },
    { resource: 'audit_logs', actions: ['view'] },
  ],
  analyst: [
    { resource: 'dashboard', actions: ['view', 'export'] },
    { resource: 'analytics', actions: ['view', 'export', 'create'] },
    { resource: 'transactions', actions: ['view', 'export'] },
    { resource: 'forecasting', actions: ['view'] },
  ],
  viewer: [
    { resource: 'dashboard', actions: ['view'] },
    { resource: 'analytics', actions: ['view'] },
    { resource: 'transactions', actions: ['view'] },
  ],
};

export function hasPermission(
  userRole: Role,
  resource: string,
  action: string
): boolean {
  const permissions = ROLE_PERMISSIONS[userRole];
  if (!permissions) return false;

  return permissions.some((perm) => {
    const resourceMatch = perm.resource === '*' || perm.resource === resource;
    const actionMatch = perm.actions.includes('*') || perm.actions.includes(action);
    return resourceMatch && actionMatch;
  });
}

export function getRoleHierarchy(role: Role): number {
  const hierarchy: Record<Role, number> = {
    super_admin: 4,
    admin: 3,
    analyst: 2,
    viewer: 1,
  };
  return hierarchy[role] || 0;
}

export function canManageRole(managerRole: Role, targetRole: Role): boolean {
  return getRoleHierarchy(managerRole) > getRoleHierarchy(targetRole);
}
