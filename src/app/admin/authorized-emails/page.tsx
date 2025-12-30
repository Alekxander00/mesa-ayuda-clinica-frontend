// frontend/src/app/admin/authorized-emails/page.tsx - CON CSS MODULE
'use client';

import { useState, useEffect } from 'react';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import styles from './AuthorizedEmails.module.css';

interface AuthorizedEmail {
  id: string;
  email: string;
  allowed_role: string;
  created_at: string;
}

export default function AuthorizedEmailsPage() {
  const { get, post, del: deleteApi } = useApi();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [emails, setEmails] = useState<AuthorizedEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    role: 'user'
  });
  
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Verificar si es admin
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'admin') {
        router.push('/unauthorized');
      }
    }
  }, [user, authLoading, router]);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const response = await get('/authorized-emails');
      if (response.success) {
        setEmails(response.data || []);
      }
    } catch (error: any) {
      setError('Error cargando correos autorizados');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchEmails();
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email.trim()) {
      setError('Por favor ingresa un correo electrónico');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await post('/authorized-emails', formData);
      
      if (response.success) {
        setSuccess('Correo autorizado agregado exitosamente');
        setFormData({ email: '', role: 'user' });
        fetchEmails();
        
        // Auto-ocultar mensaje de éxito después de 5 segundos
        setTimeout(() => {
          setSuccess('');
        }, 5000);
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'Error al agregar correo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`¿Estás seguro de eliminar el correo ${email} de la lista autorizada?`)) {
      return;
    }
    
    try {
      setError('');
      setSuccess('');
      
      const response = await deleteApi(`/authorized-emails/${id}`);
      
      if (response.success) {
        setSuccess(`Correo ${email} eliminado exitosamente`);
        fetchEmails();
        
        setTimeout(() => {
          setSuccess('');
        }, 5000);
      }
    } catch (error: any) {
      setError('Error al eliminar correo');
    }
  };

  const handleImport = async () => {
    if (!importText.trim()) {
      setError('Por favor ingresa al menos un correo para importar');
      return;
    }

    setIsImporting(true);
    setError('');
    setSuccess('');

    try {
      const lines = importText.split('\n')
        .map(line => line.trim())
        .filter(line => line && line.includes('@'));
      
      const emailsToImport = lines.map(line => {
        const [email, role = 'user'] = line.split(',').map(s => s.trim());
        return { email, role };
      });
      
      if (emailsToImport.length === 0) {
        setError('No hay correos válidos para importar');
        return;
      }
      
      const response = await post('/authorized-emails/import', { emails: emailsToImport });
      
      if (response.success) {
        setSuccess(`Importados ${response.summary?.success || emailsToImport.length} correos exitosamente`);
        setImportText('');
        setShowImport(false);
        fetchEmails();
        
        setTimeout(() => {
          setSuccess('');
        }, 5000);
      }
    } catch (error: any) {
      setError('Error en la importación. Verifica el formato de los datos.');
    } finally {
      setIsImporting(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return styles.roleAdmin;
      case 'technician': return styles.roleTechnician;
      case 'auditor': return styles.roleAuditor;
      default: return styles.roleUser;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return '👑';
      case 'technician': return '🔧';
      case 'auditor': return '📊';
      default: return '👤';
    }
  };

  // Mostrar loading mientras se verifica autenticación
  if (authLoading) {
    return (
      <div className={styles.authLoadingContainer}>
        <Header />
        <div className={styles.loadingCenter}>
          <div className={styles.spinner}></div>
          <p>Verificando acceso...</p>
        </div>
      </div>
    );
  }

  // Si no es admin, no renderizar nada (ya se redirigió en el useEffect)
  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className={styles.container}>
      <Header />
      
      <main className={styles.main}>
        {/* Navegación */}
        <div className={styles.pageHeader}>
          <div className={styles.pageTitleContainer}>
            <h1 className={styles.pageTitle}>
              <span className={styles.pageTitleIcon}>✉️</span>
              Correos Autorizados
            </h1>
            <p className={styles.pageSubtitle}>
              Gestiona los correos que pueden acceder al sistema
            </p>
          </div>
          
          <div className={styles.headerActions}>
            <Link
              href="/dashboard"
              className={styles.backButton}
            >
              <span>←</span>
              <span>Volver al Dashboard</span>
            </Link>
          </div>
        </div>

        {/* Mensajes de estado */}
        <div className={styles.messagesContainer}>
          {error && (
            <div className={`${styles.message} ${styles.errorMessage}`}>
              <div className={styles.messageContent}>
                <span className={styles.messageIcon}>⚠️</span>
                <div>
                  <p className={styles.messageTitle}>Error</p>
                  <p className={styles.messageText}>{error}</p>
                </div>
              </div>
              <button
                onClick={() => setError('')}
                className={styles.messageCloseButton}
                aria-label="Cerrar mensaje de error"
              >
                ✕
              </button>
            </div>
          )}
          
          {success && (
            <div className={`${styles.message} ${styles.successMessage}`}>
              <div className={styles.messageContent}>
                <span className={styles.messageIcon}>✅</span>
                <div>
                  <p className={styles.messageTitle}>Éxito</p>
                  <p className={styles.messageText}>{success}</p>
                </div>
              </div>
              <button
                onClick={() => setSuccess('')}
                className={styles.messageCloseButton}
                aria-label="Cerrar mensaje de éxito"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Contenido principal */}
        <div className={styles.contentGrid}>
          {/* Formulario para agregar correos */}
          <div className={styles.mainContent}>
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>
                <span className={styles.cardTitleIcon}>➕</span>
                Agregar Nuevo Correo
              </h2>
              
              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="email" className={styles.label}>
                      Correo Electrónico *
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={styles.input}
                      placeholder="ejemplo@dominio.com"
                      aria-label="Correo electrónico"
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="role" className={styles.label}>
                      Rol
                    </label>
                    <select
                      id="role"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className={styles.select}
                      aria-label="Rol del usuario"
                    >
                      <option value="user">👤 Usuario</option>
                      <option value="technician">🔧 Técnico</option>
                      <option value="admin">👑 Administrador</option>
                      <option value="auditor">📊 Auditor</option>
                    </select>
                  </div>
                </div>
                
                <div className={styles.formActions}>
                  <button
                    type="submit"
                    disabled={isSubmitting || !formData.email.trim()}
                    className={`${styles.button} ${styles.primaryButton}`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className={styles.buttonSpinner}></div>
                        Procesando...
                      </>
                    ) : (
                      <>
                        <span>➕</span>
                        <span>Agregar Correo</span>
                      </>
                    )}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setShowImport(!showImport)}
                    className={`${styles.button} ${styles.secondaryButton}`}
                  >
                    {showImport ? (
                      <>
                        <span>✕</span>
                        <span>Cancelar</span>
                      </>
                    ) : (
                      <>
                        <span>📥</span>
                        <span>Importar Múltiples</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Importación masiva */}
            {showImport && (
              <div className={`${styles.card} ${styles.importCard}`}>
                <h3 className={styles.importTitle}>
                  <span className={styles.importTitleIcon}>📥</span>
                  Importar Múltiples Correos
                </h3>
                <div className={styles.importHelp}>
                  <p className={styles.importHelpText}>
                    <strong>Formato:</strong> Un correo por línea. Opcionalmente agrega el rol después de una coma.
                  </p>
                  <p className={styles.importExample}>
                    <strong>Ejemplo:</strong>
                  </p>
                  <pre className={styles.importExampleCode}>
{`usuario@empresa.com,user
tecnico@empresa.com,technician
admin@empresa.com,admin
auditor@empresa.com,auditor`}
                  </pre>
                </div>
                
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  className={styles.importTextarea}
                  placeholder="Pega aquí los correos a importar..."
                  aria-label="Correos a importar"
                />
                
                <div className={styles.importActions}>
                  <span className={styles.importCount}>
                    {importText.split('\n').filter(line => line.trim() && line.includes('@')).length} correos válidos detectados
                  </span>
                  <button
                    onClick={handleImport}
                    disabled={isImporting || !importText.trim()}
                    className={`${styles.button} ${styles.importButton}`}
                  >
                    {isImporting ? (
                      <>
                        <div className={styles.buttonSpinner}></div>
                        Importando...
                      </>
                    ) : (
                      <>
                        <span>📥</span>
                        <span>Importar Correos</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Lista de correos */}
            <div className={styles.card}>
              <div className={styles.tableHeader}>
                <h2 className={styles.tableTitle}>
                  <span className={styles.tableTitleIcon}>📋</span>
                  Correos Autorizados ({emails.length})
                </h2>
                {loading && (
                  <div className={styles.tableLoading}>
                    <div className={styles.smallSpinner}></div>
                    Actualizando...
                  </div>
                )}
              </div>
              
              {loading ? (
                <div className={styles.loadingState}>
                  <div className={styles.spinner}></div>
                  <p>Cargando correos...</p>
                </div>
              ) : emails.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>📭</div>
                  <h3 className={styles.emptyTitle}>No hay correos autorizados</h3>
                  <p className={styles.emptyText}>
                    Agrega el primer correo usando el formulario de arriba para comenzar.
                  </p>
                  <button
                    onClick={() => document.getElementById('email')?.focus()}
                    className={styles.emptyButton}
                  >
                    Agregar Primer Correo
                  </button>
                </div>
              ) : (
                <div className={styles.tableContainer}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th className={styles.tableHeaderCell}>Correo Electrónico</th>
                        <th className={styles.tableHeaderCell}>Rol</th>
                        <th className={styles.tableHeaderCell}>Fecha de Autorización</th>
                        <th className={styles.tableHeaderCell}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {emails.map((emailRecord) => (
                        <tr key={emailRecord.id} className={styles.tableRow}>
                          <td className={styles.tableCell}>
                            <div className={styles.emailCell}>
                              <span className={styles.emailIcon}>✉️</span>
                              {emailRecord.email}
                            </div>
                          </td>
                          <td className={styles.tableCell}>
                            <div className={styles.roleCell}>
                              <span className={styles.roleIcon}>{getRoleIcon(emailRecord.allowed_role)}</span>
                              <span className={`${styles.roleBadge} ${getRoleColor(emailRecord.allowed_role)}`}>
                                {emailRecord.allowed_role}
                              </span>
                            </div>
                          </td>
                          <td className={styles.tableCell}>
                            {new Date(emailRecord.created_at).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </td>
                          <td className={styles.tableCell}>
                            <button
                              onClick={() => handleDelete(emailRecord.id, emailRecord.email)}
                              className={styles.deleteButton}
                              aria-label={`Eliminar correo ${emailRecord.email}`}
                              title="Eliminar correo"
                            >
                              🗑️ Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Panel lateral con estadísticas */}
          <div className={styles.sidebar}>
            <div className={styles.statsCard}>
              <h3 className={styles.statsTitle}>
                <span className={styles.statsTitleIcon}>📊</span>
                Estadísticas
              </h3>
              
              <div className={styles.statsContent}>
                <div className={styles.statBig}>
                  <div className={styles.statNumber}>{emails.length}</div>
                  <div className={styles.statLabel}>Total de correos autorizados</div>
                </div>
                
                <div className={styles.rolesDistribution}>
                  <h4 className={styles.distributionTitle}>
                    <span className={styles.distributionIcon}>📈</span>
                    Distribución por rol:
                  </h4>
                  <div className={styles.distributionList}>
                    {['admin', 'technician', 'auditor', 'user'].map((role) => {
                      const count = emails.filter(e => e.allowed_role === role).length;
                      const percentage = emails.length > 0 ? (count / emails.length * 100).toFixed(1) : '0';
                      
                      return (
                        <div key={role} className={styles.distributionItem}>
                          <div className={styles.distributionItemInfo}>
                            <span className={styles.distributionRoleIcon}>{getRoleIcon(role)}</span>
                            <span className={styles.distributionRoleName}>{role}</span>
                          </div>
                          <div className={styles.distributionItemStats}>
                            <div className={styles.distributionBar}>
                              <div 
                                className={styles.distributionBarFill}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className={styles.distributionCount}>{count}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className={styles.infoSection}>
                  <h4 className={styles.infoTitle}>
                    <span className={styles.infoTitleIcon}>💡</span>
                    Información
                  </h4>
                  <ul className={styles.infoList}>
                    <li className={styles.infoListItem}>
                      <span className={styles.infoListIcon}>✓</span>
                      <span>Solo los correos en esta lista pueden iniciar sesión</span>
                    </li>
                    <li className={styles.infoListItem}>
                      <span className={styles.infoListIcon}>✓</span>
                      <span>Los usuarios se crean automáticamente al primer login</span>
                    </li>
                    <li className={styles.infoListItem}>
                      <span className={styles.infoListIcon}>⚠</span>
                      <span>Eliminar un correo revoca el acceso inmediatamente</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}