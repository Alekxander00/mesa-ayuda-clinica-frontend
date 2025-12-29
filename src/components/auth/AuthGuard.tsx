// frontend/src/components/auth/AuthGuard.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useApi } from '@/hooks/useApi';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  redirectTo?: string;
}

export default function AuthGuard({ 
  children, 
  allowedRoles = [], 
  redirectTo = '/unauthorized' 
}: AuthGuardProps) {
  const { data: session, status } = useSession();
  const { backendUser, isAuthorized } = useApi();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (status === 'loading') return;

      // Si no hay sesión, redirigir a login
      if (!session) {
        console.log('🔐 No hay sesión, redirigiendo a login');
        router.push('/login');
        return;
      }

      // Si ya sabemos que no está autorizado, redirigir
      if (isAuthorized === false) {
        console.log('🚫 Usuario no autorizado en backend');
        router.push(redirectTo);
        return;
      }

      // Verificar roles si se especificaron
      if (allowedRoles.length > 0) {
        const userRole = backendUser?.role || session.user?.role;
        if (!userRole || !allowedRoles.includes(userRole)) {
          console.log(`🔐 Rol ${userRole} no permitido, redirigiendo...`);
          router.push(redirectTo);
          return;
        }
      }

      setIsChecking(false);
    };

    checkAuth();
  }, [session, status, isAuthorized, backendUser, allowedRoles, router, redirectTo]);

  if (status === 'loading' || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  if (!session || isAuthorized === false) {
    return null;
  }

  return <>{children}</>;
}