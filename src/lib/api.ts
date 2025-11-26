// frontend/src/lib/api.ts - CLIENTE API CORREGIDO PARA NEXT-AUTH v4
import { getSession } from 'next-auth/react';

class ApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    try {
      console.log('🔐 Obteniendo sesión para headers...');
      
      // ✅ CORREGIDO: Usar getSession() de next-auth/react (v4)
      const session = await getSession();
      
      console.log('🔐 Sesión obtenida:', session?.user?.email);
      
      if (session?.user?.email) {
        headers['x-user-email'] = session.user.email;
        console.log('✅ Header x-user-email agregado:', session.user.email);
      } else {
        console.warn('⚠️ No hay sesión activa o email en sesión');
      }
    } catch (error) {
      console.warn('⚠️ Error obteniendo sesión:', error);
    }

    return headers;
  }

  async get(url: string): Promise<any> {
    try {
      console.log('🔄 API GET:', url);
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${this.baseURL}${url}`, {
        method: 'GET',
        headers,
      });

      console.log('📡 GET Response Status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', response.status, errorText);
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error('❌ API Client Error:', error);
      throw error;
    }
  }

  async post(url: string, data: any): Promise<any> {
    try {
      console.log('🔄 API POST:', url, data);
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${this.baseURL}${url}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      console.log('📡 POST Response Status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error('❌ API Client Error:', error);
      throw error;
    }
  }

  async put(url: string, data: any): Promise<any> {
    try {
      console.log('🔄 API PUT:', url, data);
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${this.baseURL}${url}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });

      console.log('📡 PUT Response Status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error('❌ API Client Error:', error);
      throw error;
    }
  }

  async delete(url: string): Promise<any> {
    try {
      console.log('🔄 API DELETE:', url);
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${this.baseURL}${url}`, {
        method: 'DELETE',
        headers,
      });

      console.log('📡 DELETE Response Status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error('❌ API Client Error:', error);
      throw error;
    }
  }
}

export const api = new ApiClient();