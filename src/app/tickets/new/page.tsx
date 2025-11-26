// frontend/src/app/tickets/new/page.tsx - ACTUALIZADO CON CSS MODULES
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTickets } from '@/hooks/useTickets';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import styles from './page.module.css';

// Módulos según tu especificación
const MODULES = [
  { id: 1, name: 'HIS - Asistencial' },
  { id: 2, name: 'CRM - Administrativo' },
  { id: 3, name: 'ERP - Financiero' },
];

// Tipos de ticket según tu especificación
const TICKET_TYPES = [
  { id: 1, name: 'Consulta' },
  { id: 2, name: 'Problema' },
  { id: 3, name: 'Requerimiento' },
  { id: 4, name: 'Capacitación' },
  { id: 5, name: 'Sugerencia' },
];

// Tipos de archivos permitidos
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'video/mp4',
  'video/avi',
  'audio/mpeg',
  'audio/wav',
  'application/pdf'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function NewTicketPage() {
  const router = useRouter();
  const { addTicket } = useTickets();
  
  const [formData, setFormData] = useState({
    module_id: '',
    ticket_type_id: '',
    subject: '',
    description: '',
  });
  
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.module_id) {
      newErrors.module_id = 'Debe seleccionar un módulo';
    }

    if (!formData.ticket_type_id) {
      newErrors.ticket_type_id = 'Debe seleccionar un tipo de ticket';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    }

    // Validar archivos
    files.forEach((file, index) => {
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        newErrors[`file_${index}`] = `Tipo de archivo no permitido: ${file.name}`;
      }
      if (file.size > MAX_FILE_SIZE) {
        newErrors[`file_${index}`] = `Archivo demasiado grande: ${file.name} (máximo 10MB)`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
  
    setLoading(true);
    setErrors({});
    setUploadProgress(0);
  
    try {
      // Simular progreso de subida
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);
  
      // Crear ticket (los archivos se subirán automáticamente)
      await addTicket({
        module_id: parseInt(formData.module_id),
        ticket_type_id: parseInt(formData.ticket_type_id),
        subject: formData.subject,
        description: formData.description,
      }, files); // ← Los archivos se pasan aquí
  
      clearInterval(progressInterval);
      setUploadProgress(100);
  
      // Esperar un momento para mostrar el 100%
      setTimeout(() => {
        router.push('/tickets');
      }, 500);
      
    } catch (err: any) {
      console.error('Error creando ticket:', err);
      setErrors({ submit: err.message || 'Error al crear el ticket' });
      setUploadProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

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
          <h1 className={styles.title}>Crear Nuevo Ticket de Soporte</h1>
          <p className={styles.subtitle}>
            Complete todos los campos obligatorios para crear un nuevo ticket de soporte.
          </p>
        </div>

        {/* Barra de progreso */}
        {loading && uploadProgress > 0 && (
          <div className={styles.progressContainer}>
            <div className={styles.progressInfo}>
              <span>Subiendo archivos...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill}
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Formulario */}
        <div className={styles.formContainer}>
          <form onSubmit={handleSubmit} className={styles.form}>
            {errors.submit && (
              <div className={styles.errorAlert}>
                <p className={styles.errorTitle}>Error</p>
                <p className={styles.errorMessage}>{errors.submit}</p>
              </div>
            )}

            {/* Módulo (Obligatorio) */}
            <div className={styles.formGroup}>
              <label htmlFor="module_id" className={styles.label}>
                Módulo <span className={styles.required}>*</span>
              </label>
              <select
                id="module_id"
                name="module_id"
                value={formData.module_id}
                onChange={handleChange}
                required
                className={`${styles.select} ${errors.module_id ? styles.inputError : ''}`}
              >
                <option value="">Seleccione un módulo</option>
                {MODULES.map(module => (
                  <option key={module.id} value={module.id}>
                    {module.name}
                  </option>
                ))}
              </select>
              {errors.module_id && (
                <p className={styles.fieldError}>
                  <span className={styles.errorIcon}>⚠️</span>
                  {errors.module_id}
                </p>
              )}
            </div>

            {/* Tipo de Ticket (Obligatorio) */}
            <div className={styles.formGroup}>
              <label htmlFor="ticket_type_id" className={styles.label}>
                Tipo de Ticket <span className={styles.required}>*</span>
              </label>
              <select
                id="ticket_type_id"
                name="ticket_type_id"
                value={formData.ticket_type_id}
                onChange={handleChange}
                required
                className={`${styles.select} ${errors.ticket_type_id ? styles.inputError : ''}`}
              >
                <option value="">Seleccione un tipo</option>
                {TICKET_TYPES.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
              {errors.ticket_type_id && (
                <p className={styles.fieldError}>
                  <span className={styles.errorIcon}>⚠️</span>
                  {errors.ticket_type_id}
                </p>
              )}
            </div>

            {/* Asunto (Opcional) */}
            <div className={styles.formGroup}>
              <label htmlFor="subject" className={styles.label}>
                Asunto (Opcional)
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="Resumen breve del problema o solicitud..."
                className={styles.input}
              />
            </div>

            {/* Descripción (Obligatoria) */}
            <div className={styles.formGroup}>
              <label htmlFor="description" className={styles.label}>
                Descripción Detallada <span className={styles.required}>*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={6}
                placeholder="Describa en detalle el problema, solicitud o consulta. Incluya pasos para reproducir el problema si aplica..."
                className={`${styles.textarea} ${errors.description ? styles.inputError : ''}`}
              />
              {errors.description && (
                <p className={styles.fieldError}>
                  <span className={styles.errorIcon}>⚠️</span>
                  {errors.description}
                </p>
              )}
            </div>

            {/* Adjuntar Archivos */}
            <div className={styles.formGroup}>
              <label htmlFor="attachments" className={styles.label}>
                Adjuntar Archivos (Opcional)
              </label>
              <div className={styles.fileDropzone}>
                <input
                  type="file"
                  id="attachments"
                  multiple
                  accept="image/*,video/*,audio/*,.pdf"
                  onChange={handleFileChange}
                  className={styles.hiddenInput}
                />
                <label
                  htmlFor="attachments"
                  className={styles.fileButton}
                >
                  <span className={styles.fileIcon}>📎</span>
                  Seleccionar Archivos
                </label>
                <p className={styles.helpText}>
                  Formatos permitidos: imágenes (JPEG, PNG, GIF), video (MP4, AVI), audio (MP3, WAV), PDF. Máximo 10MB por archivo.
                </p>
              </div>

              {/* Lista de archivos seleccionados */}
              {files.length > 0 && (
                <div className={styles.attachmentsList}>
                  <h4 className={styles.attachmentsTitle}>Archivos seleccionados:</h4>
                  <ul className={styles.attachmentsContainer}>
                    {files.map((file, index) => (
                      <li key={index} className={styles.attachmentItem}>
                        <div className={styles.fileInfo}>
                          <span className={styles.fileName}>{file.name}</span>
                          <span className={styles.fileSize}>
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className={styles.removeButton}
                        >
                          <span className={styles.removeIcon}>×</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Botones */}
            <div className={styles.actions}>
              <Link
                href="/tickets"
                className={styles.cancelButton}
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={loading}
                className={styles.submitButton}
              >
                {loading ? (
                  <>
                    <div className={styles.spinner}></div>
                    Creando Ticket...
                  </>
                ) : (
                  'Crear Ticket'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}