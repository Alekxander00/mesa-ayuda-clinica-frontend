// frontend/src/components/auth/RoleProtected.tsx - NUEVO ARCHIVO
'use client';

import { useSession } from 'next-auth/react';
import { ReactNode } from 'react';

interface RoleProtectedProps {
  children: ReactNode;
  allowedRoles: string[];
  fallback?: ReactNode;
}

export default function RoleProtected({ 
  children, 
  allowedRoles, 
  fallback = null 
}: RoleProtectedProps) {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-gray-500">Cargando...</div>
      </div>
    );
  }

  if (!session) {
    return <>{fallback}</>;
  }

  const userRole = session.user?.role || 'user';
  
  if (!allowedRoles.includes(userRole)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}