// frontend/src/app/layout.tsx - ACTUALIZADO
import './globals.css';
import { Inter } from 'next/font/google';
import SessionProvider from '@/components/providers/SessionProvider';
import AuthProvider from '@/components/providers/AuthProvider';
import { getServerSession } from 'next-auth';
import { ApiErrorHandler } from '@/components/providers/ApiErrorHandler';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Mesa de Ayuda',
  description: 'Sistema de gestión de tickets',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  return (
    <html lang="es">
      <body className={inter.className}>
        <SessionProvider session={session}>
          <AuthProvider>
            <ApiErrorHandler>
              {children}
            </ApiErrorHandler>
          </AuthProvider>
        </SessionProvider>
      </body>
    </html>
  );
}