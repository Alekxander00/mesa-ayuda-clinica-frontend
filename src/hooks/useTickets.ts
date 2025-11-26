// frontend/src/hooks/useTickets.ts - CORREGIDO CON ADJUNTOS
'use client';

import { useState, useEffect } from 'react';
import { Ticket, CreateTicketData } from '@/services/ticketService';
import { useApi } from './useApi';
import { attachmentService, Attachment } from '@/services/attachmentService';

interface UseTicketsReturn {
  tickets: Ticket[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  addTicket: (ticketData: CreateTicketData, files?: File[]) => Promise<Ticket>;
  updateTicketStatus: (id: string, updates: Partial<Ticket>) => Promise<Ticket>;
  updateTicketPriority: (id: string, priority: number) => Promise<Ticket>;
  deleteTicket: (id: string) => Promise<void>;
  uploadAttachments: (ticketId: string, files: File[]) => Promise<{attachments: Attachment[]}>;
  getAttachments: (ticketId: string) => Promise<Attachment[]>;
}

export function useTickets(): UseTicketsReturn {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { get, post, put, del, session } = useApi();

  const fetchTickets = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 useTickets: Iniciando carga de tickets...');
      
      if (!session) {
        console.log('⏳ useTickets: Esperando sesión...');
        return;
      }

      const ticketsData = await get('/tickets');
      setTickets(ticketsData);
      console.log('✅ useTickets: Tickets cargados:', ticketsData.length);
      
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar tickets';
      setError(errorMessage);
      console.error('❌ useTickets: Error fetching tickets:', err);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const addTicket = async (ticketData: CreateTicketData, files?: File[]): Promise<Ticket> => {
    try {
      console.log('🔄 useTickets: Creando ticket...', ticketData);
      const newTicket = await post('/tickets', ticketData);
      
      // ✅ CORREGIDO: Subir archivos usando el servicio
      if (files && files.length > 0) {
        console.log('📎 Subiendo archivos adjuntos...', files.length);
        try {
          await attachmentService.uploadAttachments(newTicket.id, files);
          console.log('✅ Archivos subidos exitosamente');
        } catch (uploadError) {
          console.warn('⚠️ No se pudieron subir los archivos, pero el ticket se creó:', uploadError);
          // No lanzamos error para que el ticket se cree igual
        }
      }
      
      setTickets(prev => [newTicket, ...prev]);
      console.log('✅ useTickets: Ticket creado:', newTicket);
      return newTicket;
    } catch (err) {
      console.error('❌ useTickets: Error creating ticket:', err);
      throw err;
    }
  };

  const updateTicketStatus = async (id: string, updates: Partial<Ticket>): Promise<Ticket> => {
    try {
      console.log(`🔄 useTickets: Actualizando ticket ${id}...`, updates);
      const updatedTicket = await put(`/tickets/${id}`, updates);
      setTickets(prev => 
        prev.map(ticket => ticket.id === id ? updatedTicket : ticket)
      );
      console.log('✅ useTickets: Ticket actualizado:', updatedTicket);
      return updatedTicket;
    } catch (err) {
      console.error('❌ useTickets: Error updating ticket:', err);
      throw err;
    }
  };

  const updateTicketPriority = async (id: string, priority: number): Promise<Ticket> => {
    try {
      console.log(`🔄 useTickets: Actualizando prioridad del ticket ${id} a ${priority}...`);
      const updatedTicket = await put(`/tickets/${id}`, { priority });
      setTickets(prev => 
        prev.map(ticket => ticket.id === id ? updatedTicket : ticket)
      );
      console.log('✅ useTickets: Prioridad del ticket actualizada:', updatedTicket);
      return updatedTicket;
    } catch (err) {
      console.error('❌ useTickets: Error updating ticket priority:', err);
      throw err;
    }
  };

  const deleteTicket = async (id: string): Promise<void> => {
    try {
      console.log(`🔄 useTickets: Eliminando ticket ${id}...`);
      await del(`/tickets/${id}`);
      setTickets(prev => prev.filter(ticket => ticket.id !== id));
      console.log('✅ useTickets: Ticket eliminado');
    } catch (err) {
      console.error('❌ useTickets: Error deleting ticket:', err);
      throw err;
    }
  };

  // ✅ CORREGIDO: Usar el servicio de adjuntos
  const uploadAttachments = async (ticketId: string, files: File[]): Promise<{attachments: Attachment[]}> => {
    try {
      console.log(`🔄 useTickets: Subiendo ${files.length} archivos al ticket ${ticketId}...`);
      const result = await attachmentService.uploadAttachments(ticketId, files);
      console.log('✅ useTickets: Archivos subidos:', result);
      return result;
    } catch (err) {
      console.error('❌ useTickets: Error subiendo archivos:', err);
      throw err;
    }
  };
  
  // ✅ CORREGIDO: Usar el servicio de adjuntos
  const getAttachments = async (ticketId: string): Promise<Attachment[]> => {
    try {
      console.log(`🔄 useTickets: Obteniendo adjuntos del ticket ${ticketId}...`);
      const attachments = await attachmentService.getTicketAttachments(ticketId);
      console.log('✅ useTickets: Adjuntos obtenidos:', attachments.length);
      return attachments;
    } catch (err) {
      console.error('❌ useTickets: Error obteniendo adjuntos:', err);
      // En caso de error, devolver array vacío para no romper la UI
      return [];
    }
  };

  useEffect(() => {
    if (session) {
      fetchTickets();
    }
  }, [session]);

  return {
    tickets,
    loading,
    error,
    refetch: fetchTickets,
    addTicket,
    updateTicketStatus,
    updateTicketPriority,
    deleteTicket,
    uploadAttachments,
    getAttachments,
  };
}