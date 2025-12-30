'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useApi } from '@/hooks/useApi';
import { useTickets } from '@/hooks/useTickets';
import { attachmentService, Attachment } from '@/services/attachmentService';
import Header from '@/components/layout/Header';
import { usePermissions } from '@/hooks/usePermissions';
import styles from './page.module.css';

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
  
  const { isAdmin, isTechnician, canEditTickets, canChangeStatus, canDeleteTickets, email } = usePermissions();

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
  const [isMobile, setIsMobile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const ticketId = useMemo(() => {
    if (!params || !params.id) {
      console.error('No se encontró ID en los parámetros');
      return null;
    }
    return params.id as string;
  }, [params]);

  // Detectar si es móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Scroll al último mensaje automáticamente
  useEffect(() => {
    if (messagesEndRef.current && ticket?.messages?.length) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [ticket?.messages]);

  useEffect(() => {
    if (ticketId) {
      fetchTicket();
      fetchAttachments();
    }
  }, [ticketId]);

  useEffect(() => {
    const loadImages = async () => {
      const imageAttachments = attachments.filter(att => 
        att.mime_type.startsWith('image/')
      );

      if (imageAttachments.length === 0) return;

      console.log(`🔄 Cargando ${imageAttachments.length} imágenes con autenticación...`);
      
      const newBlobUrls: Record<string, string> = {};
      const newLoadingImages: Record<string, boolean> = {};

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

  useEffect(() => {
    return () => {
      Object.values(imageBlobUrls).forEach(blobUrl => {
        if (blobUrl.startsWith('blob:')) {
          attachmentService.revokeBlobUrl(blobUrl);
        }
      });
      if (selectedImage?.url.startsWith('blob:')) {
        attachmentService.revokeBlobUrl(selectedImage.url);
      }
    };
  }, [imageBlobUrls, selectedImage]);

  const fetchTicket = async () => {
    if (!ticketId) {
      setError('ID de ticket no válido');
      setLoading(false);
      return;
    }

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
    if (!ticketId) {
      setAttachments([]);
      return;
    }

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
    if (!newMessage.trim() || !ticketId) return;

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
    if (!ticketId) return;
    
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
    if (selectedFiles.length === 0 || !ticketId) return;

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

  if (!ticketId) {
    return (
      <div className={styles.container}>
        <Header />
        <div className={styles.main}>
          <div className={styles.error}>
            <h1>Ticket no encontrado</h1>
            <p>El ID del ticket no es válido.</p>
            <div className={styles.actions}>
              <Link href="/tickets" className={styles.primaryButton}>
                ← Volver a Tickets
              </Link>
              <Link href="/dashboard" className={styles.secondaryButton}>
                Ir al Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <Header />
        <div className={styles.main}>
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Cargando ticket...</p>
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
          <div className={styles.error}>
            <h1>{error}</h1>
            <p>El ticket que buscas no existe o no tienes permisos para verlo.</p>
            <div className={styles.actions}>
              <Link href="/tickets" className={styles.primaryButton}>
                ← Volver a Tickets
              </Link>
              <Link href="/dashboard" className={styles.secondaryButton}>
                Ir al Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className={styles.container}>
        <Header />
        <div className={styles.main}>
          <div className={styles.error}>
            <h1>Ticket no encontrado</h1>
            <p>No se pudo cargar la información del ticket.</p>
            <div className={styles.actions}>
              <Link href="/tickets" className={styles.primaryButton}>
                ← Volver a Tickets
              </Link>
              <button 
                onClick={() => window.location.reload()} 
                className={styles.secondaryButton}
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isOwner = email === ticket.user.email;
  const canReply = canEditTickets || isOwner;
  const canUploadFiles = canEditTickets || isOwner;

  return (
    <div className={styles.container}>
      <Header />
      
      <div className={styles.main}>
        {/* Header */}
        <div className={styles.header}>
          <Link 
            href="/tickets" 
            className={styles.backLink}
          >
            <span>←</span>
            <span>Volver a Tickets</span>
          </Link>
          <h1 className={styles.title}>{ticket.subject || 'Sin asunto'}</h1>
          <div className={styles.meta}>
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
            <span className={styles.code}>Código: {ticket.code}</span>
            <span className={styles.date}>
              Creado: {new Date(ticket.created_at).toLocaleDateString('es-ES')}
            </span>
          </div>

          {canChangeStatus && (
            <div className={styles.actionButtons}>
              {ticket.status === 'open' && (
                <button
                  onClick={() => updateTicketStatus('in_progress')}
                  disabled={updatingStatus}
                  className={styles.actionButton}
                >
                  {updatingStatus ? (
                    <div className={styles.spinner}></div>
                  ) : (
                    <span>🛠️</span>
                  )}
                  {updatingStatus ? 'Actualizando...' : 'Tomar Ticket'}
                </button>
              )}
              {ticket.status === 'in_progress' && (
                <button
                  onClick={() => updateTicketStatus('resolved')}
                  disabled={updatingStatus}
                  className={styles.actionButton}
                >
                  {updatingStatus ? (
                    <div className={styles.spinner}></div>
                  ) : (
                    <span>✅</span>
                  )}
                  {updatingStatus ? 'Actualizando...' : 'Marcar Resuelto'}
                </button>
              )}
              {ticket.status === 'resolved' && (
                <button
                  onClick={() => updateTicketStatus('closed')}
                  disabled={updatingStatus}
                  className={styles.actionButton}
                >
                  {updatingStatus ? (
                    <div className={styles.spinner}></div>
                  ) : (
                    <span>🔒</span>
                  )}
                  {updatingStatus ? 'Actualizando...' : 'Cerrar Ticket'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Mensajería primero en móvil */}
        {isMobile && (
          <div className={styles.messagingSection}>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>
                <span>💬</span>
                Conversación
                <span className={styles.badge}>{ticket.messages.length}</span>
              </h3>
              
              {ticket.messages.length === 0 ? (
                <div className={styles.empty}>
                  <p>No hay mensajes aún.</p>
                  <p>Sé el primero en comentar.</p>
                </div>
              ) : (
                <div className={styles.messagesList}>
                  {ticket.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`${styles.message} ${
                        message.sender.email === email ? styles.messageOwn : ''
                      }`}
                    >
                      <div className={styles.messageHeader}>
                        <div className={styles.messageSender}>
                          {message.sender.name}
                          {message.sender.email === email && (
                            <span className={styles.youBadge}>Tú</span>
                          )}
                          {message.sender.email === ticket.user.email && !isOwner && (
                            <span className={styles.reporterBadge}>Reportante</span>
                          )}
                          {message.is_internal && (
                            <span className={styles.internalBadge}>Interno</span>
                          )}
                        </div>
                        <span className={styles.messageTime}>
                          {new Date(message.created_at).toLocaleDateString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div className={styles.messageBody}>
                        {message.body}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Formulario sticky en móvil */}
            {canReply && (
              <div className={styles.stickyMessageForm}>
                <form onSubmit={handleSendMessage} className={styles.messageForm}>
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={
                      isOwner 
                        ? "Escribe un comentario sobre tu ticket..."
                        : "Escribe tu respuesta al usuario..."
                    }
                    className={styles.messageInput}
                    rows={2}
                    required
                    disabled={sendingMessage}
                  />
                  <button
                    type="submit"
                    disabled={sendingMessage || !newMessage.trim()}
                    className={styles.sendButton}
                  >
                    {sendingMessage ? (
                      <>
                        <div className={styles.spinner}></div>
                        Enviando...
                      </>
                    ) : (
                      'Enviar'
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        <div className={styles.layout}>
          {/* Sidebar - Información, Descripción y Archivos */}
          <div className={styles.sidebar}>
            {/* Información del Ticket */}
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>
                <span>📋</span>
                Información del Ticket
              </h3>
              <div className={styles.infoGrid}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Módulo</span>
                  <span className={styles.infoValue}>{ticket.module.label}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Tipo</span>
                  <span className={styles.infoValue}>{ticket.ticket_type.label}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Reportado por</span>
                  <div className={styles.infoValue}>
                    <div>{ticket.user.name}</div>
                    <div className={styles.email}>{ticket.user.email}</div>
                  </div>
                </div>
                {ticket.assigned_to_user && (
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Asignado a</span>
                    <div className={styles.infoValue}>
                      <div>{ticket.assigned_to_user.name}</div>
                      <div className={styles.email}>{ticket.assigned_to_user.email}</div>
                    </div>
                  </div>
                )}
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Fecha de creación</span>
                  <span className={styles.infoValue}>
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
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>
                <span>📝</span>
                Descripción
              </h3>
              <p className={styles.description}>{ticket.description}</p>
            </div>

            {/* Archivos Adjuntos */}
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>
                <span>📎</span>
                Archivos Adjuntos
                <span className={styles.badge}>{attachments.length}</span>
              </h3>

              {/* Subir archivos */}
              {canUploadFiles && (
                <div className={styles.fileUpload}>
                  <input
                    id="file-input"
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className={styles.fileInput}
                  />
                  <label htmlFor="file-input" className={styles.fileButton}>
                    📤 Seleccionar archivos
                  </label>
                  
                  {selectedFiles.length > 0 && (
                    <div className={styles.selectedFiles}>
                      <p>Archivos seleccionados:</p>
                      <ul>
                        {selectedFiles.map((file, index) => (
                          <li key={index}>
                            <span>{file.name}</span>
                            <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                          </li>
                        ))}
                      </ul>
                      <button
                        onClick={handleUploadFiles}
                        disabled={uploadingFiles}
                        className={styles.uploadButton}
                      >
                        {uploadingFiles ? (
                          <>
                            <div className={styles.spinner}></div>
                            Subiendo...
                          </>
                        ) : (
                          'Subir Archivos'
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Lista de archivos */}
              {loadingAttachments ? (
                <div className={styles.loading}>
                  <div className={styles.spinner}></div>
                  <p>Cargando archivos...</p>
                </div>
              ) : attachments.length === 0 ? (
                <div className={styles.empty}>
                  <p>No hay archivos adjuntos</p>
                </div>
              ) : (
                <div className={styles.attachmentsGrid}>
                  {attachments.map((attachment) => {
                    const isImage = attachment.mime_type.startsWith('image/');
                    const isLoading = loadingImages[attachment.id];
                    
                    return (
                      <div 
                        key={attachment.id} 
                        className={styles.attachmentCard}
                        onClick={isImage ? () => openImageModal(attachment) : undefined}
                      >
                        {isImage ? (
                          <div className={styles.imageContainer}>
                            {isLoading ? (
                              <div className={styles.loading}>
                                <div className={styles.spinner}></div>
                              </div>
                            ) : (
                              <img 
                                src={imageBlobUrls[attachment.id] || '/image-placeholder.svg'}
                                alt={attachment.filename}
                                className={styles.attachmentPreview}
                              />
                            )}
                            <div className={styles.imageOverlay}>
                              <span>👁️ Ver</span>
                            </div>
                          </div>
                        ) : (
                          <div className={styles.fileIcon}>
                            {attachmentService.getFileIcon(attachment.mime_type)}
                          </div>
                        )}
                        
                        <div className={styles.attachmentInfo}>
                          <div className={styles.attachmentName}>{attachment.filename}</div>
                          <div className={styles.attachmentSize}>
                            {attachmentService.formatFileSize(attachment.size_bytes)}
                          </div>
                          <div className={styles.attachmentActions}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(attachment);
                              }}
                              className={styles.downloadButton}
                            >
                              ⬇️
                            </button>
                            {(isAdmin || attachment.uploader?.email === email) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteAttachment(attachment.id);
                                }}
                                className={styles.deleteButton}
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Main Content - Conversación (solo en desktop) */}
          {!isMobile && (
            <div className={styles.content}>
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>
                  <span>💬</span>
                  Conversación
                  <span className={styles.badge}>{ticket.messages.length}</span>
                </h3>
                
                {ticket.messages.length === 0 ? (
                  <div className={styles.empty}>
                    <p>No hay mensajes aún.</p>
                    <p>Sé el primero en comentar.</p>
                  </div>
                ) : (
                  <div className={styles.messagesList}>
                    {ticket.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`${styles.message} ${
                          message.sender.email === email ? styles.messageOwn : ''
                        }`}
                      >
                        <div className={styles.messageHeader}>
                          <div className={styles.messageSender}>
                            {message.sender.name}
                            {message.sender.email === email && (
                              <span className={styles.youBadge}>Tú</span>
                            )}
                            {message.sender.email === ticket.user.email && !isOwner && (
                              <span className={styles.reporterBadge}>Reportante</span>
                            )}
                            {message.is_internal && (
                              <span className={styles.internalBadge}>Interno</span>
                            )}
                          </div>
                          <span className={styles.messageTime}>
                            {new Date(message.created_at).toLocaleDateString('es-ES', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <div className={styles.messageBody}>
                          {message.body}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}

                {/* Formulario de respuesta */}
                {canReply && (
                  <form onSubmit={handleSendMessage} className={styles.messageForm}>
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={
                        isOwner 
                          ? "Escribe un comentario sobre tu ticket..."
                          : "Escribe tu respuesta al usuario..."
                      }
                      className={styles.messageInput}
                      rows={3}
                      required
                      disabled={sendingMessage}
                    />
                    <div className={styles.messageActions}>
                      <button
                        type="submit"
                        disabled={sendingMessage || !newMessage.trim()}
                        className={styles.sendButton}
                      >
                        {sendingMessage ? (
                          <>
                            <div className={styles.spinner}></div>
                            Enviando...
                          </>
                        ) : (
                          'Enviar'
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de imagen */}
      {selectedImage && (
        <div className={styles.modal} onClick={closeImageModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{selectedImage.filename}</h3>
              <button onClick={closeImageModal} className={styles.closeButton}>
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <img 
                src={selectedImage.url} 
                alt={selectedImage.filename}
                className={styles.modalImage}
              />
            </div>
            <div className={styles.modalFooter}>
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = selectedImage.url.replace('/view', '/download');
                  link.download = selectedImage.filename;
                  link.click();
                }}
                className={styles.downloadButton}
              >
                ⬇️ Descargar
              </button>
              <button onClick={closeImageModal} className={styles.closeButton}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}