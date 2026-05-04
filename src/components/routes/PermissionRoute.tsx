import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { Permission } from '../../types/permissions';

interface PermissionRouteProps {
  permission: Permission;
  children: React.ReactNode;
  redirectTo?: string;
}

export const PermissionRoute: React.FC<PermissionRouteProps> = ({
  permission,
  children,
  redirectTo = '/dashboard',
}) => {
  const { hasPermission, loading, permissionsReady, currentUser } = useAuth();

  if (loading || !permissionsReady) return null;
  if (!currentUser) return <Navigate to="/login" replace />;
  if (!hasPermission(permission)) return <Navigate to={redirectTo} replace />;

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
