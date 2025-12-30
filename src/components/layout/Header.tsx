// frontend/src/components/layout/Header.tsx - VERSIÓN SIMPLIFICADA
'use client';

import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import styles from './Header.module.css';

export default function Header() {
  const { user, loading, isAuthenticated, isAdmin, isTechnician } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  if (loading) {
    return (
      <header className={styles.header}>
        <div className={styles.loadingHeader}>
          <div className={styles.spinner}></div>
          <span>Cargando...</span>
        </div>
      </header>
    );
  }

  return (
    <header className={styles.header}>
      <div className={styles.leftSection}>
        <Link href="/dashboard" className={styles.logo}>
          <span className={styles.logoIcon}>🏥</span>
          <span className={styles.logoText}>Mesa de Ayuda</span>
        </Link>
      </div>

      <nav className={styles.nav}>
        {isAuthenticated ? (
          <>
            <Link href="/dashboard" className={styles.navLink}>
              Dashboard
            </Link>
            <Link href="/tickets" className={styles.navLink}>
              Tickets
            </Link>
            {isAdmin && (
              <Link href="/admin" className={styles.navLink}>
                Admin
              </Link>
            )}
            {(isAdmin || isTechnician) && (
              <Link href="/reports" className={styles.navLink}>
                Reportes
              </Link>
            )}
          </>
        ) : (
          <Link href="/login" className={styles.navLink}>
            Iniciar Sesión
          </Link>
        )}
      </nav>

      <div className={styles.rightSection}>
        {isAuthenticated && user ? (
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>
              {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
            </div>
            <div className={styles.userDetails}>
              <span className={styles.userName}>{user.name || user.email}</span>
              <span className={`${styles.userRole} ${
                user.role === 'admin' ? styles.roleAdmin : 
                user.role === 'technician' ? styles.roleTechnician : 
                user.role === 'auditor' ? styles.roleAuditor : styles.roleUser
              }`}>
                {user.role}
              </span>
            </div>
            <button onClick={handleLogout} className={styles.logoutButton} title="Cerrar sesión">
              <span className={styles.logoutIcon}>🚪</span>
              <span className={styles.logoutText}>Salir</span>
            </button>
          </div>
        ) : (
          <div className={styles.authButtons}>
            <Link href="/login" className={styles.loginButton}>
              Iniciar Sesión
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}