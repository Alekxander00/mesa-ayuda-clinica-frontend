// frontend/src/components/providers/AuthProvider.tsx - VERSIÓN SIMPLIFICADA
'use client';

import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

const publicPaths = ['/login', '/unauthorized', '/_next/', '/favicon.ico', '/api/', '/auth/', '/'];

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const { user, loading, error } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    console.log('🛡️ AuthProvider - Estado:', {
      status,
      tieneSesion: !!session?.user?.email,
      tieneUser: !!user,
      pathname,
      error,
      loading
    });
  }, [session, user, pathname, error, loading, status]);

  // Mostrar loading mientras se verifica
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

  // Si hay error de autorización, el hook useAuth ya maneja la redirección
  // Solo renderizar children
  return <>{children}</>;
}