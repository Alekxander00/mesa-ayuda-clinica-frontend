// frontend/src/hooks/useAuth.ts - VERSIÓN CORREGIDA COMPLETA
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export interface BackendUser {
  id: string;
  email: string;
  name: string;
  role: string;
  email_verified: boolean;
}

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [user, setUser] = useState<BackendUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const syncUserWithBackend = useCallback(async (email: string, name?: string): Promise<BackendUser | null> => {
    try {
      console.log('🔄 Sincronizando usuario con backend:', email);
      
      const baseURL = process.env.NEXT_PUBLIC_API_URL || 'https://mesa-ayuda-clinica-backend-production.up.railway.app/api';
      
      // 1. Verificar si el email está autorizado
      console.log('🔍 Verificando autorización para:', email);
      const checkResponse = await fetch(`${baseURL}/auth/check-email/${encodeURIComponent(email)}`);
      
      if (!checkResponse.ok) {
        console.error('❌ Error en check-email:', checkResponse.status);
        return null;
      }

      const checkData = await checkResponse.json();
      console.log('✅ Resultado de verificación:', checkData);
      
      if (!checkData.isAuthorized) {
        console.log('🚫 Correo no autorizado:', email);
        setError('EMAIL_NOT_AUTHORIZED');
        return null;
      }

      // 2. Sincronizar usuario
      console.log('👤 Sincronizando usuario en backend...');
      const syncResponse = await fetch(`${baseURL}/auth/sync-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': email,
        },
        body: JSON.stringify({
          email,
          name: name || email.split('@')[0]
        }),
      });

      if (!syncResponse.ok) {
        console.error('❌ Error en sync-user:', syncResponse.status);
        throw new Error(`Error ${syncResponse.status}: ${await syncResponse.text()}`);
      }

      const userData = await syncResponse.json();
      console.log('✅ Usuario sincronizado:', userData);
      return userData;
      
    } catch (err: any) {
      console.error('❌ Error en syncUserWithBackend:', err);
      
      // Verificar si es error 403
      if (err.message.includes('403') || err.message.includes('no autorizado') || err.message.includes('Acceso denegado')) {
        setError('EMAIL_NOT_AUTHORIZED');
      } else {
        setError(err.message || 'Error de autenticación');
      }
      
      return null;
    }
  }, []);

  const checkEmailAuthorization = useCallback(async (email: string): Promise<boolean> => {
    try {
      const baseURL = process.env.NEXT_PUBLIC_API_URL || 'https://mesa-ayuda-clinica-backend-production.up.railway.app/api';
      
      console.log('🔍 Verificando autorización para:', email);
      const response = await fetch(`${baseURL}/auth/check-email/${encodeURIComponent(email)}`);
      
      if (!response.ok) {
        console.error('❌ Error en verificación:', response.status);
        return false;
      }

      const data = await response.json();
      console.log('✅ Resultado de autorización:', data);
      return data.isAuthorized;
    } catch (err) {
      console.error('❌ Error verificando autorización:', err);
      return false;
    }
  }, []);

  // Efecto principal para manejar autenticación
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('🚀 Iniciando autenticación...', {
        status,
        tieneSesion: !!session?.user?.email,
        authChecked,
        pathname: window.location.pathname
      });

      // Si no hay sesión y ya terminó de cargar, redirigir a login
      if (status === 'unauthenticated') {
        console.log('❌ No hay sesión, marcando como no autenticado');
        setUser(null);
        setLoading(false);
        setAuthChecked(true);
        
        // Solo redirigir a login si no está en una ruta pública
        const publicPaths = ['/login', '/unauthorized', '/_next/', '/favicon.ico', '/api/', '/auth/'];
        const currentPath = window.location.pathname;
        const isPublicPath = publicPaths.some(path => currentPath.startsWith(path));
        
        if (!isPublicPath) {
          console.log('📍 No está en ruta pública, redirigiendo a login');
          router.push('/login');
        }
        return;
      }

      // Si está cargando la sesión, esperar
      if (status === 'loading') {
        console.log('⏳ Cargando sesión...');
        return;
      }

      // Si ya verificamos, no hacer nada
      if (authChecked && user) {
        console.log('✅ Ya verificado y usuario cargado');
        return;
      }

      // Si hay sesión pero no hemos verificado
      if (session?.user?.email && !authChecked) {
        console.log('🔍 Verificando usuario de sesión:', session.user.email);
        setLoading(true);
        setError(null);

        try {
          const userData = await syncUserWithBackend(
            session.user.email, 
            session.user.name || session.user.email.split('@')[0]
          );

          if (userData) {
            console.log('✅ Usuario autenticado y autorizado:', userData);
            setUser(userData);
            
            // Guardar en localStorage para persistencia
            if (typeof window !== 'undefined') {
              localStorage.setItem('backend-user', JSON.stringify(userData));
              localStorage.setItem('auth-checked', 'true');
            }
            
            // Si estamos en login, redirigir a dashboard
            if (window.location.pathname === '/login') {
              console.log('📍 En login, redirigiendo a dashboard');
              router.push('/dashboard');
            }
          } else if (error === 'EMAIL_NOT_AUTHORIZED') {
            console.log('🚫 Correo no autorizado, redirigiendo a unauthorized');
            router.push('/unauthorized');
          }
        } catch (err) {
          console.error('❌ Error en inicialización de autenticación:', err);
        } finally {
          setLoading(false);
          setAuthChecked(true);
        }
      }
    };

    initializeAuth();
  }, [session, status, syncUserWithBackend, authChecked, router, error]);

  // Efecto para cargar usuario desde localStorage si existe
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('backend-user');
      const isAuthChecked = localStorage.getItem('auth-checked') === 'true';
      
      if (savedUser && !user && isAuthChecked) {
        try {
          const parsedUser = JSON.parse(savedUser);
          console.log('📂 Cargando usuario desde localStorage:', parsedUser.email);
          setUser(parsedUser);
          setAuthChecked(true);
          setLoading(false);
        } catch (e) {
          console.error('Error cargando usuario desde localStorage:', e);
        }
      }
    }
  }, [user]);

  // Función para limpiar datos de autenticación
  const clearAuth = useCallback(() => {
    setUser(null);
    setError(null);
    setAuthChecked(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('backend-user');
      localStorage.removeItem('auth-checked');
    }
  }, []);

  return {
    user,
    loading: loading || status === 'loading',
    error,
    syncUserWithBackend,
    checkEmailAuthorization,
    clearAuth,
    isAuthenticated: !!user && !!session,
    session
  };
}