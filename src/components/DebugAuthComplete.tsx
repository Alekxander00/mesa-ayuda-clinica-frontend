// frontend/src/components/DebugAuthFinal.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useApi } from '@/hooks/useApi';
import { useState } from 'react';

export default function DebugAuthFinal() {
  const { data: session, status } = useSession();
  const { get } = useApi();
  const [backendResponse, setBackendResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testBackend = async () => {
    try {
      setLoading(true);
      console.log('🧪 Debug - Probando backend...');
      
      const result = await get('/tickets');
      setBackendResponse(result);
      
      console.log('✅ Debug - Respuesta backend:', result);
    } catch (error) {
      console.error('❌ Debug - Error:', error);
      setBackendResponse({ error: error instanceof Error ? error.message : 'Error desconocido' });
    } finally {
      setLoading(false);
    }
  };

  const checkStorage = () => {
    console.log('🔍 Debug - Revisando almacenamiento...');
    try {
      const local = localStorage.getItem('nextauth.session');
      const session = sessionStorage.getItem('nextauth.session');
      console.log('🏪 localStorage:', local);
      console.log('🏪 sessionStorage:', session);
    } catch (error) {
      console.warn('⚠️ No se pudo acceder al almacenamiento:', error);
    }
  };

  return (
    <div style={{ 
      background: '#f5f5f5', 
      padding: '1rem', 
      margin: '1rem 0',
      border: '1px solid #ddd',
      fontSize: '14px'
    }}>
      <h3>🔍 Debug Final - Autenticación y API</h3>
      
      <div style={{ marginBottom: '1rem' }}>
        <p><strong>Estado NextAuth:</strong> {status}</p>
        <p><strong>Usuario:</strong> {session?.user?.name}</p>
        <p><strong>Email:</strong> {session?.user?.email || 'NO DISPONIBLE'}</p>
        <p><strong>Rol:</strong> {session?.user?.role || 'No asignado'}</p>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button 
          onClick={testBackend}
          disabled={loading}
          style={{ padding: '0.5rem', backgroundColor: loading ? '#ccc' : '#007acc', color: 'white', border: 'none' }}
        >
          {loading ? 'Probando...' : 'Probar Backend (useApi)'}
        </button>
        
        <button 
          onClick={checkStorage}
          style={{ padding: '0.5rem', backgroundColor: '#28a745', color: 'white', border: 'none' }}
        >
          Ver Almacenamiento
        </button>
        
        <button 
          onClick={() => console.log('Sesión completa:', session)}
          style={{ padding: '0.5rem', backgroundColor: '#6c757d', color: 'white', border: 'none' }}
        >
          Ver Sesión en Consola
        </button>
      </div>

      {backendResponse && (
        <div style={{ marginTop: '1rem' }}>
          <p><strong>Respuesta del backend:</strong></p>
          <pre style={{ 
            background: '#fff', 
            padding: '0.5rem', 
            border: '1px solid #ddd',
            fontSize: '12px',
            maxHeight: '200px',
            overflow: 'auto'
          }}>
            {JSON.stringify(backendResponse, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}