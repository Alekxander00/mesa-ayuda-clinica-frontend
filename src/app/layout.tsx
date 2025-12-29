// frontend/src/app/layout.tsx - ACTUALIZADO
import './globals.css';
import { Inter } from 'next/font/google';
import SessionProvider from '@/components/providers/SessionProvider';
import { getServerSession } from 'next-auth';
import AuthChecker from '@/components/auth/AuthChecker';

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
          <AuthChecker>{children}</AuthChecker>
        </SessionProvider>
      </body>
    </html>
  );
}