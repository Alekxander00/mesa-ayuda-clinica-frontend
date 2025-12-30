// frontend/src/hooks/usePermissions.ts - VERSIÓN COMPATIBLE
'use client';

import { useAuth } from './useAuth';
import { useSession } from 'next-auth/react';
import { useMemo } from 'react';

export function usePermissions() {
  const { user } = useAuth();
  const { data: session } = useSession();

  const permissions = useMemo(() => {
    // Prioridad: usuario de useAuth (backend) > sesión de NextAuth
    const effectiveUser = user || session?.user;
    const effectiveRole = user?.role || session?.user?.role || 'user';

    return {
      // Roles (los que ya tenías)
      isAdmin: effectiveRole === 'admin',
      isTechnician: effectiveRole === 'technician' || effectiveRole === 'admin',
      isUser: effectiveRole === 'user',
      isAuditor: effectiveRole === 'auditor',
      
      // Permisos específicos (los que ya tenías)
      canViewAllTickets: effectiveRole === 'admin' || effectiveRole === 'technician' || effectiveRole === 'auditor',
      canEditTickets: effectiveRole === 'admin' || effectiveRole === 'technician',
      canDeleteTickets: effectiveRole === 'admin',
      canChangePriority: effectiveRole === 'admin' || effectiveRole === 'technician',
      canChangeStatus: effectiveRole === 'admin' || effectiveRole === 'technician',
      canAssignTickets: effectiveRole === 'admin' || effectiveRole === 'technician',
      canUploadFiles: true,
      canViewReports: effectiveRole === 'admin' || effectiveRole === 'auditor',
      
      // Usuario
      user: effectiveUser,
      role: effectiveRole,
      email: effectiveUser?.email,
      
      // Mantener compatibilidad con componentes existentes
      hasRole: (requiredRole: string) => effectiveRole === requiredRole,
      hasAnyRole: (roles: string[]) => roles.includes(effectiveRole),
      isAuthenticated: !!effectiveUser,
    };
  }, [user, session]);

  return permissions;
}