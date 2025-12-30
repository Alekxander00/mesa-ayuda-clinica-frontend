// frontend/src/hooks/useApi.ts - ACTUALIZADO CON MANEJO DE ERROR 403
'use client';

import { useSession } from 'next-auth/react';
import { useAuth } from './useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function useApi() {
  const { data: session } = useSession();
  const { user } = useAuth();
  const router = useRouter();

  const apiRequest = async (url: string, options: RequestInit = {}) => {
    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'https://mesa-ayuda-clinica-backend-production.up.railway.app/api';
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (session?.user?.email) {
      headers['x-user-email'] = session.user.email;
    }

    try {
      console.log('🌐 API Request:', url);
      const response = await fetch(`${baseURL}${url}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', response.status, errorText);
        
        // Si es un error 403 (no autorizado), redirigir a la página de unauthorized
        if (response.status === 403) {
          console.log('🚫 Acceso denegado - Redirigiendo a /unauthorized');
          router.push('/unauthorized');
          return null; // Detener la ejecución
        }
        
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error('❌ useApi - Error:', error);
      
      // Si el error es por acceso no autorizado, redirigir
      if (error instanceof Error && error.message.includes('403')) {
        console.log('🚫 Error 403 detectado - Redirigiendo a /unauthorized');
        router.push('/unauthorized');
      }
      
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
    forceSync: () => {},
  };
}