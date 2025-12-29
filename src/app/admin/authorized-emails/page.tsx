// frontend/src/app/admin/authorized-emails/page.tsx - ACTUALIZADO
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

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'technician': return 'bg-yellow-100 text-yellow-800';
      case 'auditor': return 'bg-purple-100 text-purple-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  // Mostrar loading mientras se verifica autenticación
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
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
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Navegación */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Correos Autorizados</h1>
            <p className="text-gray-600 mt-2">
              Gestiona los correos que pueden acceder al sistema
            </p>
          </div>
          
          <div className="flex space-x-3">
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition-colors"
            >
              ← Volver al Dashboard
            </Link>
          </div>
        </div>

        {/* Mensajes */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            <p className="font-medium">Éxito</p>
            <p className="text-sm">{success}</p>
          </div>
        )}

        {/* Contenido principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulario para agregar correos */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Agregar Nuevo Correo</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Correo Electrónico *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="ejemplo@dominio.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rol
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="user">Usuario</option>
                      <option value="technician">Técnico</option>
                      <option value="admin">Administrador</option>
                      <option value="auditor">Auditor</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Agregar Correo
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setShowImport(!showImport)}
                    className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg transition-colors"
                  >
                    {showImport ? 'Cancelar' : 'Importar Múltiples'}
                  </button>
                </div>
              </form>
            </div>

            {/* Importación masiva */}
            {showImport && (
              <div className="bg-white rounded-xl shadow p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Importar Múltiples Correos</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Ingresa un correo por línea. Opcionalmente, agrega el rol después de una coma.
                  <br />
                  <strong>Formato:</strong> correo@ejemplo.com,rol
                  <br />
                  <strong>Ejemplo:</strong> usuario@empresa.com,user
                </p>
                
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  className="w-full h-40 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
                  placeholder="correo1@empresa.com
correo2@empresa.com,admin
correo3@empresa.com,technician"
                />
                
                <button
                  onClick={handleImport}
                  disabled={!importText.trim()}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  Importar Correos
                </button>
              </div>
            )}

            {/* Lista de correos */}
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Correos Autorizados ({emails.length})
                </h2>
              </div>
              
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Cargando correos...</p>
                </div>
              ) : emails.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4 opacity-50">📭</div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No hay correos autorizados</h3>
                  <p className="text-gray-500">Agrega el primer correo usando el formulario de arriba.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Correo Electrónico
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rol
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha de Autorización
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {emails.map((emailRecord) => (
                        <tr key={emailRecord.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{emailRecord.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleColor(emailRecord.allowed_role)}`}>
                              {emailRecord.allowed_role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(emailRecord.created_at).toLocaleDateString('es-ES')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleDelete(emailRecord.id, emailRecord.email)}
                              className="text-red-600 hover:text-red-900"
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
            <div className="bg-white rounded-xl shadow p-6 mb-6 sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Estadísticas</h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-700">{emails.length}</div>
                  <div className="text-sm text-blue-600">Total de correos autorizados</div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-700">Distribución por rol:</h4>
                  <div className="space-y-2">
                    {['user', 'technician', 'admin', 'auditor'].map((role) => {
                      const count = emails.filter(e => e.allowed_role === role).length;
                      return (
                        <div key={role} className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">{role.charAt(0).toUpperCase() + role.slice(1)}</span>
                          <span className="font-medium">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="font-medium text-gray-700 mb-2">💡 Información</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Solo los correos en esta lista pueden iniciar sesión</li>
                    <li>• Los usuarios se crean automáticamente al primer login</li>
                    <li>• Eliminar un correo revoca el acceso inmediatamente</li>
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