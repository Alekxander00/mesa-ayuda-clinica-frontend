'use client';

import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';
import AnimatedBackground from '@/components/Animated/AnimatedBackground';

export default function UnauthorizedPage() {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  return (
    <>
      <AnimatedBackground />
      <div className={styles.animatedBackground}></div>
      
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.icon}>🚫</div>
          
          <h1 className={styles.title}>Acceso No Autorizado</h1>
          
          <p className={styles.message}>
            Tu correo electrónico no está autorizado para usar este sistema.
            Contacta al administrador para solicitar acceso.
          </p>

          <div className={styles.infoBox}>
            <h3 className={styles.infoTitle}>¿Qué puedes hacer?</h3>
            <ul className={styles.infoList}>
              <li className={styles.infoItem}>Contacta al administrador del sistema</li>
              <li className={styles.infoItem}>Verifica que tu correo esté correctamente escrito</li>
              <li className={styles.infoItem}>Si crees que es un error, notifica al soporte</li>
            </ul>
          </div>

          <div className={styles.actions}>
            <button
              onClick={handleLogout}
              className={styles.primaryButton}
            >
              <span className={styles.buttonIcon}>↩️</span>
              Cerrar Sesión
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className={styles.secondaryButton}
            >
              <span className={styles.buttonIcon}>🔄</span>
              Reintentar
            </button>
          </div>

          <div className={styles.adminLink}>
            <p className={styles.adminText}>
              Si eres administrador,
            </p>
            <Link href="/admin/authorized-emails" className={styles.adminLinkButton}>
              gestiona los correos autorizados aquí
              <span>→</span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}