// frontend/src/hooks/useApi.ts - VERSIÓN OPTIMIZADA
'use client';

import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useState, useRef } from 'react';

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
  const [backendUser, setBackendUser] = useState<BackendUser | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncAttempted = useRef(false); // ✅ EVITA SINCronizaciones múltiples

  const syncUserWithBackend = useCallback(async (force = false) => {
    // ✅ PREVENIR múltiples sincronizaciones simultáneas
    if (!session?.user?.email || (isSyncing && !force) || syncAttempted.current) return;
    
    syncAttempted.current = true;
    setIsSyncing(true);
    
    try {
      console.log('🔄 Sincronizando usuario con backend...', session.user.email);
      const baseURL = process.env.NEXT_PUBLIC_API_URL || 'https://mesa-ayuda-clinica-backend-production.up.railway.app/api';
      
      const response = await fetch(`${baseURL}/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': session.user.email,
        },
        body: JSON.stringify({
          email: session.user.email,
          name: session.user.name,
        }),
      });

      console.log('📡 Response status:', response.status);
      
      if (response.ok) {
        const userData: BackendUser = await response.json();
        
        // ✅ ACTUALIZAR SOLO SI HAY CAMBIOS REALES
        setBackendUser(prev => {
          if (JSON.stringify(prev) === JSON.stringify(userData)) return prev;
          return userData;
        });
        
        console.log('✅ Usuario sincronizado con backend:', userData);
        
        // ✅ ACTUALIZAR SESIÓN SOLO SI EL ROL CAMBIÓ
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
        const errorText = await response.text();
        console.error('❌ Error en respuesta del backend:', response.status, errorText);
      }
    } catch (error) {
      console.error('❌ Error sincronizando usuario:', error);
    } finally {
      setIsSyncing(false);
      // NO resetear syncAttempted aquí para prevenir loops
    }
    return null;
  }, [session, update, isSyncing]);

  // ✅ Sincronización MÁS CONSERVADORA - solo una vez al montar
  useEffect(() => {
    if (session?.user?.email && !backendUser && !syncAttempted.current) {
      console.log('🎯 Iniciando sincronización automática...');
      syncUserWithBackend();
      
      // ✅ LIMPIAR el flag después de un tiempo para permitir re-sincronizaciones manuales
      const timer = setTimeout(() => {
        syncAttempted.current = false;
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [session, backendUser, syncUserWithBackend]);

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
    isSyncing,
    refetchUser: () => {
      syncAttempted.current = false;
      return syncUserWithBackend(true);
    },
    forceSync: () => {
      setBackendUser(null);
      syncAttempted.current = false;
      return syncUserWithBackend(true);
    }
  };
}