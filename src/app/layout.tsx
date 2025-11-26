// frontend/src/app/layout.tsx - TEMPORAL CON DEBUG
import { getServerSession } from 'next-auth';
import SessionProvider from '@/components/providers/SessionProvider';
import DebugAuthFinal from '@/components/DebugAuthComplete';
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
          
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}