// frontend/src/app/tickets/[id]/page.tsx - ACTUALIZADO CON BLOB URLs
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useApi } from '@/hooks/useApi';
import { useTickets } from '@/hooks/useTickets';
import { attachmentService, Attachment } from '@/services/attachmentService';
import Header from '@/components/layout/Header';

interface Ticket {
  id: string;
  code: string;
  subject: string;
  description: string;
  status: string;
  priority: number;
  created_at: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  module: {
    id: number;
    label: string;
  };
  ticket_type: {
    id: number;
    label: string;
  };
  assigned_to_user?: {
    id: string;
    name: string;
    email: string;
  };
  messages: Array<{
    id: string;
    body: string;
    is_internal: boolean;
    created_at: string;
    sender: {
      name: string;
      email: string;
    };
  }>;
}

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { get, post, put } = useApi();
  const { getAttachments, uploadAttachments } = useTickets();
  
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [error, setError] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedImage, setSelectedImage] = useState<{url: string, filename: string} | null>(null);
  const [imageBlobUrls, setImageBlobUrls] = useState<Record<string, string>>({});
  const [loadingImages, setLoadingImages] = useState<Record<string, boolean>>({});

  const ticketId = params.id as string;

  useEffect(() => {
    if (ticketId) {
      fetchTicket();
      fetchAttachments();
    }
  }, [ticketId]);

  // Efecto para cargar imágenes con autenticación
  useEffect(() => {
    const loadImages = async () => {
      const imageAttachments = attachments.filter(att => 
        att.mime_type.startsWith('image/')
      );

      if (imageAttachments.length === 0) return;

      console.log(`🔄 Cargando ${imageAttachments.length} imágenes con autenticación...`);
      
      const newBlobUrls: Record<string, string> = {};
      const newLoadingImages: Record<string, boolean> = {};

      // Marcar todas las imágenes como cargando
      imageAttachments.forEach(att => {
        newLoadingImages[att.id] = true;
      });
      setLoadingImages(newLoadingImages);

      for (const attachment of imageAttachments) {
        try {
          console.log(`📸 Cargando imagen: ${attachment.id}`);
          const blobUrl = await attachmentService.getImageBlobUrl(attachment.id);
          newBlobUrls[attachment.id] = blobUrl;
          console.log(`✅ Imagen cargada: ${attachment.id}`);
        } catch (error) {
          console.error(`❌ Error cargando imagen ${attachment.id}:`, error);
          // Usar placeholder en caso de error
          newBlobUrls[attachment.id] = '/image-placeholder.svg';
        } finally {
          newLoadingImages[attachment.id] = false;
        }
      }

      setImageBlobUrls(prev => ({ ...prev, ...newBlobUrls }));
      setLoadingImages(prev => ({ ...prev, ...newLoadingImages }));
    };

    if (attachments.length > 0) {
      loadImages();
    }
  }, [attachments]);

  // Cleanup: revocar blob URLs cuando el componente se desmonte
  useEffect(() => {
    return () => {
      Object.values(imageBlobUrls).forEach(blobUrl => {
        if (blobUrl.startsWith('blob:')) {
          attachmentService.revokeBlobUrl(blobUrl);
        }
      });
      // Limpiar URL del modal si existe
      if (selectedImage?.url.startsWith('blob:')) {
        attachmentService.revokeBlobUrl(selectedImage.url);
      }
    };
  }, [imageBlobUrls, selectedImage]);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      setError('');
      console.log(`🔄 Cargando ticket ${ticketId}...`);
      
      const ticketData = await get(`/tickets/${ticketId}`);
      setTicket(ticketData);
      console.log('✅ Ticket cargado:', ticketData);
      
    } catch (err: any) {
      console.error('❌ Error cargando ticket:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar el ticket');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttachments = async () => {
    try {
      setLoadingAttachments(true);
      console.log(`📎 Cargando adjuntos para ticket ${ticketId}...`);
      const attachmentsData = await getAttachments(ticketId);
      
      setAttachments(attachmentsData);
      console.log('✅ Adjuntos cargados:', attachmentsData.length);
    } catch (err) {
      console.error('❌ Error cargando adjuntos:', err);
      setAttachments([]);
    } finally {
      setLoadingAttachments(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSendingMessage(true);
    try {
      console.log('💬 Enviando mensaje...');
      await post(`/tickets/${ticketId}/messages`, {
        body: newMessage,
        is_internal: false,
      });

      setNewMessage('');
      await fetchTicket();
      console.log('✅ Mensaje enviado');
    } catch (err) {
      console.error('❌ Error enviando mensaje:', err);
      alert('Error al enviar el mensaje');
    } finally {
      setSendingMessage(false);
    }
  };

  const updateTicketStatus = async (newStatus: string) => {
    setUpdatingStatus(true);
    try {
      console.log(`🔄 Actualizando estado a: ${newStatus}`);
      await put(`/tickets/${ticketId}`, {
        status: newStatus,
      });

      await fetchTicket();
      console.log('✅ Estado actualizado');
    } catch (err) {
      console.error('❌ Error actualizando estado:', err);
      alert('Error al actualizar el estado');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(files);
    }
  };

  const handleUploadFiles = async () => {
    if (selectedFiles.length === 0) return;

    setUploadingFiles(true);
    try {
      console.log(`📎 Subiendo ${selectedFiles.length} archivos...`);
      await uploadAttachments(ticketId, selectedFiles);
      
      await fetchAttachments();
      setSelectedFiles([]);
      
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      console.log('✅ Archivos subidos exitosamente');
      alert('Archivos subidos correctamente');
    } catch (err) {
      console.error('❌ Error subiendo archivos:', err);
      alert('Error al subir los archivos');
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleDownload = async (attachment: Attachment) => {
    try {
      await attachmentService.handleDownload(attachment);
    } catch (error) {
      console.error('Error descargando archivo:', error);
      alert('Error al descargar el archivo');
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este archivo?')) {
      return;
    }

    try {
      // Limpiar blob URL si existe
      if (imageBlobUrls[attachmentId] && imageBlobUrls[attachmentId].startsWith('blob:')) {
        attachmentService.revokeBlobUrl(imageBlobUrls[attachmentId]);
      }
      
      setAttachments(prev => prev.filter(att => att.id !== attachmentId));
      setImageBlobUrls(prev => {
        const newUrls = { ...prev };
        delete newUrls[attachmentId];
        return newUrls;
      });
      
      console.log('✅ Archivo eliminado localmente');
    } catch (error) {
      console.error('Error eliminando archivo:', error);
      alert('Error al eliminar el archivo');
    }
  };

  const openImageModal = async (attachment: Attachment) => {
    if (attachment.mime_type.startsWith('image/')) {
      try {
        console.log(`🔄 Abriendo modal para imagen: ${attachment.id}`);
        const blobUrl = await attachmentService.getImageBlobUrl(attachment.id);
        setSelectedImage({
          url: blobUrl,
          filename: attachment.filename
        });
        console.log(`✅ Modal abierto con imagen: ${attachment.id}`);
      } catch (error) {
        console.error('❌ Error abriendo imagen en modal:', error);
        alert('No se pudo cargar la imagen para visualización');
      }
    }
  };

  const closeImageModal = () => {
    if (selectedImage?.url.startsWith('blob:')) {
      attachmentService.revokeBlobUrl(selectedImage.url);
    }
    setSelectedImage(null);
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'open': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open': return 'Abierto';
      case 'in_progress': return 'En Progreso';
      case 'resolved': return 'Resuelto';
      case 'closed': return 'Cerrado';
      default: return status;
    }
  };

  const getPriorityClass = (priority: number) => {
    switch (priority) {
      case 1: return 'bg-green-100 text-green-800 border-green-200';
      case 2: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 3: return 'bg-orange-100 text-orange-800 border-orange-200';
      case 4: return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityText = (priority: number) => {
    switch (priority) {
      case 1: return 'Baja';
      case 2: return 'Media';
      case 3: return 'Alta';
      case 4: return 'Crítica';
      default: return 'No asignada';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando ticket...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto p-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-6xl mb-4">😕</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{error}</h1>
            <p className="text-gray-600 mb-6">El ticket que buscas no existe o no tienes permisos para verlo.</p>
            <div className="flex justify-center space-x-4">
              <Link href="/tickets" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                ← Volver a Tickets
              </Link>
              <Link href="/dashboard" className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors">
                Ir al Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return null;
  }

  const isAdmin = session?.user?.role === 'admin';
  const isTechnician = session?.user?.role === 'technician';
  const isOwner = session?.user?.email === ticket.user.email;
  const canReply = isAdmin || isTechnician || isOwner;
  const canChangeStatus = isAdmin || isTechnician;
  const canUploadFiles = isAdmin || isTechnician || isOwner;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center text-sm text-gray-500 mb-2">
                <Link href="/tickets" className="text-blue-600 hover:text-blue-800 flex items-center">
                  <span>←</span>
                  <span className="ml-1">Volver a Tickets</span>
                </Link>
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">
                {ticket.subject || 'Sin asunto'}
              </h1>
              <div className="flex flex-wrap items-center gap-3">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusClass(ticket.status)}`}>
                  {getStatusText(ticket.status)}
                </span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getPriorityClass(ticket.priority)}`}>
                  {getPriorityText(ticket.priority)}
                </span>
                <span className="text-sm text-gray-500">
                  Código: {ticket.code}
                </span>
                <span className="text-sm text-gray-500">
                  Creado: {new Date(ticket.created_at).toLocaleDateString('es-ES')}
                </span>
              </div>
            </div>
            
            {canChangeStatus && (
              <div className="flex flex-wrap gap-2">
                {ticket.status === 'open' && (
                  <button
                    onClick={() => updateTicketStatus('in_progress')}
                    disabled={updatingStatus}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center"
                  >
                    {updatingStatus ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <span className="mr-2">🛠️</span>
                    )}
                    {updatingStatus ? 'Actualizando...' : 'Tomar Ticket'}
                  </button>
                )}
                {ticket.status === 'in_progress' && (
                  <button
                    onClick={() => updateTicketStatus('resolved')}
                    disabled={updatingStatus}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center"
                  >
                    {updatingStatus ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <span className="mr-2">✅</span>
                    )}
                    {updatingStatus ? 'Actualizando...' : 'Marcar Resuelto'}
                  </button>
                )}
                {ticket.status === 'resolved' && (
                  <button
                    onClick={() => updateTicketStatus('closed')}
                    disabled={updatingStatus}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors flex items-center"
                  >
                    {updatingStatus ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <span className="mr-2">🔒</span>
                    )}
                    {updatingStatus ? 'Actualizando...' : 'Cerrar Ticket'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Información del Ticket */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">📋</span>
                Información del Ticket
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium text-gray-500">Módulo</span>
                  <span className="text-sm text-gray-900 text-right">{ticket.module.label}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium text-gray-500">Tipo</span>
                  <span className="text-sm text-gray-900 text-right">{ticket.ticket_type.label}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium text-gray-500">Reportado por</span>
                  <div className="text-right">
                    <div className="text-sm text-gray-900">{ticket.user.name}</div>
                    <div className="text-xs text-gray-500">{ticket.user.email}</div>
                  </div>
                </div>
                {ticket.assigned_to_user && (
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-medium text-gray-500">Asignado a</span>
                    <div className="text-right">
                      <div className="text-sm text-gray-900">{ticket.assigned_to_user.name}</div>
                      <div className="text-xs text-gray-500">{ticket.assigned_to_user.email}</div>
                    </div>
                  </div>
                )}
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium text-gray-500">Fecha de creación</span>
                  <span className="text-sm text-gray-900 text-right">
                    {new Date(ticket.created_at).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Descripción */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">📝</span>
                Descripción
              </h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
            </div>

            {/* Archivos Adjuntos - ACTUALIZADO CON BLOB URLs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">📎</span>
                Archivos Adjuntos
                <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  {attachments.length}
                </span>
              </h3>

              {/* Subir nuevos archivos */}
              {canUploadFiles && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <label htmlFor="file-input" className="block text-sm font-medium text-blue-700 mb-2">
                    📤 Agregar archivos
                  </label>
                  <input
                    id="file-input"
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-white file:text-blue-700 hover:file:bg-blue-50 border border-blue-300 rounded-lg p-2"
                  />
                  
                  {selectedFiles.length > 0 && (
                    <div className="mt-3 p-3 bg-white rounded-lg border border-blue-200">
                      <p className="text-sm font-medium text-blue-800 mb-2">Archivos seleccionados:</p>
                      <ul className="space-y-2">
                        {selectedFiles.map((file, index) => (
                          <li key={index} className="text-sm text-gray-700 flex items-center justify-between bg-blue-50 px-3 py-2 rounded">
                            <div className="flex items-center">
                              <span className="mr-2">📄</span>
                              <span className="font-medium">{file.name}</span>
                            </div>
                            <span className="text-xs text-blue-600 bg-white px-2 py-1 rounded">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                          </li>
                        ))}
                      </ul>
                      <button
                        onClick={handleUploadFiles}
                        disabled={uploadingFiles}
                        className="mt-3 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center font-medium"
                      >
                        {uploadingFiles ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Subiendo archivos...
                          </>
                        ) : (
                          <>
                            <span className="mr-2">🚀</span>
                            Subir Archivos
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Lista de archivos adjuntos */}
              {loadingAttachments ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 text-sm mt-3">Cargando archivos...</p>
                </div>
              ) : attachments.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                  <div className="text-5xl mb-3">📁</div>
                  <p className="text-gray-500 font-medium">No hay archivos adjuntos</p>
                  {canUploadFiles && (
                    <p className="text-gray-400 text-sm mt-1">Usa el formulario de arriba para agregar archivos</p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {attachments.map((attachment) => {
                      const filename = attachment.filename || 'archivo_sin_nombre';
                      const mimeType = attachment.mime_type || 'application/octet-stream';
                      const sizeBytes = attachment.size_bytes || '0';
                      const uploaderName = attachment.uploader?.name || 'Usuario';
                      
                      const isImage = mimeType.startsWith('image/');
                      const isPDF = mimeType === 'application/pdf';
                      const isVideo = mimeType.startsWith('video/');
                      const isAudio = mimeType.startsWith('audio/');
                      const isLoading = loadingImages[attachment.id];
                      
                      return (
                        <div 
                          key={attachment.id} 
                          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 hover:border-blue-300 group"
                        >
                          <div className="flex items-start space-x-3">
                            {/* MINIATURA ACTUALIZADA CON BLOB URLs */}
                            {isImage ? (
                              <div 
                                className="flex-shrink-0 relative group cursor-pointer"
                                onClick={() => !isLoading && openImageModal(attachment)}
                              >
                                <div className="w-20 h-20 bg-gray-100 rounded-lg border-2 border-gray-300 overflow-hidden flex items-center justify-center image-preview">
                                  {isLoading ? (
                                    <div className="flex items-center justify-center w-full h-full">
                                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                    </div>
                                  ) : (
                                    <img 
                                      src={imageBlobUrls[attachment.id] || '/image-placeholder.svg'}
                                      alt={filename}
                                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                                      onError={(e) => {
                                        console.error('❌ Error cargando imagen blob:', attachment.id);
                                        e.currentTarget.src = '/image-placeholder.svg';
                                      }}
                                    />
                                  )}
                                </div>
                                
                                <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs px-1 rounded">
                                  IMG
                                </div>

                                {!isLoading && (
                                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <span className="text-white text-sm font-medium bg-black bg-opacity-50 px-2 py-1 rounded">
                                      👁️ Ver
                                    </span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex-shrink-0 relative">
                                <div className="w-20 h-20 bg-gray-100 rounded-lg border-2 border-gray-300 flex items-center justify-center">
                                  <span className="text-3xl">
                                    {isPDF ? '📄' : 
                                     isVideo ? '🎥' : 
                                     isAudio ? '🎵' : '📎'}
                                  </span>
                                </div>
                                <div className="absolute -top-1 -right-1 bg-gray-600 text-white text-xs px-1 rounded">
                                  {isPDF ? 'PDF' : 
                                   isVideo ? 'VID' : 
                                   isAudio ? 'AUD' : 'FILE'}
                                </div>
                              </div>
                            )}
                            
                            {/* INFORMACIÓN DEL ARCHIVO */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <p 
                                    className="text-sm font-semibold text-gray-900 truncate"
                                    title={filename}
                                  >
                                    {filename}
                                  </p>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                      {attachmentService.formatFileSize(sizeBytes)}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      • Subido por: {uploaderName}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-400 mt-1">
                                    {new Date(attachment.created_at).toLocaleDateString('es-ES')}
                                  </p>
                                </div>
                                
                                {/* ACCIONES */}
                                <div className="flex items-center space-x-1 ml-2">
                                  <button
                                    onClick={() => handleDownload(attachment)}
                                    className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                                    title="Descargar archivo"
                                  >
                                    <span className="text-lg">⬇️</span>
                                  </button>
                                  {(isAdmin || attachment.uploader?.email === session?.user?.email) && (
                                    <button
                                      onClick={() => handleDeleteAttachment(attachment.id)}
                                      className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                      title="Eliminar archivo"
                                    >
                                      <span className="text-lg">🗑️</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                              
                              {isImage && !isLoading && (
                                <button
                                  onClick={() => openImageModal(attachment)}
                                  className="mt-2 text-xs text-blue-600 hover:text-blue-800 flex items-center hover:underline"
                                >
                                  <span className="mr-1">👁️</span>
                                  Ver imagen completa
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content - Conversación */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <span className="mr-2">💬</span>
                Conversación
                <span className="ml-2 bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                  {ticket.messages.length}
                </span>
              </h3>
              
              {ticket.messages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">💭</div>
                  <p className="text-gray-500">No hay mensajes aún.</p>
                  <p className="text-gray-400 text-sm mt-1">Sé el primero en comentar.</p>
                </div>
              ) : (
                <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                  {ticket.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-4 rounded-lg border ${
                        message.sender.email === session?.user?.email 
                          ? 'bg-blue-50 border-blue-200' 
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">
                            {message.sender.name}
                          </span>
                          {message.sender.email === session?.user?.email && (
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                              Tú
                            </span>
                          )}
                          {message.sender.email === ticket.user.email && !isOwner && (
                            <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                              Reportante
                            </span>
                          )}
                          {message.is_internal && (
                            <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                              Interno
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(message.created_at).toLocaleDateString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div className="text-gray-700 whitespace-pre-wrap">
                        {message.body}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Formulario de respuesta */}
              {canReply && (
                <form onSubmit={handleSendMessage} className="border-t border-gray-200 pt-6">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={
                      isOwner 
                        ? "Escribe un comentario sobre tu ticket..."
                        : "Escribe tu respuesta al usuario..."
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                    rows={3}
                    required
                    disabled={sendingMessage}
                  />
                  <div className="flex justify-between items-center mt-4">
                    <p className="text-sm text-gray-500">
                      {isOwner 
                        ? "Tu comentario será visible para el equipo de soporte."
                        : "Tu respuesta será visible para el usuario."
                      }
                    </p>
                    <button
                      type="submit"
                      disabled={sendingMessage || !newMessage.trim()}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                    >
                      {sendingMessage ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Enviando...
                        </>
                      ) : (
                        <>
                          <span className="mr-2">📤</span>
                          Enviar
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL ACTUALIZADO PARA VISUALIZACIÓN DE IMÁGENES */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4 modal-enter">
          <div className="bg-white rounded-xl max-w-6xl max-h-full w-full flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedImage.filename}</h3>
                <p className="text-sm text-gray-500 mt-1">Vista previa de imagen</p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    // Descargar usando el endpoint de descarga
                    const link = document.createElement('a');
                    link.href = selectedImage.url.replace('/view', '/download');
                    link.download = selectedImage.filename;
                    link.click();
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <span className="mr-2">⬇️</span>
                  Descargar
                </button>
                <button
                  onClick={closeImageModal}
                  className="text-gray-500 hover:text-gray-700 text-2xl p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="flex-1 p-6 overflow-auto flex items-center justify-center bg-gray-900">
              <img 
                src={selectedImage.url} 
                alt={selectedImage.filename}
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl"
                onError={(e) => {
                  console.error('❌ Error cargando imagen en modal');
                  e.currentTarget.style.display = 'none';
                  const errorDiv = document.createElement('div');
                  errorDiv.className = 'text-white text-center p-8';
                  errorDiv.innerHTML = `
                    <div class="text-6xl mb-4">❌</div>
                    <h3 class="text-xl font-bold mb-2">Error al cargar la imagen</h3>
                    <p class="text-gray-300">No se pudo cargar la imagen. Puede intentar descargarla.</p>
                  `;
                  e.currentTarget.parentNode?.appendChild(errorDiv);
                }}
              />
            </div>
            
            <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>Use la rueda del mouse o gestos para hacer zoom</span>
                <button
                  onClick={closeImageModal}
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}