// frontend/src/hooks/useAuth.ts - CORREGIDO
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { authService, BackendUser } from '@/services/authService';

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [user, setUser] = useState<BackendUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkAuth = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (status === 'loading') {
        return;
      }

      if (status === 'unauthenticated') {
        console.log('🔐 No autenticado');
        setUser(null);
        setLoading(false);
        return;
      }

      if (session?.user?.email) {
        console.log('🔐 Usuario autenticado, verificando con backend:', session.user.email);
        
        try {
          const backendUser = await authService.verifyUserInBackend(
            session.user.email, 
            session.user.name
          );
          
          setUser(backendUser);
          console.log('✅ Usuario verificado:', backendUser);
        } catch (error: any) {
          console.error('❌ Error verificando usuario:', error);
          
          if (error.message === 'EMAIL_NOT_AUTHORIZED') {
            setError('EMAIL_NOT_AUTHORIZED');
            router.push('/unauthorized');
          } else {
            setError(error.message);
          }
        }
      }
    } finally {
      setLoading(false);
    }
  }, [session, status, router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    user,
    loading: loading || status === 'loading',
    error,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isTechnician: user?.role === 'technician' || user?.role === 'admin',
    refresh: async () => {
      authService.clearCache(session?.user?.email);
      setUser(null);
      await checkAuth();
    }
  };
}