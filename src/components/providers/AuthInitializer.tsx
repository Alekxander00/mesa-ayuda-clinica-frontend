// frontend/src/components/providers/AuthInitializer.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface AuthInitializerProps {
  children: React.ReactNode;
}

export default function AuthInitializer({ children }: AuthInitializerProps) {
  const { data: session, status } = useSession();
  const { user, loading, error, syncUserWithBackend } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const initializeUser = async () => {
      // Solo proceder si hay sesión de NextAuth y no hay usuario del backend
      if (session?.user?.email && !user && !loading && status === 'authenticated') {
        console.log('🚀 Inicializando usuario desde AuthInitializer...');
        
        try {
          // Sincronizar usuario con backend
          const userData = await syncUserWithBackend(
            session.user.email,
            session.user.name || session.user.email.split('@')[0]
          );
          
          if (userData) {
            console.log('✅ Usuario inicializado correctamente');
          } else if (error === 'EMAIL_NOT_AUTHORIZED') {
            console.log('🚫 Usuario no autorizado, redirigiendo...');
            router.push('/unauthorized');
          }
        } catch (err) {
          console.error('❌ Error inicializando usuario:', err);
        }
      }
    };

    initializeUser();
  }, [session, user, loading, status, syncUserWithBackend, error, router]);

  // Si hay error de autorización y estamos en una ruta protegida
  useEffect(() => {
    if (error === 'EMAIL_NOT_AUTHORIZED' && status === 'authenticated') {
      console.log('📌 Error de autorización detectado, verificando ruta actual...');
      
      const currentPath = window.location.pathname;
      const publicPaths = ['/login', '/unauthorized', '/_next/', '/favicon.ico', '/api/', '/auth/'];
      const isPublicPath = publicPaths.some(path => currentPath.startsWith(path));
      
      if (!isPublicPath && currentPath !== '/unauthorized') {
        console.log('📍 Redirigiendo a /unauthorized');
        router.push('/unauthorized');
      }
    }
  }, [error, status, router]);

  return <>{children}</>;
}