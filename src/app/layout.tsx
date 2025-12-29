// frontend/src/app/layout.tsx - MODIFICADO
import { getServerSession } from 'next-auth';
import SessionProvider from '@/components/providers/SessionProvider';
import AuthChecker from '@/components/auth/AuthChecker';
import './globals.css';

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
      <body>
        <SessionProvider session={session}>
          <AuthChecker>
            {children}
          </AuthChecker>
        </SessionProvider>
      </body>
    </html>
  );
}