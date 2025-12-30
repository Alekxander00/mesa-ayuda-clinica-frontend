'use client';

import { useTickets } from '@/hooks/useTickets';
import { useSession } from 'next-auth/react';
import { useEffect, useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import styles from './page.module.css';
import { usePermissions } from '@/hooks/usePermissions';

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
  
  // Estado para el dropdown del perfil
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // ✅ USAR usePermissions PARA ROLES
  const { isAdmin, isTechnician, role } = usePermissions();

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    // Cerrar con Escape key
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  // Calcular estadísticas
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

  // Animar números (CountUp effect)
  const [animatedStats, setAnimatedStats] = useState(stats);
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedStats(stats);
    }, 100);
    return () => clearTimeout(timer);
  }, [stats]);

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
          <button 
            onClick={() => window.location.reload()} 
            className={styles.button}
            aria-label="Reintentar carga del dashboard"
          >
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

  // Componente de Dropdown del perfil
  const ProfileDropdown = () => (
    <div className={styles.userSection} ref={dropdownRef}>
      <button
        className={styles.userButton}
        onClick={() => setDropdownOpen(!dropdownOpen)}
        aria-haspopup="true"
        aria-expanded={dropdownOpen}
        aria-label="Menú de perfil de usuario"
      >
        <div className={styles.userAvatar}>
          {session?.user?.name?.charAt(0) || 'U'}
        </div>
        <div className={styles.userInfo}>
          <span className={styles.userName}>{session?.user?.name || 'Usuario'}</span>
          <span className={styles.userRole}>
            {isAdmin ? 'Administrador' : isTechnician ? 'Técnico' : 'Usuario'}
          </span>
        </div>
        <svg
          className={`${styles.dropdownIcon} ${dropdownOpen ? styles.dropdownIconOpen : ''}`}
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M4 6L8 10L12 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      
      {dropdownOpen && (
        <div 
          className={styles.dropdown}
          role="menu"
          aria-label="Opciones de perfil"
        >
          <div className={styles.dropdownHeader}>
            <strong>{session?.user?.name}</strong>
            <span>{session?.user?.email}</span>
          </div>
          <hr className={styles.dropdownDivider} />
          <Link 
            href="/profile" 
            className={styles.dropdownItem}
            role="menuitem"
            onClick={() => setDropdownOpen(false)}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 8C10.2091 8 12 6.20914 12 4C12 1.79086 10.2091 0 8 0C5.79086 0 4 1.79086 4 4C4 6.20914 5.79086 8 8 8Z" fill="currentColor"/>
              <path d="M8 9C4.13401 9 1 12.134 1 16H15C15 12.134 11.866 9 8 9Z" fill="currentColor"/>
            </svg>
            Mi perfil
          </Link>
          <Link 
            href="/settings" 
            className={styles.dropdownItem}
            role="menuitem"
            onClick={() => setDropdownOpen(false)}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 10C9.10457 10 10 9.10457 10 8C10 6.89543 9.10457 6 8 6C6.89543 6 6 6.89543 6 8C6 9.10457 6.89543 10 8 10Z" fill="currentColor"/>
              <path d="M13.19 6.58L14.5 5.28C14.73 5.06 14.79 4.72 14.65 4.43C14.17 3.36 13.39 2.39 12.41 1.65C12.15 1.46 11.8 1.47 11.56 1.68L10.25 2.98C9.56 2.64 8.8 2.5 8 2.5C7.2 2.5 6.44 2.64 5.75 2.98L4.44 1.68C4.2 1.47 3.85 1.46 3.59 1.65C2.61 2.39 1.83 3.36 1.35 4.43C1.21 4.72 1.27 5.06 1.5 5.28L2.81 6.58C2.8 6.72 2.75 6.86 2.75 7C2.75 7.14 2.8 7.28 2.81 7.42L1.5 8.72C1.27 8.94 1.21 9.28 1.35 9.57C1.83 10.64 2.61 11.61 3.59 12.35C3.85 12.54 4.2 12.53 4.44 12.32L5.75 11.02C6.44 11.36 7.2 11.5 8 11.5C8.8 11.5 9.56 11.36 10.25 11.02L11.56 12.32C11.8 12.53 12.15 12.54 12.41 12.35C13.39 11.61 14.17 10.64 14.65 9.57C14.79 9.28 14.73 8.94 14.5 8.72L13.19 7.42C13.2 7.28 13.25 7.14 13.25 7C13.25 6.86 13.2 6.72 13.19 6.58Z" fill="currentColor"/>
            </svg>
            Configuración
          </Link>
          <hr className={styles.dropdownDivider} />
          <button
            className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
            role="menuitem"
            onClick={() => {
              // Cerrar sesión
              setDropdownOpen(false);
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V3.33333C2 2.97971 2.14048 2.64057 2.39052 2.39052C2.64057 2.14048 2.97971 2 3.33333 2H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10.6667 11.3333L14 8L10.6667 4.66667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );

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
            <Link 
              href="/tickets/new" 
              className={styles.primaryButton}
              aria-label="Crear nuevo ticket"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 4V16M4 10H16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Nuevo Ticket
            </Link>
            <Link 
              href="/tickets" 
              className={styles.secondaryButton}
              aria-label="Ver todos los tickets"
            >
              Ver Todos
            </Link>
          </div>
        </div>

        {/* Estadísticas */}
        <div className={styles.stats}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📊</div>
            <div className={styles.statContent}>
              <div className={styles.statNumber}>{animatedStats.total}</div>
              <div className={styles.statLabel}>Total Tickets</div>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🔴</div>
            <div className={styles.statContent}>
              <div className={styles.statNumber}>{animatedStats.open}</div>
              <div className={styles.statLabel}>Abiertos</div>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🟡</div>
            <div className={styles.statContent}>
              <div className={styles.statNumber}>{animatedStats.inProgress}</div>
              <div className={styles.statLabel}>En Progreso</div>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🟢</div>
            <div className={styles.statContent}>
              <div className={styles.statNumber}>{animatedStats.resolved}</div>
              <div className={styles.statLabel}>Resueltos</div>
            </div>
          </div>

          {!isAdmin && !isTechnician && (
            <div className={styles.statCard}>
              <div className={styles.statIcon}>👤</div>
              <div className={styles.statContent}>
                <div className={styles.statNumber}>{animatedStats.myTickets}</div>
                <div className={styles.statLabel}>Mis Tickets</div>
              </div>
            </div>
          )}
        </div>

        {/* Tickets Recientes */}
        <div className={styles.recentTickets}>
          <div className={styles.sectionHeader}>
            <h2>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 12H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M12 16H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M9 12H9.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M9 16H9.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M9 3H15V7H9V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Tickets Recientes
            </h2>
            <Link 
              href="/tickets" 
              className={styles.viewAll}
              aria-label="Ver todos los tickets recientes"
            >
              Ver todos
            </Link>
          </div>

          {recentTickets.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>📭</div>
              <h3>No hay tickets</h3>
              <p>Crea el primer ticket para empezar</p>
              <Link 
                href="/tickets/new" 
                className={styles.primaryButton}
                aria-label="Crear primer ticket"
              >
                Crear Primer Ticket
              </Link>
            </div>
          ) : (
            <div className={styles.ticketList}>
              {recentTickets.map((ticket) => (
                <div 
                  key={ticket.id} 
                  className={styles.ticketItem}
                  aria-label={`Ticket: ${ticket.subject}, Estado: ${ticket.status}`}
                >
                  <div className={styles.ticketHeader}>
                    <h3 className={styles.ticketTitle}>
                      <Link href={`/tickets/${ticket.id}`}>
                        {ticket.subject || 'Sin asunto'}
                      </Link>
                    </h3>
                    <div className={styles.ticketMeta}>
                      <span 
                        className={`${styles.status} ${
                          ticket.status === 'open' ? styles.statusOpen :
                          ticket.status === 'in_progress' ? styles.statusProgress :
                          ticket.status === 'resolved' ? styles.statusResolved :
                          styles.statusClosed
                        }`}
                        aria-label={`Estado: ${ticket.status === 'open' ? 'Abierto' :
                         ticket.status === 'in_progress' ? 'En Progreso' :
                         ticket.status === 'resolved' ? 'Resuelto' : 'Cerrado'}`}
                      >
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

        {/* Dropdown del perfil (se renderiza aquí para pruebas, normalmente iría en Header) */}
        <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 60 }}>
          <ProfileDropdown />
        </div>
      </main>
    </div>
  );
}