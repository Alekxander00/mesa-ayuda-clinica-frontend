// frontend/src/hooks/useApi.ts - VERSIÓN QUE FUNCIONABA + MANEJO 403
'use client';

import { useSession } from 'next-auth/react';
import { useAuth } from './useAuth';

export function useApi() {
  const { data: session } = useSession();
  const { user } = useAuth();

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
        
        // AGREGAR MANEJO ESPECÍFICO PARA ERROR 403
        if (response.status === 403) {
          console.log('🚫 Error 403 detectado - Verificando si es por autorización de correo');
          
          // Intentar parsear el error para ver si es específico de autorización
          try {
            const errorData = JSON.parse(errorText);
            if (errorData.code === 'EMAIL_NOT_AUTHORIZED' || 
                errorData.message?.includes('no está autorizado') ||
                errorData.error?.includes('Acceso denegado')) {
              
              console.log('📤 Redirigiendo a /unauthorized desde API error 403');
              // Usar window.location para redirigir inmediatamente
              window.location.href = '/unauthorized';
              return null; // Detener la ejecución
            }
          } catch (parseError) {
            // Si no se puede parsear, verificar si el texto contiene palabras clave
            if (errorText.includes('no está autorizado') || 
                errorText.includes('Acceso denegado') ||
                errorText.includes('EMAIL_NOT_AUTHORIZED')) {
              
              console.log('📤 Redirigiendo a /unauthorized (texto plano)');
              window.location.href = '/unauthorized';
              return null;
            }
          }
        }
        
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      return response.json();
    } catch (error: any) {
      console.error('❌ useApi - Error:', error);
      
      // También verificar si el error lanzado contiene palabras clave
      if (error.message.includes('EMAIL_NOT_AUTHORIZED') || 
          error.message.includes('no está autorizado') ||
          error.message.includes('403')) {
        console.log('📤 Redirigiendo a /unauthorized desde catch');
        window.location.href = '/unauthorized';
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

  // Mantener compatibilidad con componentes existentes
  return { 
    get, 
    post, 
    put, 
    del, 
    session,
    backendUser: user, // Para compatibilidad
    forceSync: () => {}, // Método vacío para compatibilidad
  };
}