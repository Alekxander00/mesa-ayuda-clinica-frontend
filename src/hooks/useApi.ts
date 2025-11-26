// frontend/src/hooks/useApi.ts - ACTUALIZADO PARA v5
'use client';

import { useSession } from 'next-auth/react';
import { useCallback, useEffect } from 'react';
import { hardRefreshSession } from '@/services/authService';

export function useApi() {
  const { data: session } = useSession();

  // Refrescar sesión periódicamente (cada 10 minutos)
  useEffect(() => {
    if (session) {
      const interval = setInterval(() => {
        // En v5, recargamos la página para forzar actualización completa
        console.log('🔄 Refrescando sesión automáticamente...');
        hardRefreshSession();
      }, 10 * 60 * 1000); // 10 minutos

      return () => clearInterval(interval);
    }
  }, [session]);

  const apiRequest = useCallback(async (url: string, options: RequestInit = {}) => {
    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (options.headers) {
      if (options.headers instanceof Headers) {
        options.headers.forEach((value, key) => {
          headers[key] = value;
        });
      } else if (Array.isArray(options.headers)) {
        options.headers.forEach(([key, value]) => {
          headers[key] = value;
        });
      } else {
        Object.entries(options.headers).forEach(([key, value]) => {
          headers[key] = value as string;
        });
      }
    }

    if (session?.user?.email) {
      headers['x-user-email'] = session.user.email;
      console.log('📨 useApi - Enviando header x-user-email:', session.user.email);
    } else {
      console.warn('⚠️ useApi - No hay email en la sesión');
    }

    try {
      console.log('🔄 useApi - Request:', `${baseURL}${url}`);
      const response = await fetch(`${baseURL}${url}`, {
        ...options,
        headers,
      });

      console.log('📡 useApi - Response Status:', response.status);
      
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

  return { get, post, put, del, session };
}