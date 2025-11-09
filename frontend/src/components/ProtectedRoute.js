import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, roles }) {
  const { user } = useContext(AuthContext);

  if (!user) return <Navigate to="/login" />;

  if (roles && !roles.includes(user.role)) return <h1 style={{ textAlign: 'center', marginTop: '50px' }}>Access Denied</h1>;

  return children;
}
