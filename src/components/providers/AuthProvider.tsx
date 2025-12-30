// frontend/src/components/providers/AuthProvider.tsx - VERSIÓN ORIGINAL
'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

const publicPaths = ['/login', '/unauthorized', '/_next/', '/favicon.ico', '/api/', '/auth/'];

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const { user, loading, error } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // No hacer nada si está cargando o si es ruta pública
    if (loading || publicPaths.some(path => pathname?.startsWith(path))) {
      return;
    }

    console.log('🔐 AuthProvider - Estado:', {
      status,
      tieneSesion: !!session,
      tieneUser: !!user,
      pathname
    });

    // Si no hay sesión, redirigir a login
    if (!session && status === 'unauthenticated') {
      console.log('❌ No hay sesión, redirigiendo a login');
      router.push('/login');
      return;
    }

    // Si hay sesión pero estamos en login, redirigir a dashboard
    if (session && pathname === '/login') {
      console.log('✅ Ya autenticado, redirigiendo a dashboard');
      router.push('/dashboard');
      return;
    }

    // Si hay error de autorización, redirigir a unauthorized
    if (error === 'EMAIL_NOT_AUTHORIZED') {
      console.log('🚫 Email no autorizado, redirigiendo');
      router.push('/unauthorized');
      return;
    }
  }, [session, status, user, loading, error, router, pathname]);

  // Si está cargando y no es ruta pública, mostrar spinner
  if (loading && !publicPaths.some(path => pathname?.startsWith(path))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}