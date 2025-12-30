// frontend/src/app/profile/page.tsx - ACTUALIZADO CON CSS MODULES
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

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
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p className={styles.loadingText}>Cargando perfil...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const getRoleClass = (role: string) => {
    switch (role) {
      case 'admin': return styles.roleAdmin;
      case 'technician': return styles.roleTechnician;
      default: return styles.roleUser;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* Navegación */}
        <div className={styles.navigation}>
          <Link href="/dashboard" className={styles.navButton}>
            <span>🏠</span>
            Dashboard
          </Link>
          <Link href="/tickets" className={styles.navButton}>
            <span>📋</span>
            Mis Tickets
          </Link>
        </div>

        {/* Header del Perfil */}
        <div className={styles.header}>
          <div className={styles.profileHeader}>
            <div className={styles.avatar}>
              <span className={styles.avatarText}>
                {session.user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className={styles.profileInfo}>
              <h1 className={styles.profileName}>{session.user?.name}</h1>
              <p className={styles.profileEmail}>{session.user?.email}</p>
              <div className={styles.profileMeta}>
                <span className={`${styles.roleBadge} ${getRoleClass(session.user?.role || 'user')}`}>
                  {session.user?.role}
                </span>
                <span className={styles.memberSince}>
                  Miembro desde {new Date().toLocaleDateString('es-ES')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className={styles.stats}>
          <div className={styles.statCard}>
            <div className={`${styles.statNumber} ${styles.statCreated}`}>
              {stats?.ticketsCreated || 0}
            </div>
            <div className={styles.statLabel}>Tickets Creados</div>
          </div>
          
          <div className={styles.statCard}>
            <div className={`${styles.statNumber} ${styles.statResolved}`}>
              {stats?.ticketsResolved || 0}
            </div>
            <div className={styles.statLabel}>Tickets Resueltos</div>
          </div>
          
          <div className={styles.statCard}>
            <div className={`${styles.statNumber} ${styles.statInProgress}`}>
              {stats?.ticketsInProgress || 0}
            </div>
            <div className={styles.statLabel}>En Progreso</div>
          </div>
        </div>

        {/* Información Adicional */}
        <div className={styles.grid}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>
              <span>📊</span>
              Actividad Reciente
            </h3>
            <div className={styles.activityList}>
              <div className={styles.activityItem}>
                <span className={styles.activityText}>Ticket #TKT-0012 creado</span>
                <span className={styles.activityTime}>Hace 2 días</span>
              </div>
              <div className={styles.activityItem}>
                <span className={styles.activityText}>Ticket #TKT-0008 resuelto</span>
                <span className={styles.activityTime}>Hace 1 semana</span>
              </div>
              <div className={styles.activityItem}>
                <span className={styles.activityText}>Ticket #TKT-0005 cerrado</span>
                <span className={styles.activityTime}>Hace 2 semanas</span>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardTitle}>
              <span>⚙️</span>
              Configuración
            </h3>
            <div className={styles.settingsList}>
              <button className={styles.settingsButton}>
                <span>✏️</span>
                Editar Perfil
              </button>
              <button className={styles.settingsButton}>
                <span>🔔</span>
                Preferencias de Notificación
              </button>
              <button className={styles.settingsButton}>
                <span>🔒</span>
                Configuración de Seguridad
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}