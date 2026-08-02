import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children, requireSuperAdmin = false }) => {
  const { isAuthenticated, userRole } = useContext(AuthContext);

  if (!isAuthenticated) {
    return <Navigate to="/admin" />;
  }

  if (requireSuperAdmin && userRole !== 'super_admin') {
    return <Navigate to="/admin/dashboard" />;
  }

  return children;
};

export default ProtectedRoute;
