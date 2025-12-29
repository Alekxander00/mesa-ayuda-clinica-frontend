// frontend/src/components/auth/AuthChecker.tsx - MODIFICADO
'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { checkEmailAuthorization, verifyBackendAuth } from '@/services/authService';

export default function AuthChecker({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  // Rutas públicas
  const publicPaths = ['/login', '/unauthorized'];

  // Rutas que solo admin puede ver
  const adminPaths = ['/admin', '/users', '/reports', '/admin/authorized-emails'];

  useEffect(() => {
    const checkAuthorization = async () => {
      if (status === 'loading') {
        return;
      }

      // Si no hay sesión y no está en página pública, redirigir a login
      if (!session) {
        if (!publicPaths.some(path => pathname?.startsWith(path))) {
          router.push('/login');
        }
        return;
      }

      // Si hay sesión, verificar autorización
      if (session?.user?.email) {
        try {
          setLoading(true);
          
          // PRIMERO: Intentar sincronizar con el backend
          try {
            await verifyBackendAuth(session.user.email, session.user.name);
          } catch (syncError: any) {
            // Si es error de no autorizado y no está en página pública
            if (syncError.message === 'EMAIL_NOT_AUTHORIZED') {
              // Si es admin, permitir acceso
              if (session.user.role === 'admin') {
                console.log('⚠️ Admin sin autorización, pero permitiendo acceso...');
                setIsAuthorized(true);
                return;
              }
              
              // Si no es admin, redirigir a unauthorized
              setIsAuthorized(false);
              if (pathname !== '/unauthorized') {
                router.push('/unauthorized');
              }
              return;
            }
          }

          // SEGUNDO: Verificar autorización específica
          const authorized = await checkEmailAuthorization(session.user.email);
          setIsAuthorized(authorized);

          if (!authorized) {
            // Si no está autorizado pero es admin, permitir acceso
            if (session.user.role === 'admin') {
              console.log('👑 Admin detectado, permitiendo acceso especial');
              setIsAuthorized(true);
              return;
            }
            
            if (pathname !== '/unauthorized') {
              router.push('/unauthorized');
            }
          }
          
          // Verificar si admin está intentando acceder a rutas no admin
          if (session.user.role === 'admin' && pathname === '/unauthorized') {
            router.push('/dashboard');
          }
        } catch (error) {
          console.error('Error en AuthChecker:', error);
          // Si hay error pero es admin, permitir acceso
          if (session.user.role === 'admin') {
            setIsAuthorized(true);
          } else {
            setIsAuthorized(false);
            if (pathname !== '/unauthorized') {
              router.push('/unauthorized');
            }
          }
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  // Si está autorizado o es admin, mostrar contenido
  if (isAuthorized === true || session?.user?.role === 'admin') {
    return <>{children}</>;
  }

  // Si no está autorizado y no está en página pública/unauthorized
  if (isAuthorized === false && !publicPaths.some(path => pathname?.startsWith(path))) {
    return null; // Redirección ya manejada
  }

  // Para rutas públicas o cuando aún no se determina
  return <>{children}</>;
}