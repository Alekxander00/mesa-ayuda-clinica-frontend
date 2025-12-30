// frontend/src/services/authService.ts - VERIFICAR QUE TENGA ESTO
'use client';

import { getSession, signIn } from 'next-auth/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://mesa-ayuda-clinica-backend-production.up.railway.app/api';

export interface BackendUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'technician' | 'user' | 'auditor';
  email_verified: boolean;
}

class AuthService {
  private cache: Map<string, { user: BackendUser; timestamp: number }> = new Map();
  private CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  async verifyUserInBackend(email: string, name?: string): Promise<BackendUser> {
    try {
      // Verificar cache
      const cached = this.cache.get(email);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        console.log('✅ Usuario en caché:', email);
        return cached.user;
      }

      console.log('🔄 Verificando usuario en backend:', email);
      
      // PRIMERO: Verificar si el email está autorizado
      const checkResponse = await fetch(`${API_URL}/auth/check-email/${encodeURIComponent(email)}`);
      
      if (!checkResponse.ok) {
        throw new Error(`Error ${checkResponse.status}: ${await checkResponse.text()}`);
      }

      const checkData = await checkResponse.json();
      
      if (!checkData.isAuthorized) {
        throw new Error('EMAIL_NOT_AUTHORIZED');
      }

      // SEGUNDO: Sincronizar usuario
      const syncResponse = await fetch(`${API_URL}/auth/sync-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': email,
        },
        body: JSON.stringify({ email, name }),
      });

      if (!syncResponse.ok) {
        if (syncResponse.status === 403) {
          throw new Error('EMAIL_NOT_AUTHORIZED');
        }
        throw new Error(`Error ${syncResponse.status}: ${await syncResponse.text()}`);
      }

      const userData: BackendUser = await syncResponse.json();
      
      // Guardar en cache
      this.cache.set(email, {
        user: userData,
        timestamp: Date.now()
      });

      console.log('✅ Usuario verificado en backend:', userData);
      return userData;
    } catch (error) {
      console.error('❌ Error verificando usuario:', error);
      throw error;
    }
  }

  async loginWithGoogle() {
    return await signIn('google', { callbackUrl: '/dashboard' });
  }

  async getCurrentUser(): Promise<BackendUser | null> {
    try {
      const session = await getSession();
      if (!session?.user?.email) {
        return null;
      }

      return await this.verifyUserInBackend(session.user.email, session.user.name);
    } catch (error) {
      console.error('❌ Error obteniendo usuario actual:', error);
      return null;
    }
  }

  clearCache(email?: string) {
    if (email) {
      this.cache.delete(email);
    } else {
      this.cache.clear();
    }
  }
}

export const authService = new AuthService();

// Función de compatibilidad
export const verifyBackendAuth = (email: string, name?: string) => 
  authService.verifyUserInBackend(email, name);