// frontend/src/hooks/usePermissions.ts - VERSIÓN MEJORADA
'use client';

import { useAuth } from './useAuth';

export function usePermissions() {
  const { user } = useAuth();

  const hasRole = (requiredRole: string): boolean => {
    return user?.role === requiredRole;
  };

  const hasAnyRole = (roles: string[]): boolean => {
    return roles.includes(user?.role || '');
  };

  const isAdmin = hasRole('admin');
  const isTechnician = hasRole('technician') || isAdmin;
  const isAuditor = hasRole('auditor') || isAdmin;
  const isUser = hasRole('user') || isTechnician || isAuditor || isAdmin;

  return {
    hasRole,
    hasAnyRole,
    isAdmin,
    isTechnician,
    isAuditor,
    isUser,
    userRole: user?.role || 'user',
    isAuthenticated: !!user,
  };
}