// frontend/src/hooks/useApi.ts - VERSIÓN MEJORADA
'use client';

import { useSession } from 'next-auth/react';
import { useAuth } from './useAuth';
import { useRouter } from 'next/navigation';

export function useApi() {
  const { data: session } = useSession();
  const { user, clearAuth } = useAuth();
  const router = useRouter();

  const apiRequest = async (url: string, options: RequestInit = {}) => {
    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'https://mesa-ayuda-clinica-backend-production.up.railway.app/api';
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Agregar el email del usuario si está disponible
    const userEmail = session?.user?.email || user?.email;
    if (userEmail) {
      headers['x-user-email'] = userEmail;
    }

    try {
      console.log('🌐 API Request:', url, 'con email:', userEmail);
      const response = await fetch(`${baseURL}${url}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', response.status, errorText);
        
        // Si es un error 403 (no autorizado)
        if (response.status === 403) {
          console.log('🚫 Acceso denegado - Redirigiendo a /unauthorized');
          
          // Limpiar datos de autenticación
          clearAuth();
          
          // Redirigir a página de no autorizado
          router.push('/unauthorized');
          throw new Error('EMAIL_NOT_AUTHORIZED');
        }
        
        // Si es error 401 (no autenticado)
        if (response.status === 401) {
          console.log('🔒 No autenticado - Redirigiendo a /login');
          clearAuth();
          router.push('/login');
          throw new Error('NOT_AUTHENTICATED');
        }
        
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      return response.json();
    } catch (error: any) {
      console.error('❌ useApi - Error:', error);
      
      // Si el error es por acceso no autorizado, ya manejado arriba
      if (error.message === 'EMAIL_NOT_AUTHORIZED') {
        throw error;
      }
      
      // Re-lanzar otros errores
      throw error;
    }
  };

  const get = (url: string) => apiRequest(url, { method: 'GET' });
  const post = (url: string, data: any) => 
    apiRequest(url, { method: 'POST', body: JSON.stringify(data) });
  const put = (url: string, data: any) => 
    apiRequest(url, { method: 'PUT', body: JSON.stringify(data) });
  const del = (url: string) => 
    apiRequest(url, { method: 'DELETE' });

  return { 
    get, 
    post, 
    put, 
    del, 
    session,
    backendUser: user,
    forceSync: () => {}, // Para compatibilidad
  };
}