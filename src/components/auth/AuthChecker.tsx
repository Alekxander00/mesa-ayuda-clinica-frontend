// frontend/src/components/auth/AuthChecker.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { checkEmailAuthorization } from '@/services/authService';

export default function AuthChecker({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  // Rutas públicas que no requieren autorización
  const publicPaths = ['/login', '/unauthorized', '/api/', '/_next/'];

  useEffect(() => {
    const checkAuthorization = async () => {
      if (status === 'loading') return;

      // Si no hay sesión y no está en página pública, redirigir a login
      if (!session && !publicPaths.some(path => pathname?.startsWith(path))) {
        router.push('/login');
        return;
      }

      // Si hay sesión, verificar autorización
      if (session?.user?.email) {
        try {
          setLoading(true);
          const isAuthorized = await checkEmailAuthorization(session.user.email);
          setIsAuthorized(isAuthorized);

          if (!isAuthorized && pathname !== '/unauthorized') {
            router.push('/unauthorized');
          } else if (isAuthorized && pathname === '/unauthorized') {
            router.push('/dashboard');
          }
        } catch (error) {
          console.error('Error verificando autorización:', error);
          setIsAuthorized(false);
        } finally {
          setLoading(false);
        }
      }
    };

    checkAuthorization();
  }, [session, status, pathname, router]);

  // Mostrar loading mientras verifica
  if (loading && session && !publicPaths.some(path => pathname?.startsWith(path))) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Verificando autorización...</p>
        </div>
      </div>
    );
  }

  // Si no está autorizado y no está en página pública/unauthorized
  if (isAuthorized === false && pathname !== '/unauthorized' && pathname !== '/login') {
    return null; // Redirección ya manejada
  }

  return <>{children}</>;
}