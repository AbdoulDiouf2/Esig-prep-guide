import { useAuth } from '../contexts/AuthContext';
import type { Permission } from '../types/permissions';

export function usePermission(permission: Permission): boolean {
  const { hasPermission } = useAuth();
  return hasPermission(permission);
}

export function usePermissions(permissionList: Permission[]): Record<string, boolean> {
  const { hasPermission } = useAuth();
  return Object.fromEntries(permissionList.map(p => [p, hasPermission(p)]));
}
