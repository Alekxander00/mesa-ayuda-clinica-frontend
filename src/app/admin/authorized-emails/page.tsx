// frontend/src/app/admin/authorized-emails/page.tsx - ACTUALIZADO CON CSS MODULES
'use client';

import { useState, useEffect } from 'react';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import styles from './page.module.css';

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

  // Verificar si es admin
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        // No hay usuario, redirigir a login
        router.push('/login');
      } else if (user.role !== 'admin') {
        // No es admin, redirigir a unauthorized
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
    try {
      setError('');
      setSuccess('');
      
      const response = await post('/authorized-emails', formData);
      
      if (response.success) {
        setSuccess('Correo autorizado agregado exitosamente');
        setFormData({ email: '', role: 'user' });
        fetchEmails();
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'Error al agregar correo');
    }
  };

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`¿Estás seguro de eliminar el correo ${email} de la lista autorizada?`)) {
      return;
    }
    
    try {
      const response = await deleteApi(`/authorized-emails/${id}`);
      
      if (response.success) {
        setSuccess(`Correo ${email} eliminado exitosamente`);
        fetchEmails();
      }
    } catch (error: any) {
      setError('Error al eliminar correo');
    }
  };

  const handleImport = async () => {
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
        setSuccess(`Importados ${response.summary.success} correos exitosamente`);
        setImportText('');
        setShowImport(false);
        fetchEmails();
      }
    } catch (error: any) {
      setError('Error en la importación');
    }
  };

  const getRoleClass = (role: string) => {
    switch (role) {
      case 'admin': return styles.roleAdmin;
      case 'technician': return styles.roleTechnician;
      case 'auditor': return styles.roleAuditor;
      default: return styles.roleUser;
    }
  };

  // Mostrar loading mientras se verifica autenticación
  if (authLoading) {
    return (
      <div className={styles.container}>
        <Header />
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p className={styles.loadingText}>Verificando acceso...</p>
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
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleSection}>
            <h1 className={styles.title}>Correos Autorizados</h1>
            <p className={styles.subtitle}>
              Gestiona los correos que pueden acceder al sistema
            </p>
          </div>
          
          <Link href="/dashboard" className={styles.backButton}>
            ← Volver al Dashboard
          </Link>
        </div>

        {/* Mensajes */}
        {error && (
          <div className={`${styles.alert} ${styles.alertError}`}>
            <p className={styles.alertTitle}>Error</p>
            <p className={styles.alertMessage}>{error}</p>
          </div>
        )}
        
        {success && (
          <div className={`${styles.alert} ${styles.alertSuccess}`}>
            <p className={styles.alertTitle}>Éxito</p>
            <p className={styles.alertMessage}>{success}</p>
          </div>
        )}

        {/* Contenido principal */}
        <div className={styles.layout}>
          {/* Columna principal */}
          <div>
            {/* Formulario para agregar correos */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Agregar Nuevo Correo</h2>
              
              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Correo Electrónico *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={styles.input}
                      placeholder="ejemplo@dominio.com"
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Rol
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className={styles.select}
                    >
                      <option value="user">Usuario</option>
                      <option value="technician">Técnico</option>
                      <option value="admin">Administrador</option>
                      <option value="auditor">Auditor</option>
                    </select>
                  </div>
                </div>
                
                <div className={styles.buttonGroup}>
                  <button
                    type="submit"
                    className={`${styles.button} ${styles.buttonPrimary}`}
                  >
                    Agregar Correo
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setShowImport(!showImport)}
                    className={`${styles.button} ${styles.buttonSecondary}`}
                  >
                    {showImport ? 'Cancelar' : 'Importar Múltiples'}
                  </button>
                </div>
              </form>
            </div>

            {/* Importación masiva */}
            {showImport && (
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Importar Múltiples Correos</h3>
                <p className={styles.importHelp}>
                  Ingresa un correo por línea. Opcionalmente, agrega el rol después de una coma.
                  <br />
                  <strong>Formato:</strong> correo@ejemplo.com,rol
                  <br />
                  <strong>Ejemplo:</strong> usuario@empresa.com,user
                </p>
                
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  className={styles.textarea}
                  placeholder="correo1@empresa.com
correo2@empresa.com,admin
correo3@empresa.com,technician"
                />
                
                <button
                  onClick={handleImport}
                  disabled={!importText.trim()}
                  className={`${styles.button} ${styles.buttonGreen}`}
                >
                  Importar Correos
                </button>
              </div>
            )}

            {/* Lista de correos */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>
                Correos Autorizados ({emails.length})
              </h2>
              
              {loading ? (
                <div className={styles.loadingState}>
                  <div className={styles.spinner}></div>
                  <p className={styles.loadingText}>Cargando correos...</p>
                </div>
              ) : emails.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>📭</div>
                  <h3 className={styles.emptyTitle}>No hay correos autorizados</h3>
                  <p className={styles.emptyText}>Agrega el primer correo usando el formulario de arriba.</p>
                </div>
              ) : (
                <div className={styles.tableContainer}>
                  <table className={styles.table}>
                    <thead className={styles.tableHeader}>
                      <tr>
                        <th>Correo Electrónico</th>
                        <th>Rol</th>
                        <th>Fecha de Autorización</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {emails.map((emailRecord) => (
                        <tr key={emailRecord.id} className={styles.tableRow}>
                          <td>
                            <div className={styles.email}>{emailRecord.email}</div>
                          </td>
                          <td>
                            <span className={`${styles.roleBadge} ${getRoleClass(emailRecord.allowed_role)}`}>
                              {emailRecord.allowed_role}
                            </span>
                          </td>
                          <td>
                            {new Date(emailRecord.created_at).toLocaleDateString('es-ES')}
                          </td>
                          <td>
                            <button
                              onClick={() => handleDelete(emailRecord.id, emailRecord.email)}
                              className={styles.actionButton}
                            >
                              Eliminar
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
          <div>
            <div className={styles.statsCard}>
              <h3 className={styles.statsTitle}>📊 Estadísticas</h3>
              
              <div className={styles.statsTotal}>
                <div className={styles.totalNumber}>{emails.length}</div>
                <div className={styles.totalLabel}>Total de correos autorizados</div>
              </div>
              
              <div className={styles.distribution}>
                <h4 className={styles.distributionTitle}>Distribución por rol:</h4>
                <div className={styles.distributionList}>
                  {['user', 'technician', 'admin', 'auditor'].map((role) => {
                    const count = emails.filter(e => e.allowed_role === role).length;
                    return (
                      <div key={role} className={styles.distributionItem}>
                        <span className={styles.distributionRole}>
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </span>
                        <span className={styles.distributionCount}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className={styles.info}>
                <h4 className={styles.infoTitle}>💡 Información</h4>
                <ul className={styles.infoList}>
                  <li className={styles.infoItem}>• Solo los correos en esta lista pueden iniciar sesión</li>
                  <li className={styles.infoItem}>• Los usuarios se crean automáticamente al primer login</li>
                  <li className={styles.infoItem}>• Eliminar un correo revoca el acceso inmediatamente</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}