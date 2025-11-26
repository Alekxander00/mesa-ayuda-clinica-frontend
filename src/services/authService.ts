// frontend/src/services/authService.ts - CORREGIDO PARA v5.0.0
'use client';

import { getSession, signIn } from 'next-auth/react';

export interface BackendUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'technician' | 'user' | 'auditor';
  department?: string;
  specialization?: string;
}

export async function verifyBackendAuth(email: string, name: string): Promise<BackendUser> {
  const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  
  try {
    console.log('🔐 Verificando/creando usuario en backend:', email);
    
    const response = await fetch(`${baseURL}/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-email': email,
      },
      body: JSON.stringify({ email, name }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const userData: BackendUser = await response.json();
    console.log('✅ Usuario verificado/creado en backend:', userData);

    return userData;
  } catch (error) {
    console.error('❌ Error en verifyBackendAuth:', error);
    throw error;
  }
}

// NUEVA: Función para forzar actualización de sesión en v5.0.0
export async function refreshUserSession(): Promise<void> {
  try {
    // En NextAuth v5, podemos forzar una revalidación de la sesión
    // usando signIn con redirect: false o recargando la sesión
    const session = await getSession();
    
    if (session) {
      console.log('🔄 Sesión actual:', session.user);
      
      // Forzar una nueva obtención de la sesión
      const newSession = await getSession();
      console.log('🔄 Nueva sesión obtenida:', newSession?.user);
    }
  } catch (error) {
    console.error('❌ Error actualizando sesión:', error);
  }
}

// Alternativa: Forzar recarga de página para refrescar sesión
export async function hardRefreshSession(): Promise<void> {
  // Esta es una solución más agresiva pero efectiva
  window.location.reload();
}