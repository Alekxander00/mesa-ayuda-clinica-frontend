// frontend/src/components/providers/AuthProvider.tsx - ACTUALIZADO
'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

const publicPaths = ['/login', '/unauthorized', '/_next/', '/favicon.ico', '/api/', '/auth/', '/'];

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const { user, loading, error, checkEmailAuthorization } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    // No hacer nada si está cargando o si es ruta pública
    if (loading || isChecking || publicPaths.some(path => pathname?.startsWith(path))) {
      return;
    }

    console.log('🔐 AuthProvider - Estado:', {
      status,
      tieneSesion: !!session,
      tieneUser: !!user,
      pathname,
      error
    });

    const verifyAccess = async () => {
      setIsChecking(true);
      
      try {
        // Si no hay sesión, redirigir a login
        if (!session && status === 'unauthenticated') {
          console.log('❌ No hay sesión, redirigiendo a login');
          router.push('/login');
          return;
        }

        // Si hay sesión pero no hay usuario en el backend
        if (session?.user?.email && !user) {
          console.log('🔍 Verificando autorización del correo:', session.user.email);
          
          // Verificar si el correo está autorizado
          const isAuthorized = await checkEmailAuthorization(session.user.email);
          
          if (!isAuthorized) {
            console.log('🚫 Correo no autorizado, redirigiendo a /unauthorized');
            router.push('/unauthorized');
            return;
          }
          
          // Si ya estamos en login y está autorizado, redirigir a dashboard
          if (pathname === '/login') {
            console.log('✅ Ya autenticado y autorizado, redirigiendo a dashboard');
            router.push('/dashboard');
          }
        }

        // Si hay error de autorización, redirigir
        if (error === 'EMAIL_NOT_AUTHORIZED' || error?.includes('403')) {
          console.log('🚫 Error de autorización detectado, redirigiendo');
          router.push('/unauthorized');
          return;
        }

        // Si estamos en login pero ya estamos autenticados, redirigir
        if (session && pathname === '/login') {
          console.log('✅ Ya autenticado, redirigiendo a dashboard');
          router.push('/dashboard');
        }
      } catch (err) {
        console.error('❌ Error en verificación de acceso:', err);
      } finally {
        setIsChecking(false);
      }
    };

    verifyAccess();
  }, [session, status, user, loading, error, router, pathname]);

  // Si está cargando y no es ruta pública, mostrar spinner
  if ((loading || isChecking) && !publicPaths.some(path => pathname?.startsWith(path))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}