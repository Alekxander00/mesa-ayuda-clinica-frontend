// frontend/src/components/providers/SessionProvider.tsx - CORREGIDO
'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';

export default function SessionProvider({ 
  children, 
  session 
}: { 
  children: React.ReactNode;
  session: any;
}) {
  return (
    <NextAuthSessionProvider 
      session={session}
      refetchInterval={5 * 60}
      refetchOnWindowFocus={true}
    >
      {children}
    </NextAuthSessionProvider>
  );
}