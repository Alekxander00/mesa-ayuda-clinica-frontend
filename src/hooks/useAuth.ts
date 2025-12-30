// frontend/src/hooks/useAuth.ts - VERSIÓN DEFINITIVA
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
          
          // Guardar en localStorage para persistencia
          if (typeof window !== 'undefined') {
            localStorage.setItem('backend-user', JSON.stringify(backendUser));
          }
        } catch (error: any) {
          console.error('❌ Error verificando usuario:', error);
          
          if (error.message === 'EMAIL_NOT_AUTHORIZED') {
            setError('EMAIL_NOT_AUTHORIZED');
            // Limpiar localStorage si hay error
            if (typeof window !== 'undefined') {
              localStorage.removeItem('backend-user');
            }
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
    // Intentar cargar usuario desde localStorage primero
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('backend-user');
      if (savedUser && !user && !loading) {
        try {
          const parsedUser = JSON.parse(savedUser);
          console.log('📂 Cargando usuario desde localStorage:', parsedUser.email);
          setUser(parsedUser);
          setLoading(false);
          return;
        } catch (e) {
          console.error('Error cargando usuario desde localStorage:', e);
        }
      }
    }

    checkAuth();
  }, [checkAuth, user, loading]);

  // Escuchar cambios en la sesión
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.email && !user) {
      console.log('🔄 Sesión cambió, verificando usuario...');
      checkAuth();
    }
  }, [status, session, user, checkAuth]);

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
      if (typeof window !== 'undefined') {
        localStorage.removeItem('backend-user');
      }
      await checkAuth();
    }
  };
}