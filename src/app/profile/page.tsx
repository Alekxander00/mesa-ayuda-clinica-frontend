// frontend/src/app/profile/page.tsx - NUEVO ARCHIVO
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface UserStats {
  ticketsCreated: number;
  ticketsResolved: number;
  ticketsInProgress: number;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchUserStats();
    }
  }, [session]);

  const fetchUserStats = async () => {
    try {
      // Aquí deberías conectar con un endpoint de stats del usuario
      // Por ahora, usaremos datos mock
      setStats({
        ticketsCreated: 12,
        ticketsResolved: 8,
        ticketsInProgress: 2
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Navegación */}
        <div className="flex items-center space-x-4 mb-8">
          <Link href="/dashboard" className="btn-secondary">
            🏠 Dashboard
          </Link>
          <Link href="/tickets" className="btn-secondary">
            📋 Mis Tickets
          </Link>
        </div>

        {/* Header del Perfil */}
        <div className="card p-8 mb-6">
          <div className="flex items-center space-x-6">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-2xl font-bold">
                {session.user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{session.user?.name}</h1>
              <p className="text-gray-600">{session.user?.email}</p>
              <div className="flex items-center space-x-4 mt-2">
                <span className={`badge capitalize ${
                  session.user?.role === 'admin' ? 'badge-error' :
                  session.user?.role === 'technician' ? 'badge-warning' :
                  'badge-info'
                }`}>
                  {session.user?.role}
                </span>
                <span className="text-sm text-gray-500">
                  Miembro desde {new Date().toLocaleDateString('es-ES')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {stats?.ticketsCreated || 0}
            </div>
            <div className="text-gray-600">Tickets Creados</div>
          </div>
          
          <div className="card p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {stats?.ticketsResolved || 0}
            </div>
            <div className="text-gray-600">Tickets Resueltos</div>
          </div>
          
          <div className="card p-6 text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {stats?.ticketsInProgress || 0}
            </div>
            <div className="text-gray-600">En Progreso</div>
          </div>
        </div>

        {/* Información Adicional */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Actividad Reciente</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-700">Ticket #TKT-0012 creado</span>
                <span className="text-sm text-gray-500">Hace 2 días</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-700">Ticket #TKT-0008 resuelto</span>
                <span className="text-sm text-gray-500">Hace 1 semana</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-700">Ticket #TKT-0005 cerrado</span>
                <span className="text-sm text-gray-500">Hace 2 semanas</span>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">⚙️ Configuración</h3>
            <div className="space-y-4">
              <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                ✏️ Editar Perfil
              </button>
              <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                🔔 Preferencias de Notificación
              </button>
              <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                🔒 Configuración de Seguridad
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}