import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { currentUser, loading, isAdmin } = useAuth();

  if (loading) {
    // Show a loading spinner or placeholder
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  if (!currentUser) {
    // Redirect to login page if user is not logged in
    return <Navigate to="/login" />;
  }

  if (!isAdmin()) {
    // Redirect to dashboard if user is not an admin
    return <Navigate to="/dashboard" />;
  }

  // If user is logged in and is an admin, render the protected component
  return <>{children}</>;
};

export default AdminRoute;