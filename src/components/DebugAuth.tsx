// frontend/src/components/DebugAuth.tsx - MEJORADO
'use client';

import { useSession } from 'next-auth/react';
import { useAuth } from '@/hooks/useAuth';

export default function DebugAuth() {
  const { data: session, status } = useSession();
  const { getAuthHeaders } = useAuth();

  const testBackend = async () => {
    try {
      const headers = getAuthHeaders();
      console.log('🔍 Debug - Headers a enviar:', headers);
      
      const response = await fetch('/api/tickets', { headers });
      const result = await response.json();
      
      console.log('✅ Debug - Respuesta backend:', result);
      alert(`Backend response: ${response.status}\nTickets: ${result.length}`);
    } catch (error) {
      console.error('❌ Debug - Error:', error);
      alert('Error testing backend');
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
      <h3>🔍 Debug de Autenticación</h3>
      <p><strong>Estado NextAuth:</strong> {status}</p>
      <p><strong>Usuario:</strong> {session?.user?.name}</p>
      <p><strong>Email:</strong> {session?.user?.email}</p>
      <p><strong>Header x-user-email:</strong> {session?.user?.email || 'No disponible'}</p>
      
      <button 
        onClick={testBackend}
        style={{ marginTop: '0.5rem', padding: '0.5rem' }}
      >
        Probar Backend
      </button>
      
      <button 
        onClick={() => console.log('Sesión completa:', session)}
        style={{ marginLeft: '0.5rem', padding: '0.5rem' }}
      >
        Ver Sesión en Consola
      </button>
    </div>
  );
}