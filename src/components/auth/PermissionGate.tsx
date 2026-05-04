import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { Permission } from '../../types/permissions';

interface PermissionGateProps {
  permission: Permission;
  children: React.ReactNode;
  redirectTo?: string;
  silent?: boolean;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  permission,
  children,
  redirectTo = '/applications',
  silent = false,
}) => {
  const { hasPermission, loading } = useAuth();
  const navigate = useNavigate();
  const allowed = hasPermission(permission);

  useEffect(() => {
    if (!loading && !allowed) {
      if (!silent) {
        const event = new CustomEvent('permission-denied', {
          detail: { permission, redirectTo },
        });
        window.dispatchEvent(event);
      }
      navigate(redirectTo, { replace: true });
    }
  }, [allowed, loading, navigate, permission, redirectTo, silent]);

  if (loading || !allowed) return null;

  return <>{children}</>;
};
