// frontend/src/app/login/page.tsx - ACTUALIZADO CON CSS MODULES
'use client';

import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { verifyBackendAuth } from '@/services/authService';
import styles from './page.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkExistingAuth = async () => {
      const session = await getSession();
      if (session?.user?.email) {
        try {
          console.log('👤 Usuario ya autenticado, verificando en backend...');
          await verifyBackendAuth(session.user.email, session.user.name);
          router.push('/dashboard');
        } catch (error) {
          console.error('Error verificando usuario existente:', error);
        }
      }
    };

    checkExistingAuth();
  }, [router]);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('🔐 Iniciando proceso de login...');

      const result = await signIn('google', { 
        redirect: false 
      });
      
      if (result?.error) {
        throw new Error(result.error);
      }

      if (result?.ok) {
        console.log('✅ Login con Google exitoso, esperando sesión...');
        
        let session = null;
        let attempts = 0;
        const maxAttempts = 10;
        
        while (!session && attempts < maxAttempts) {
          session = await getSession();
          if (!session) {
            await new Promise(resolve => setTimeout(resolve, 500));
            attempts++;
          }
        }

        if (!session?.user?.email) {
          throw new Error('No se pudo obtener la sesión después del login');
        }

        console.log('✅ Sesión obtenida:', session.user.email);

        try {
          await verifyBackendAuth(session.user.email, session.user.name);
          console.log('✅ Usuario registrado/verificado en backend');
          router.push('/dashboard');
        } catch (backendError: any) {
          console.error('❌ Error con backend:', backendError);
          setError(`Error al conectar con el sistema: ${backendError.message}`);
        }
      } else {
        throw new Error('Error desconocido durante el login');
      }
    } catch (err: any) {
      console.error('❌ Error completo en login:', err);
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <span className={styles.logoText}>🏥</span>
          </div>
          <div className={styles.logoContent}>
            <h1 className={styles.logoTitle}>Mesa de Ayuda Clínica</h1>
            <p className={styles.logoSubtitle}>Sistema de gestión de tickets médicos</p>
          </div>
        </div>

        {error && (
          <div className={styles.error}>
            <p className={styles.errorTitle}>Error</p>
            <p className={styles.errorMessage}>{error}</p>
            <button onClick={() => setError('')} className={styles.errorButton}>
              Intentar de nuevo
            </button>
          </div>
        )}

        <div className={styles.buttonContainer}>
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className={styles.googleButton}
          >
            {loading ? (
              <div className={styles.loading}>
                <div className={styles.spinner}></div>
                Procesando...
              </div>
            ) : (
              <>
                <svg className={styles.googleIcon} viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Iniciar sesión con Google
              </>
            )}
          </button>
        </div>

        <div className={styles.footer}>
          <p className={styles.footerText}>
            Al iniciar sesión, se creará automáticamente tu cuenta en el sistema.
          </p>
        </div>
      </div>
    </div>
  );
}