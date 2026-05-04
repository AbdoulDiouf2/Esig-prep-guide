import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { Permission } from '../../types/permissions';
import { useEffect, useRef } from 'react';

interface PermissionRouteProps {
  permission: Permission;
  children: React.ReactNode;
  redirectTo?: string;
}

export const PermissionRoute: React.FC<PermissionRouteProps> = ({
  permission,
  children,
  redirectTo = '/applications',
}) => {
  const { hasPermission, loading, permissionsReady, currentUser } = useAuth();
  const location = useLocation();
  const denied = useRef(false);

  const allowed = hasPermission(permission);

  useEffect(() => {
    if (!loading && permissionsReady && currentUser && !allowed && !denied.current) {
      denied.current = true;
      window.dispatchEvent(new CustomEvent('permission-denied', {
        detail: { permission, redirectTo, from: location.pathname },
      }));
    }
  }, [loading, permissionsReady, currentUser, allowed, permission, redirectTo, location.pathname]);

  if (loading || !permissionsReady) return null;
  if (!currentUser) return <Navigate to="/login" replace />;
  if (!allowed) return <Navigate to={redirectTo} replace />;

  return <>{children}</>;
};

// Re-exports rétrocompat — wrappent le nouveau système
export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <PermissionRoute permission="admin.dashboard">{children}</PermissionRoute>
);

export const EditorRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <PermissionRoute permission="resources.manage">{children}</PermissionRoute>
);

export const SuperAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <PermissionRoute permission="broadcast.send">{children}</PermissionRoute>
);
