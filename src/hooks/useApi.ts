// frontend/src/hooks/useApi.ts - ACTUALIZAR
'use client';

import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export interface BackendUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'technician' | 'user' | 'auditor';
  department?: string;
  specialization?: string;
}

export function useApi() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [backendUser, setBackendUser] = useState<BackendUser | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const syncAttempted = useRef(false);

  const checkBackendAuthorization = useCallback(async (email: string): Promise<BackendUser | null> => {
    try {
      console.log('🔐 Verificando autorización en backend para:', email);
      const baseURL = process.env.NEXT_PUBLIC_API_URL || 'https://mesa-ayuda-clinica-backend-production.up.railway.app/api';
      
      const response = await fetch(`${baseURL}/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': email,
        },
        body: JSON.stringify({
          email: email,
          name: session?.user?.name,
        }),
      });

      console.log('📡 Response status:', response.status);
      
      if (response.status === 403) {
        console.log('❌ Usuario no autorizado (403)');
        setIsAuthorized(false);
        return null;
      }
      
      if (response.ok) {
        const userData: BackendUser = await response.json();
        console.log('✅ Usuario autorizado:', userData);
        setIsAuthorized(true);
        return userData;
      } else {
        console.error('❌ Error en respuesta del backend:', response.status);
        setIsAuthorized(false);
        return null;
      }
    } catch (error) {
      console.error('❌ Error verificando autorización:', error);
      setIsAuthorized(false);
      return null;
    }
  }, [session]);

  const syncUserWithBackend = useCallback(async (force = false) => {
    if (!session?.user?.email || (isSyncing && !force) || syncAttempted.current) return;
    
    syncAttempted.current = true;
    setIsSyncing(true);
    
    try {
      const userData = await checkBackendAuthorization(session.user.email);
      
      if (userData) {
        setBackendUser(prev => {
          if (JSON.stringify(prev) === JSON.stringify(userData)) return prev;
          return userData;
        });
        
        if (update && userData.role !== session.user.role) {
          console.log('🔄 Actualizando sesión NextAuth con nuevo rol:', userData.role);
          await update({
            user: {
              ...session.user,
              role: userData.role,
              id: userData.id,
            }
          });
        }
        return userData;
      } else {
        // Usuario no autorizado en backend
        console.log('🚫 Usuario no autorizado, redirigiendo...');
        return null;
      }
    } catch (error) {
      console.error('❌ Error sincronizando usuario:', error);
      return null;
    } finally {
      setIsSyncing(false);
    }
  }, [session, update, checkBackendAuthorization, isSyncing]);

  // Efecto para verificar autorización al cargar
  useEffect(() => {
    if (session?.user?.email && !backendUser && !syncAttempted.current) {
      console.log('🎯 Verificando autorización inicial...');
      syncUserWithBackend();
      
      const timer = setTimeout(() => {
        syncAttempted.current = false;
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [session, backendUser, syncUserWithBackend]);

  // Efecto para redirigir si no está autorizado
  useEffect(() => {
    if (isAuthorized === false && session?.user?.email) {
      console.log('🚫 Usuario no autorizado, redirigiendo a /unauthorized');
      router.push('/unauthorized');
    }
  }, [isAuthorized, session, router]);

  const apiRequest = useCallback(async (url: string, options: RequestInit = {}) => {
    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'https://mesa-ayuda-clinica-backend-production.up.railway.app/api';
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (session?.user?.email) {
      headers['x-user-email'] = session.user.email;
    }

    try {
      const response = await fetch(`${baseURL}${url}`, {
        ...options,
        headers,
      });

      if (response.status === 403) {
        console.log('🔒 Acceso denegado (403) para:', url);
        setIsAuthorized(false);
        throw new Error('Acceso denegado');
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error('❌ useApi - Error:', error);
      throw error;
    }
  }, [session]);

  const get = useCallback((url: string) => apiRequest(url, { method: 'GET' }), [apiRequest]);
  const post = useCallback((url: string, data: any) => 
    apiRequest(url, { method: 'POST', body: JSON.stringify(data) }), [apiRequest]);
  const put = useCallback((url: string, data: any) => 
    apiRequest(url, { method: 'PUT', body: JSON.stringify(data) }), [apiRequest]);
  const del = useCallback((url: string) => 
    apiRequest(url, { method: 'DELETE' }), [apiRequest]);

  return { 
    get, 
    post, 
    put, 
    del, 
    session,
    backendUser: backendUser || {
      id: session?.user?.id || '',
      name: session?.user?.name || '',
      email: session?.user?.email || '',
      role: (session?.user?.role as any) || 'user'
    },
    isAuthorized,
    isSyncing,
    refetchUser: () => {
      syncAttempted.current = false;
      return syncUserWithBackend(true);
    },
    forceSync: () => {
      setBackendUser(null);
      setIsAuthorized(null);
      syncAttempted.current = false;
      return syncUserWithBackend(true);
    }
  };
}