// frontend/src/services/authService.ts - ACTUALIZADO Y UNIFICADO
'use client';

import { getSession, signIn } from 'next-auth/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface BackendUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'technician' | 'user' | 'auditor';
  department?: string;
  specialization?: string;
}

class AuthService {
  private static instance: AuthService;
  private cache: Map<string, { user: BackendUser; timestamp: number }> = new Map();
  private CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async loginWithGoogle() {
    try {
      console.log('🔐 Iniciando login con Google...');
      
      const result = await signIn('google', {
        redirect: false,
        callbackUrl: '/dashboard'
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      return result;
    } catch (error) {
      console.error('❌ Error en login:', error);
      throw error;
    }
  }

  async verifyUserInBackend(email: string, name?: string): Promise<BackendUser> {
    try {
      // Verificar cache
      const cached = this.cache.get(email);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        console.log('✅ Usuario en caché:', email);
        return cached.user;
      }

      console.log('🔄 Verificando usuario en backend:', email);
      
      const response = await fetch(`${API_URL}/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': email,
        },
        body: JSON.stringify({ email, name }),
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('EMAIL_NOT_AUTHORIZED');
        }
        throw new Error(`Error ${response.status}: ${await response.text()}`);
      }

      const userData: BackendUser = await response.json();
      
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

  async logout() {
    this.clearCache();
    // La redirección se manejará en el componente
  }
}

export const authService = AuthService.getInstance();