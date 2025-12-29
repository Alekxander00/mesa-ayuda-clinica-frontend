// frontend/src/components/AuthorizedEmailsManager.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AuthorizedEmailsManager = () => {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ email: '', role: 'user' });
  const [message, setMessage] = useState('');
  const [importText, setImportText] = useState('');

  useEffect(() => {
    fetchEmails();
  }, []);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      // Obtener el email del administrador del localStorage
      const userEmail = localStorage.getItem('userEmail');
      
      const response = await axios.get('/api/authorized-emails', {
        headers: { 'x-user-email': userEmail }
      });
      
      if (response.data.success) {
        setEmails(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching emails:', error);
      setMessage('Error al cargar correos autorizados');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userEmail = localStorage.getItem('userEmail');
      
      const response = await axios.post('/api/authorized-emails', formData, {
        headers: { 'x-user-email': userEmail }
      });
      
      if (response.data.success) {
        setMessage('Correo agregado exitosamente');
        setFormData({ email: '', role: 'user' });
        fetchEmails();
      }
    } catch (error) {
      setMessage(error.response?.data?.error || 'Error al agregar correo');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este correo autorizado?')) {
      return;
    }

    try {
      const userEmail = localStorage.getItem('userEmail');
      
      const response = await axios.delete(`/api/authorized-emails/${id}`, {
        headers: { 'x-user-email': userEmail }
      });
      
      if (response.data.success) {
        setMessage('Correo eliminado exitosamente');
        fetchEmails();
      }
    } catch (error) {
      setMessage('Error al eliminar correo');
    }
  };

  const handleImport = async () => {
    try {
      const lines = importText.split('\n').filter(line => line.trim());
      const emailsToImport = lines.map(line => {
        const parts = line.split(',').map(p => p.trim());
        return {
          email: parts[0],
          role: parts[1] || 'user'
        };
      });

      const userEmail = localStorage.getItem('userEmail');
      
      const response = await axios.post('/api/authorized-emails/import', 
        { emails: emailsToImport },
        { headers: { 'x-user-email': userEmail } }
      );
      
      if (response.data.success) {
        setMessage(`Importados ${response.data.summary.success} correos exitosamente`);
        setImportText('');
        fetchEmails();
      }
    } catch (error) {
      setMessage('Error en la importación');
    }
  };

  return (
    <div className="authorized-emails-manager">
      <h2>Gestión de Correos Autorizados</h2>
      
      {message && (
        <div className="alert alert-info">{message}</div>
      )}

      {/* Formulario para agregar un correo */}
      <div className="card mb-4">
        <div className="card-header">
          <h5>Agregar Nuevo Correo Autorizado</h5>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6">
                <div className="form-group">
                  <label>Correo Electrónico *</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="ejemplo@dominio.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-group">
                  <label>Rol</label>
                  <select
                    className="form-control"
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                  >
                    <option value="user">Usuario</option>
                    <option value="technician">Técnico</option>
                    <option value="admin">Administrador</option>
                    <option value="auditor">Auditor</option>
                  </select>
                </div>
              </div>
              <div className="col-md-2 d-flex align-items-end">
                <button type="submit" className="btn btn-primary">
                  Agregar
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Importar múltiples correos */}
      <div className="card mb-4">
        <div className="card-header">
          <h5>Importar Múltiples Correos</h5>
        </div>
        <div className="card-body">
          <div className="form-group">
            <label>
              Ingresa correos (uno por línea o correo,rol):
              <small className="text-muted ml-2">
                Formato: correo@ejemplo.com,rol
              </small>
            </label>
            <textarea
              className="form-control"
              rows="5"
              placeholder="correo1@ejemplo.com,user
correo2@ejemplo.com,admin
correo3@ejemplo.com"
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
            />
          </div>
          <button 
            onClick={handleImport}
            className="btn btn-success"
            disabled={!importText.trim()}
          >
            Importar Correos
          </button>
        </div>
      </div>

      {/* Lista de correos autorizados */}
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5>Correos Autorizados ({loading ? '...' : emails.length})</h5>
          <button onClick={fetchEmails} className="btn btn-sm btn-secondary">
            Actualizar
          </button>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center">
              <div className="spinner-border" role="status">
                <span className="sr-only">Cargando...</span>
              </div>
            </div>
          ) : emails.length === 0 ? (
            <div className="alert alert-warning">
              No hay correos autorizados registrados
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Correo Electrónico</th>
                    <th>Rol Asignado</th>
                    <th>Fecha de Autorización</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {emails.map((emailRecord) => (
                    <tr key={emailRecord.id}>
                      <td>
                        <strong>{emailRecord.email}</strong>
                      </td>
                      <td>
                        <span className={`badge badge-${emailRecord.allowed_role === 'admin' ? 'danger' : 
                                        emailRecord.allowed_role === 'technician' ? 'warning' : 
                                        emailRecord.allowed_role === 'auditor' ? 'info' : 'secondary'}`}>
                          {emailRecord.allowed_role}
                        </span>
                      </td>
                      <td>
                        {new Date(emailRecord.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        <button
                          onClick={() => handleDelete(emailRecord.id)}
                          className="btn btn-sm btn-danger"
                          title="Eliminar autorización"
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
    </div>
  );
};

export default AuthorizedEmailsManager;