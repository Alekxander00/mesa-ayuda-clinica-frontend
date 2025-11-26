// frontend/src/hooks/useAuth.ts - ACTUALIZADO PARA NEXTAUTH
'use client';

import { useSession } from 'next-auth/react';

export function useAuth() {
  const { data: session, status } = useSession();

  console.log('🔐 useAuth - Estado de sesión:', status);
  console.log('🔐 useAuth - Datos de sesión:', session);

  const getAuthHeaders = (): HeadersInit => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (session?.user?.email) {
      headers['x-user-email'] = session.user.email;
      console.log('📨 useAuth - Enviando header x-user-email:', session.user.email);
    } else {
      console.warn('⚠️ useAuth - No hay email en la sesión');
    }

    return headers;
  };

  return { 
    userEmail: session?.user?.email, 
    getAuthHeaders,
    session,
    status 
  };
}