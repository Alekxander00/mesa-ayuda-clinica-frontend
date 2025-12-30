// frontend/src/hooks/usePermissions.ts - VERSIÓN OPTIMIZADA
'use client';

import { useApi } from './useApi';
import { useSession } from 'next-auth/react';
import { useMemo } from 'react';

export function usePermissions() {
  const { session, backendUser } = useApi();
  const { data: nextAuthSession } = useSession();

  // ✅ USAR useMemo PARA EVITAR OBJETOS NUEVOS EN CADA RENDER
  const permissions = useMemo(() => {
    // Prioridad: backendUser > session > nextAuthSession
    const effectiveRole = backendUser?.role || session?.user?.role || nextAuthSession?.user?.role || 'user';
    const effectiveUser = backendUser || session?.user || nextAuthSession?.user;

    return {
      // Roles
      isAdmin: effectiveRole === 'admin',
      isTechnician: effectiveRole === 'technician' || effectiveRole === 'admin',
      isUser: effectiveRole === 'user',
      isAuditor: effectiveRole === 'auditor',
      
      // Permisos específicos
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
      email: effectiveUser?.email
    };
  }, [backendUser, session, nextAuthSession]); // ✅ SOLO se recalcula cuando cambian estas dependencias

  return permissions;
}