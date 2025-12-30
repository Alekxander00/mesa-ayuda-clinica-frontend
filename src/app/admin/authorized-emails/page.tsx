// frontend/src/app/admin/authorized-emails/page.tsx - MEJORADA
'use client';

import { useState, useEffect } from 'react';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';

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
      case 'admin': return 'bg-gradient-to-r from-red-100 to-red-50 text-red-800 border border-red-200';
      case 'technician': return 'bg-gradient-to-r from-amber-100 to-amber-50 text-amber-800 border border-amber-200';
      case 'auditor': return 'bg-gradient-to-r from-purple-100 to-purple-50 text-purple-800 border border-purple-200';
      default: return 'bg-gradient-to-r from-green-100 to-green-50 text-green-800 border border-green-200';
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
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <Header />
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Verificando acceso...</p>
          </div>
        </div>
      </div>
    );
  }

  // Si no es admin, no renderizar nada (ya se redirigió en el useEffect)
  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Navegación */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-2 rounded-lg">✉️</span>
              Correos Autorizados
            </h1>
            <p className="text-gray-600 mt-2">
              Gestiona los correos que pueden acceder al sistema
            </p>
          </div>
          
          <div className="flex space-x-3">
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-800 rounded-lg font-medium transition-all duration-200 border border-gray-300 hover:border-gray-400 shadow-sm hover:shadow flex items-center gap-2"
            >
              <span>←</span>
              <span>Volver al Dashboard</span>
            </Link>
          </div>
        </div>

        {/* Mensajes de estado */}
        <div className="space-y-4 mb-8">
          {error && (
            <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 text-red-800 px-6 py-4 rounded-xl shadow-sm animate-fade-in">
              <div className="flex items-center gap-3">
                <span className="text-xl">⚠️</span>
                <div>
                  <p className="font-medium">Error</p>
                  <p className="text-sm mt-1">{error}</p>
                </div>
                <button
                  onClick={() => setError('')}
                  className="ml-auto text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-100"
                  aria-label="Cerrar mensaje de error"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
          
          {success && (
            <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 text-green-800 px-6 py-4 rounded-xl shadow-sm animate-fade-in">
              <div className="flex items-center gap-3">
                <span className="text-xl">✅</span>
                <div>
                  <p className="font-medium">Éxito</p>
                  <p className="text-sm mt-1">{success}</p>
                </div>
                <button
                  onClick={() => setSuccess('')}
                  className="ml-auto text-green-600 hover:text-green-800 p-1 rounded-full hover:bg-green-100"
                  aria-label="Cerrar mensaje de éxito"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Contenido principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulario para agregar correos */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-600 p-2 rounded-lg">➕</span>
                Agregar Nuevo Correo
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Correo Electrónico *
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400"
                      placeholder="ejemplo@dominio.com"
                      aria-label="Correo electrónico"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                      Rol
                    </label>
                    <select
                      id="role"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400 appearance-none bg-white"
                      aria-label="Rol del usuario"
                    >
                      <option value="user">👤 Usuario</option>
                      <option value="technician">🔧 Técnico</option>
                      <option value="admin">👑 Administrador</option>
                      <option value="auditor">📊 Auditor</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting || !formData.email.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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
                    className="px-6 py-3 bg-white hover:bg-gray-50 text-gray-800 font-medium rounded-xl transition-all duration-200 border border-gray-300 hover:border-gray-400 shadow-sm hover:shadow flex items-center gap-2"
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
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 animate-slide-down">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="bg-green-100 text-green-600 p-2 rounded-lg">📥</span>
                  Importar Múltiples Correos
                </h3>
                <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-100 rounded-xl p-4 mb-6">
                  <p className="text-sm text-gray-700 mb-2">
                    <strong className="font-medium">Formato:</strong> Un correo por línea. Opcionalmente agrega el rol después de una coma.
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong className="font-medium">Ejemplo:</strong>
                  </p>
                  <pre className="mt-2 text-xs bg-white p-3 rounded-lg border border-gray-200 overflow-x-auto">
{`usuario@empresa.com,user
tecnico@empresa.com,technician
admin@empresa.com,admin
auditor@empresa.com,auditor`}
                  </pre>
                </div>
                
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  className="w-full h-48 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 hover:border-gray-400 resize-none"
                  placeholder="Pega aquí los correos a importar..."
                  aria-label="Correos a importar"
                />
                
                <div className="flex justify-between items-center mt-6">
                  <span className="text-sm text-gray-500">
                    {importText.split('\n').filter(line => line.trim() && line.includes('@')).length} correos válidos detectados
                  </span>
                  <button
                    onClick={handleImport}
                    disabled={isImporting || !importText.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isImporting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <span className="bg-gray-200 text-gray-700 p-2 rounded-lg">📋</span>
                    Correos Autorizados ({emails.length})
                  </h2>
                  {loading && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      Actualizando...
                    </div>
                  )}
                </div>
              </div>
              
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Cargando correos...</p>
                </div>
              ) : emails.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4 opacity-20">📭</div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No hay correos autorizados</h3>
                  <p className="text-gray-500 mb-6 max-w-md mx-auto">
                    Agrega el primer correo usando el formulario de arriba para comenzar.
                  </p>
                  <button
                    onClick={() => document.getElementById('email')?.focus()}
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
                  >
                    Agregar Primer Correo
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Correo Electrónico
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rol
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha de Autorización
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {emails.map((emailRecord) => (
                        <tr 
                          key={emailRecord.id} 
                          className="hover:bg-gray-50 transition-colors duration-150 group"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900 flex items-center gap-2">
                              <span className="text-gray-400">✉️</span>
                              {emailRecord.email}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{getRoleIcon(emailRecord.allowed_role)}</span>
                              <span className={`px-3 py-1.5 inline-flex text-xs leading-4 font-semibold rounded-lg ${getRoleColor(emailRecord.allowed_role)}`}>
                                {emailRecord.allowed_role}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(emailRecord.created_at).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleDelete(emailRecord.id, emailRecord.email)}
                              className="text-red-600 hover:text-red-900 hover:bg-red-50 p-2 rounded-lg transition-all duration-200 group-hover:opacity-100 opacity-0"
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
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-2 rounded-lg">📊</span>
                Estadísticas
              </h3>
              
              <div className="space-y-6">
                <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                  <div className="text-3xl font-bold text-blue-700">{emails.length}</div>
                  <div className="text-sm text-blue-600 font-medium">Total de correos autorizados</div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-700 mb-4 flex items-center gap-2">
                    <span className="text-gray-400">📈</span>
                    Distribución por rol:
                  </h4>
                  <div className="space-y-3">
                    {['admin', 'technician', 'auditor', 'user'].map((role) => {
                      const count = emails.filter(e => e.allowed_role === role).length;
                      const percentage = emails.length > 0 ? (count / emails.length * 100).toFixed(1) : '0';
                      
                      return (
                        <div key={role} className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{getRoleIcon(role)}</span>
                            <span className="text-sm text-gray-600 capitalize">{role}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="font-medium text-sm w-10 text-right">{count}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="pt-6 border-t border-gray-200">
                  <h4 className="font-medium text-gray-700 mb-4 flex items-center gap-2">
                    <span className="text-gray-400">💡</span>
                    Información
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>Solo los correos en esta lista pueden iniciar sesión</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5">✓</span>
                      <span>Los usuarios se crean automáticamente al primer login</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 mt-0.5">⚠</span>
                      <span>Eliminar un correo revoca el acceso inmediatamente</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Agregar estilos CSS para animaciones */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
        
        .hover-lift {
          transition: transform 0.2s ease-out;
        }
        
        .hover-lift:hover {
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
}