// frontend/src/app/dashboard/page.tsx - ACTUALIZADO CON CSS MODULES
'use client';

import { useTickets } from '@/hooks/useTickets';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import styles from './page.module.css';

interface DashboardStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  myTickets: number;
}

export default function DashboardPage() {
  const { tickets, loading, error } = useTickets();
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    myTickets: 0
  });

  useEffect(() => {
    const ticketsArray = Array.isArray(tickets) ? tickets : [];
    const userEmail = session?.user?.email;
    
    setStats({
      total: ticketsArray.length,
      open: ticketsArray.filter(t => t.status === 'open').length,
      inProgress: ticketsArray.filter(t => t.status === 'in_progress').length,
      resolved: ticketsArray.filter(t => t.status === 'resolved' || t.status === 'closed').length,
      myTickets: userEmail ? ticketsArray.filter(t => t.user.email === userEmail).length : 0
    });
  }, [tickets, session]);

  if (loading) {
    return (
      <div className={styles.container}>
        <Header />
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <Header />
        <div className={styles.error}>
          <h2>Error al cargar datos</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className={styles.button}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const recentTickets = Array.isArray(tickets) 
    ? tickets
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
    : [];

  const isAdmin = session?.user?.role === 'admin';
  const isTechnician = session?.user?.role === 'technician';

  return (
    <div className={styles.container}>
      <Header />
      
      <main className={styles.main}>
        {/* Header Welcome */}
        <div className={styles.header}>
          <div className={styles.welcome}>
            <h1 className={styles.title}>
              Bienvenido, {session?.user?.name} 👋
            </h1>
            <p className={styles.subtitle}>
              {isAdmin && 'Panel de Administración - '}
              {isTechnician && !isAdmin && 'Panel de Técnico - '}
              Resumen general del sistema de tickets
            </p>
          </div>
          
          <div className={styles.actions}>
            <Link href="/tickets/new" className={styles.primaryButton}>
              + Nuevo Ticket
            </Link>
            <Link href="/tickets" className={styles.secondaryButton}>
              Ver Todos los Tickets
            </Link>
          </div>
        </div>

        {/* Estadísticas */}
        <div className={styles.stats}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📊</div>
            <div className={styles.statContent}>
              <div className={styles.statNumber}>{stats.total}</div>
              <div className={styles.statLabel}>Total Tickets</div>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🔴</div>
            <div className={styles.statContent}>
              <div className={styles.statNumber}>{stats.open}</div>
              <div className={styles.statLabel}>Abiertos</div>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🟡</div>
            <div className={styles.statContent}>
              <div className={styles.statNumber}>{stats.inProgress}</div>
              <div className={styles.statLabel}>En Progreso</div>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🟢</div>
            <div className={styles.statContent}>
              <div className={styles.statNumber}>{stats.resolved}</div>
              <div className={styles.statLabel}>Resueltos</div>
            </div>
          </div>

          {!isAdmin && !isTechnician && (
            <div className={styles.statCard}>
              <div className={styles.statIcon}>👤</div>
              <div className={styles.statContent}>
                <div className={styles.statNumber}>{stats.myTickets}</div>
                <div className={styles.statLabel}>Mis Tickets</div>
              </div>
            </div>
          )}
        </div>

        {/* Tickets Recientes */}
        <div className={styles.recentTickets}>
          <div className={styles.sectionHeader}>
            <h2>📋 Tickets Recientes</h2>
            <Link href="/tickets" className={styles.viewAll}>
              Ver todos →
            </Link>
          </div>

          {recentTickets.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>📭</div>
              <h3>No hay tickets</h3>
              <p>Crea el primer ticket para empezar</p>
              <Link href="/tickets/new" className={styles.primaryButton}>
                Crear Primer Ticket
              </Link>
            </div>
          ) : (
            <div className={styles.ticketList}>
              {recentTickets.map((ticket) => (
                <div key={ticket.id} className={styles.ticketItem}>
                  <div className={styles.ticketHeader}>
                    <h3 className={styles.ticketTitle}>
                      <Link href={`/tickets/${ticket.id}`}>
                        {ticket.subject || 'Sin asunto'}
                      </Link>
                    </h3>
                    <div className={styles.ticketMeta}>
                      <span className={`${styles.status} ${
                        ticket.status === 'open' ? styles.statusOpen :
                        ticket.status === 'in_progress' ? styles.statusProgress :
                        ticket.status === 'resolved' ? styles.statusResolved :
                        styles.statusClosed
                      }`}>
                        {ticket.status === 'open' ? 'Abierto' :
                         ticket.status === 'in_progress' ? 'En Progreso' :
                         ticket.status === 'resolved' ? 'Resuelto' : 'Cerrado'}
                      </span>
                    </div>
                  </div>
                  <p className={styles.ticketDescription}>
                    {ticket.description}
                  </p>
                  <div className={styles.ticketFooter}>
                    <span className={styles.module}>
                      {ticket.module?.label || 'N/A'}
                    </span>
                    <span className={styles.date}>
                      {new Date(ticket.created_at).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}