// frontend/src/hooks/useApi.ts - VERSIÓN MEJORADA
'use client';

import { useSession } from 'next-auth/react';
import { useAuth } from './useAuth';
import { useRouter } from 'next/navigation';

export function useApi() {
  const { data: session } = useSession();
  const { user } = useAuth();
  const router = useRouter();

  const apiRequest = async (url: string, options: RequestInit = {}) => {
    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'https://mesa-ayuda-clinica-backend-production.up.railway.app/api';
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Usar el email del usuario autenticado (prioridad: user de useAuth > session de NextAuth)
    const userEmail = user?.email || session?.user?.email;
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
        
        // Manejar error 403 específicamente
        if (response.status === 403) {
          console.log('🚫 Acceso denegado (403) - Redirigiendo a /unauthorized');
          
          // Intentar parsear el error para ver si es específico de autorización
          try {
            const errorData = JSON.parse(errorText);
            if (errorData.code === 'EMAIL_NOT_AUTHORIZED' || 
                errorData.error?.includes('no autorizado') ||
                errorData.message?.includes('no está autorizado')) {
              router.push('/unauthorized');
            }
          } catch {
            // Si no se puede parsear como JSON, usar el texto plano
            if (errorText.includes('no autorizado') || errorText.includes('Acceso denegado')) {
              router.push('/unauthorized');
            }
          }
          
          throw new Error('Acceso denegado: No tienes permisos para realizar esta acción');
        }
        
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      return response.json();
    } catch (error: any) {
      console.error('❌ useApi - Error:', error);
      
      // Si el error contiene palabras clave de no autorización, redirigir
      if (error.message.includes('no autorizado') || 
          error.message.includes('Acceso denegado') ||
          error.message.includes('EMAIL_NOT_AUTHORIZED')) {
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
    backendUser: user, // Esto es importante para compatibilidad
    forceSync: () => {}, // Para compatibilidad
  };
}