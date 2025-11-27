// frontend/src/components/DebugPermissions.tsx
'use client';

import { useApi } from '@/hooks/useApi';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

export default function DebugPermissions() {
  const { session, backendUser } = useApi();
  const { data: nextAuthSession } = useSession();

  const checkPermissions = () => {
    console.log('🔐 DEBUG PERMISSIONS:');
    console.log('📧 Email:', session?.user?.email);
    console.log('👑 Session Role:', session?.user?.role);
    console.log('🔧 Backend Role:', backendUser?.role);
    console.log('🎯 NextAuth Session Role:', nextAuthSession?.user?.role);
    console.log('---');
    console.log('✅ ¿Puede ver todos los tickets?:', session?.user?.role === 'admin' || session?.user?.role === 'technician');
    console.log('✅ ¿Puede cambiar estados?:', session?.user?.role === 'admin' || session?.user?.role === 'technician');
    console.log('✅ ¿Puede eliminar tickets?:', session?.user?.role === 'admin');
    console.log('✅ ¿Puede cambiar prioridades?:', session?.user?.role === 'admin' || session?.user?.role === 'technician');
  };

  useEffect(() => {
    checkPermissions();
  }, [session, backendUser, nextAuthSession]);

  return (
    <div style={{
      position: 'fixed',
      top: '150px',
      right: '10px',
      background: '#dbeafe',
      border: '2px solid #2563eb',
      padding: '10px',
      borderRadius: '8px',
      zIndex: 1000,
      fontSize: '12px',
      maxWidth: '300px'
    }}>
      <h4>🔐 Debug Permisos</h4>
      <p><strong>Session Role:</strong> {session?.user?.role}</p>
      <p><strong>Backend Role:</strong> {backendUser?.role}</p>
      <p><strong>NextAuth Role:</strong> {nextAuthSession?.user?.role}</p>
      <button 
        onClick={checkPermissions}
        style={{
          background: '#2563eb',
          color: 'white',
          border: 'none',
          padding: '5px 10px',
          borderRadius: '4px',
          cursor: 'pointer',
          marginTop: '5px'
        }}
      >
        🔍 Verificar Permisos
      </button>
    </div>
  );
}