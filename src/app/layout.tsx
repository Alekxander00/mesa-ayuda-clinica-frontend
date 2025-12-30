// frontend/src/app/layout.tsx - VERSIÓN SIMPLE
import './globals.css';
import { Inter } from 'next/font/google';
import SessionProvider from '@/components/providers/SessionProvider';
import AuthProvider from '@/components/providers/AuthProvider';
import { getServerSession } from 'next-auth';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Mesa de Ayuda Clínica',
  description: 'Sistema de gestión de tickets médicos',
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
          <AuthProvider>{children}</AuthProvider>
        </SessionProvider>
      </body>
    </html>
  );
}