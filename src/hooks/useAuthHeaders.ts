// frontend/src/hooks/useAuthHeaders.ts
'use client';

import { useSession } from 'next-auth/react';

export function useAuthHeaders() {
  const { data: session } = useSession();

  const getHeaders = (): HeadersInit => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    console.log('🔐 useAuthHeaders - Sesión:', session);
    
    if (session?.user?.email) {
      headers['x-user-email'] = session.user.email;
      console.log('📨 useAuthHeaders - Enviando header x-user-email:', session.user.email);
    } else {
      console.warn('⚠️ useAuthHeaders - No hay email en la sesión');
    }

    return headers;
  };

  return { getHeaders, session };
}