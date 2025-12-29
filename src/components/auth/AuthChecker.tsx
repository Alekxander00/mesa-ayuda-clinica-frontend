// frontend/src/components/auth/AuthChecker.tsx - SIMPLIFICADO
'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AuthChecker({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  // Rutas públicas que no requieren autenticación
  const publicPaths = ['/login', '/unauthorized', '/api/', '/_next/', '/favicon.ico'];

  useEffect(() => {
    const checkAuth = async () => {
      console.log('🔐 AuthChecker - Estado:', {
        status,
        tieneSesion: !!session,
        pathname,
        esRutaPublica: publicPaths.some(path => pathname?.startsWith(path))
      });

      // Si está cargando, esperar
      if (status === 'loading') {
        setLoading(true);
        return;
      }

      // Rutas públicas siempre permitidas
      if (publicPaths.some(path => pathname?.startsWith(path))) {
        console.log('✅ Ruta pública, permitiendo acceso');
        setLoading(false);
        return;
      }

      // Si no hay sesión, redirigir a login
      if (!session) {
        console.log('❌ No hay sesión, redirigiendo a login');
        router.push('/login');
        return;
      }

      // Si hay sesión y estamos en login, redirigir a dashboard
      if (session && pathname === '/login') {
        console.log('✅ Ya autenticado, redirigiendo a dashboard');
        router.push('/dashboard');
        return;
      }

      // Si hay sesión y no es ruta pública, permitir acceso
      console.log('✅ Sesión válida, permitiendo acceso');
      setLoading(false);
    };

    checkAuth();
  }, [session, status, pathname, router]);

  // Mostrar loading mientras verifica
  if (loading && !publicPaths.some(path => pathname?.startsWith(path))) {
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