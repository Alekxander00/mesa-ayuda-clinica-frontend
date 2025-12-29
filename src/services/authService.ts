// frontend/src/services/authService.ts - MODIFICADO
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function verifyBackendAuth(email: string, name?: string) {
  try {
    console.log('🔄 Verificando/creando usuario en backend...');
    
    const response = await fetch(`${API_URL}/auth/sync-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, name }),
    });

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('EMAIL_NOT_AUTHORIZED');
      }
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const user = await response.json();
    console.log('✅ Usuario verificado/creado en backend:', user);
    return user;
  } catch (error) {
    console.error('❌ Error en verifyBackendAuth:', error);
    throw error;
  }
}

export async function checkEmailAuthorization(email: string): Promise<boolean> {
  try {
    const response = await axios.get(`${API_URL}/auth/check-email/${encodeURIComponent(email)}`);
    return response.data.isAuthorized;
  } catch (error) {
    console.error('Error verificando autorización de email:', error);
    return false;
  }
}

export async function refreshUserSession() {
  try {
    const response = await axios.get(`${API_URL}/auth/refresh`);
    return response.data;
  } catch (error) {
    console.error('Error refreshing session:', error);
    throw error;
  }
}