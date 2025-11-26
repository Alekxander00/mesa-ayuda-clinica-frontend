// frontend/src/services/attachmentService.ts - SERVICIO DE ADJUNTOS CORREGIDO
'use client';

import { getSession } from 'next-auth/react';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface Attachment {
  id: string;
  filename: string;
  mime_type: string;
  size_bytes: string; // Cambiado de bigint a string para compatibilidad
  storage_path: string;
  uploaded_by: string;
  ticket_id: string;
  created_at: string;
  uploader?: {
    id: string;
    name: string;
    email: string;
  };
}

class AttachmentService {

  async getImageBlobUrl(attachmentId: string): Promise<string> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${baseURL}/tickets/attachments/${attachmentId}/view`, {
        method: 'GET',
        headers: headers,
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${await response.text()}`);
      }

      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error obteniendo imagen:', error);
      throw error;
    }
  }

  // Método para limpiar URLs de blob cuando ya no se necesiten
  revokeBlobUrl(blobUrl: string) {
    URL.revokeObjectURL(blobUrl);
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    const headers: HeadersInit = {};
    
    try {
      const session = await getSession();
      if (session?.user?.email) {
        headers['x-user-email'] = session.user.email;
      }
    } catch (error) {
      console.warn('Error obteniendo sesión para adjuntos:', error);
    }
    
    return headers;
  }

  

  async getTicketAttachments(ticketId: string): Promise<Attachment[]> {
    try {
      console.log(`🔍 GET Attachments for ticket: ${ticketId}`);
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${baseURL}/tickets/${ticketId}/attachments`, {
        method: 'GET',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
      });
  
      console.log(`📡 Attachments Response Status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Error ${response.status} obteniendo adjuntos:`, errorText);
        
        // Si es error 404 o 500, devolver array vacío en lugar de error
        if (response.status === 404 || response.status === 500) {
          console.warn(`⚠️ Error ${response.status} obteniendo adjuntos, devolviendo array vacío`);
          return [];
        }
        
        throw new Error(`Error ${response.status}: ${errorText}`);
      }
  
      const attachments = await response.json();
      console.log(`✅ Adjuntos obtenidos: ${attachments.length} archivos`);
      return attachments;
    } catch (error) {
      console.error('❌ Error crítico obteniendo adjuntos:', error);
      
      // En caso de error de red u otro, devolver array vacío
      console.warn('⚠️ Error obteniendo adjuntos, devolviendo array vacío');
      return [];
    }
  }

  async uploadAttachments(ticketId: string, files: File[]): Promise<{attachments: Attachment[]}> {
    try {
      const headers = await this.getAuthHeaders();
      const formData = new FormData();

      // Agregar cada archivo al FormData
      files.forEach(file => {
        formData.append('files', file); // 'files' debe coincidir con el nombre en multer
      });

      const response = await fetch(`${baseURL}/tickets/${ticketId}/attachments`, {
        method: 'POST',
        headers: headers, // ¡NO incluir Content-Type! El navegador lo hará automáticamente con el boundary
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error subiendo adjuntos:', error);
      throw error;
    }
  }

  async downloadAttachment(attachmentId: string): Promise<Blob> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${baseURL}/tickets/attachments/${attachmentId}/download`, {
        method: 'GET',
        headers: headers,
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${await response.text()}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Error descargando adjunto:', error);
      throw error;
    }
  }

  formatFileSize(bytes: string): string {
    // Convertir string a número
    const bytesNum = parseInt(bytes, 10);
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytesNum === 0) return '0 Bytes';
    
    const i = Math.floor(Math.log(bytesNum) / Math.log(1024));
    return Math.round(bytesNum / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  getFileIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType === 'application/pdf') return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('excel')) return '📊';
    if (mimeType.includes('zip') || mimeType.includes('compressed')) return '🗜️';
    return '📎';
  }

  // Método para manejar la descarga
  async handleDownload(attachment: Attachment) {
    try {
      const blob = await this.downloadAttachment(attachment.id);
      
      // Crear URL para el blob
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error descargando archivo:', error);
      alert('Error al descargar el archivo');
    }
  }
}

export const attachmentService = new AttachmentService();