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

class SessionSyncService {
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  }

  async syncUserWithBackend(): Promise<BackendUser | null> {
    try {
      console.log('🔄 Sincronizando usuario con backend...');
      
      const session = await getSession();
      
      if (!session?.user?.email) {
        console.warn('⚠️ No hay sesión activa para sincronizar');
        return null;
      }

      const response = await fetch(`${this.baseURL}/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': session.user.email,
        },
        body: JSON.stringify({
          email: session.user.email,
          name: session.user.name,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${await response.text()}`);
      }

      const userData: BackendUser = await response.json();
      console.log('✅ Usuario sincronizado con backend:', userData);

      // Guardar en localStorage para uso inmediato
      if (typeof window !== 'undefined') {
        localStorage.setItem('backend-user', JSON.stringify(userData));
      }

      return userData;
    } catch (error) {
      console.error('❌ Error sincronizando usuario:', error);
      return null;
    }
  }

  getCachedUser(): BackendUser | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const cached = localStorage.getItem('backend-user');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  }

  clearCache() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('backend-user');
    }
  }
}

export const sessionSyncService = new SessionSyncService();