// frontend/src/hooks/useAuth.ts - ACTUALIZADO
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface BackendUser {
  id: string;
  email: string;
  name: string;
  role: string;
  email_verified: boolean;
}

export function useAuth() {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<BackendUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const syncUserWithBackend = useCallback(async () => {
    if (!session?.user?.email) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const baseURL = process.env.NEXT_PUBLIC_API_URL || 'https://mesa-ayuda-clinica-backend-production.up.railway.app/api';
      
      // 1. Primero verificar si el email está autorizado
      const checkResponse = await fetch(`${baseURL}/auth/check-email/${encodeURIComponent(session.user.email)}`);
      
      if (!checkResponse.ok) {
        throw new Error(`Error ${checkResponse.status}: ${await checkResponse.text()}`);
      }

      const checkData = await checkResponse.json();
      
      if (!checkData.isAuthorized) {
        setError('EMAIL_NOT_AUTHORIZED');
        setUser(null);
        return;
      }

      // 2. Sincronizar usuario con el backend
      const syncResponse = await fetch(`${baseURL}/auth/sync-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': session.user.email,
        },
        body: JSON.stringify({
          email: session.user.email,
          name: session.user.name || session.user.email.split('@')[0]
        }),
      });

      if (!syncResponse.ok) {
        throw new Error(`Error ${syncResponse.status}: ${await syncResponse.text()}`);
      }

      const userData = await syncResponse.json();
      setUser(userData);
      
    } catch (err: any) {
      console.error('❌ Error en syncUserWithBackend:', err);
      setError(err.message || 'Error de autenticación');
      
      // Si es error 403, marcar como no autorizado
      if (err.message.includes('403')) {
        setError('EMAIL_NOT_AUTHORIZED');
      }
    } finally {
      setLoading(false);
    }
  }, [session]);

  const checkEmailAuthorization = useCallback(async (email: string): Promise<boolean> => {
    try {
      const baseURL = process.env.NEXT_PUBLIC_API_URL || 'https://mesa-ayuda-clinica-backend-production.up.railway.app/api';
      
      const response = await fetch(`${baseURL}/auth/check-email/${encodeURIComponent(email)}`);
      
      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.isAuthorized;
    } catch (err) {
      console.error('❌ Error verificando autorización:', err);
      return false;
    }
  }, []);

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      setUser(null);
      setLoading(false);
      return;
    }

    syncUserWithBackend();
  }, [session, status, syncUserWithBackend]);

  return {
    user,
    loading,
    error,
    syncUserWithBackend,
    checkEmailAuthorization,
  };
}