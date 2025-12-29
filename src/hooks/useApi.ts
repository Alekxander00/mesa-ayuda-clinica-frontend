// frontend/src/hooks/useApi.ts - SIMPLIFICADO
'use client';

import { useSession } from 'next-auth/react';

export function useApi() {
  const { data: session } = useSession();

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
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error('❌ useApi - Error:', error);
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
    session
  };
}