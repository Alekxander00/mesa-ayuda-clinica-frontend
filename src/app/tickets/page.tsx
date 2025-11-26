// frontend/src/app/tickets/page.tsx - ACTUALIZADO CON CSS MODULES
'use client';

import { useTickets } from '@/hooks/useTickets';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import Header from '@/components/layout/Header';
import styles from './page.module.css';

export default function TicketsPage() {
  const { tickets, loading, error, refetch, updateTicketStatus, updateTicketPriority, deleteTicket } = useTickets();
  const { data: session } = useSession();
  const [updatingTickets, setUpdatingTickets] = useState<Set<string>>(new Set());
  const [deletingTickets, setDeletingTickets] = useState<Set<string>>(new Set());

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    setUpdatingTickets(prev => new Set(prev).add(ticketId));
    try {
      await updateTicketStatus(ticketId, { status: newStatus });
    } catch (error) {
      console.error('Error updating ticket status:', error);
      alert('Error al actualizar el estado del ticket');
    } finally {
      setUpdatingTickets(prev => {
        const newSet = new Set(prev);
        newSet.delete(ticketId);
        return newSet;
      });
    }
  };

  const handlePriorityChange = async (ticketId: string, newPriority: number) => {
    setUpdatingTickets(prev => new Set(prev).add(ticketId));
    try {
      await updateTicketPriority(ticketId, newPriority);
    } catch (error) {
      console.error('Error updating ticket priority:', error);
      alert('Error al actualizar la prioridad del ticket');
    } finally {
      setUpdatingTickets(prev => {
        const newSet = new Set(prev);
        newSet.delete(ticketId);
        return newSet;
      });
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este ticket? Esta acción no se puede deshacer.')) {
      return;
    }

    setDeletingTickets(prev => new Set(prev).add(ticketId));
    try {
      await deleteTicket(ticketId);
    } catch (error) {
      console.error('Error deleting ticket:', error);
      alert('Error al eliminar el ticket');
    } finally {
      setDeletingTickets(prev => {
        const newSet = new Set(prev);
        newSet.delete(ticketId);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <Header />
        <div className={styles.main}>
          <div className={styles.header}>
            <h1 className={styles.title}>Tickets</h1>
            <div className={styles.skeletonButton}></div>
          </div>
          <div className={styles.loadingTickets}>
            {[1, 2, 3].map(i => (
              <div key={i} className={styles.skeletonTicket}>
                <div className={styles.skeletonLine}></div>
                <div className={styles.skeletonLineShort}></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <Header />
        <div className={styles.main}>
          <div className={styles.header}>
            <h1 className={styles.title}>Tickets</h1>
            <Link href="/tickets/new" className={styles.primaryButton}>
              Nuevo Ticket
            </Link>
          </div>
          <div className={styles.error}>
            <p>Error al cargar tickets: {error}</p>
            <button onClick={refetch} className={styles.retryButton}>
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isAdmin = session?.user?.role === 'admin';
  const isTechnician = session?.user?.role === 'technician';

  return (
    <div className={styles.container}>
      <Header />
      
      <div className={styles.main}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h1 className={styles.title}>Todos los Tickets</h1>
            <p className={styles.subtitle}>
              {tickets.length} tickets encontrados
              {isAdmin && ' (Vista de Administrador)'}
              {isTechnician && !isAdmin && ' (Vista de Técnico)'}
            </p>
          </div>
          <Link href="/tickets/new" className={styles.primaryButton}>
            <span>+</span>
            <span>Nuevo Ticket</span>
          </Link>
        </div>

        {tickets.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📋</div>
            <h3 className={styles.emptyTitle}>No hay tickets</h3>
            <p className={styles.emptyDescription}>Crea el primer ticket para empezar</p>
            <Link href="/tickets/new" className={styles.emptyAction}>
              Crear Primer Ticket
            </Link>
          </div>
        ) : (
          <div className={styles.ticketsList}>
            {tickets.map((ticket) => (
              <div key={ticket.id} className={styles.ticketCard}>
                <div className={styles.ticketHeader}>
                  <div className={styles.ticketTitleSection}>
                    <Link href={`/tickets/${ticket.id}`} className={styles.ticketCode}>
                      {ticket.code}
                    </Link>
                    <h3 className={styles.ticketTitle}>{ticket.subject}</h3>
                  </div>
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
                    {(isAdmin || isTechnician) ? (
                      <select
                        value={ticket.priority}
                        onChange={(e) => handlePriorityChange(ticket.id, parseInt(e.target.value))}
                        disabled={updatingTickets.has(ticket.id)}
                        className={`${styles.priority} ${
                          ticket.priority === 1 ? styles.priorityLow :
                          ticket.priority === 2 ? styles.priorityMedium :
                          ticket.priority === 3 ? styles.priorityHigh :
                          styles.priorityCritical
                        }`}
                      >
                        <option value={1}>Baja</option>
                        <option value={2}>Media</option>
                        <option value={3}>Alta</option>
                        <option value={4}>Crítica</option>
                      </select>
                    ) : (
                      <span className={`${styles.priority} ${
                        ticket.priority === 1 ? styles.priorityLow :
                        ticket.priority === 2 ? styles.priorityMedium :
                        ticket.priority === 3 ? styles.priorityHigh :
                        styles.priorityCritical
                      }`}>
                        {ticket.priority === 1 ? 'Baja' :
                         ticket.priority === 2 ? 'Media' :
                         ticket.priority === 3 ? 'Alta' : 'Crítica'}
                      </span>
                    )}
                  </div>
                </div>

                <p className={styles.ticketDescription}>
                  {ticket.description}
                </p>

                <div className={styles.ticketFooter}>
                  <div className={styles.ticketInfo}>
                    <span className={styles.module}>
                      {ticket.module?.label || 'N/A'}
                    </span>
                    <span className={styles.reporter}>
                      Por: {ticket.user.name}
                    </span>
                  </div>
                  <div className={styles.ticketDates}>
                    <span className={styles.date}>
                      {new Date(ticket.created_at).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                </div>

                {(isAdmin || isTechnician) && (
                  <div className={styles.ticketActions}>
                    <div className={styles.actionButtons}>
                      {/* Cambiar Estado */}
                      {ticket.status === 'open' && (
                        <button
                          onClick={() => handleStatusChange(ticket.id, 'in_progress')}
                          disabled={updatingTickets.has(ticket.id)}
                          className={styles.actionButton}
                        >
                          {updatingTickets.has(ticket.id) ? '...' : 'Tomar'}
                        </button>
                      )}
                      {ticket.status === 'in_progress' && (
                        <button
                          onClick={() => handleStatusChange(ticket.id, 'resolved')}
                          disabled={updatingTickets.has(ticket.id)}
                          className={styles.actionButton}
                        >
                          {updatingTickets.has(ticket.id) ? '...' : 'Resolver'}
                        </button>
                      )}
                      
                      {/* Cerrar Ticket */}
                      {ticket.status === 'resolved' && (
                        <button
                          onClick={() => handleStatusChange(ticket.id, 'closed')}
                          disabled={updatingTickets.has(ticket.id)}
                          className={styles.actionButton}
                        >
                          {updatingTickets.has(ticket.id) ? '...' : 'Cerrar'}
                        </button>
                      )}
                      
                      {/* Eliminar (Solo Admin) */}
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteTicket(ticket.id)}
                          disabled={deletingTickets.has(ticket.id)}
                          className={styles.deleteButton}
                        >
                          {deletingTickets.has(ticket.id) ? 'Eliminando...' : 'Eliminar'}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}