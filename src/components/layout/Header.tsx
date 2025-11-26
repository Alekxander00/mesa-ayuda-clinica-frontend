// frontend/src/components/layout/Header.tsx - ACTUALIZADO CON CSS MODULES
'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import RoleProtected from '../auth/RoleProtected';
import { refreshUserSession, hardRefreshSession } from '@/services/authService';
import styles from './Header.module.css';

export default function Header() {
  const { data: session, update } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navigation = [
    { name: '🏠 Dashboard', href: '/dashboard', current: pathname === '/dashboard' },
    { name: '📋 Tickets', href: '/tickets', current: pathname === '/tickets' },
    { name: '➕ Nuevo Ticket', href: '/tickets/new', current: pathname === '/tickets/new' },
  ];

  const adminNavigation = [
    { name: '👥 Usuarios', href: '/users', current: pathname === '/users' },
    { name: '📊 Reportes', href: '/reports', current: pathname === '/reports' },
  ];

  const technicianNavigation = [
    { name: '🔧 Soporte', href: '/support', current: pathname === '/support' },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProfileClick = async () => {
    if (update) {
      await update();
    }
    setIsProfileOpen(!isProfileOpen);
  };

  const handleRefreshRole = async () => {
    await hardRefreshSession();
  };

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.innerContainer}>
          
          {/* Logo y Navegación */}
          <div className={styles.logoContainer}>
            <Link href="/dashboard" className={styles.logo}>
              <div className={styles.logoIcon}>
                <span className={styles.logoText}>🏥</span>
              </div>
              <div>
                <h1 className={styles.logoTitle}>Mesa de Ayuda</h1>
                <p className={styles.logoSubtitle}>Sistema Clínico</p>
              </div>
            </Link>
            
            <nav className={styles.nav}>
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`${styles.navItem} ${
                    item.current ? styles.navItemCurrent : styles.navItemNotCurrent
                  }`}
                >
                  <span>{item.name}</span>
                </Link>
              ))}
              
              <RoleProtected allowedRoles={['admin']}>
                {adminNavigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`${styles.navItem} ${
                      item.current ? styles.navItemCurrent : styles.navItemNotCurrent
                    }`}
                  >
                    <span>{item.name}</span>
                  </Link>
                ))}
              </RoleProtected>

              <RoleProtected allowedRoles={['technician', 'admin']}>
                {technicianNavigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`${styles.navItem} ${
                      item.current ? styles.navItemCurrent : styles.navItemNotCurrent
                    }`}
                  >
                    <span>{item.name}</span>
                  </Link>
                ))}
              </RoleProtected>
            </nav>
          </div>

          {/* Usuario y Menú */}
          <div className={styles.userSection}>
            {session ? (
              <div className={styles.userDropdown} ref={dropdownRef}>
                <button
                  onClick={handleProfileClick}
                  className={styles.userButton}
                >
                  <div className={styles.userInfo}>
                    <span className={styles.userName}>
                      {session.user?.name}
                    </span>
                    <span className={styles.userRole}>
                      {session.user?.role}
                    </span>
                  </div>
                  <div className={styles.userAvatar}>
                    <span className={styles.userInitial}>
                      {session.user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {isProfileOpen && (
                  <div className={styles.dropdown}>
                    <button
                      onClick={handleRefreshRole}
                      className={styles.dropdownItem}
                    >
                      <span>🔄</span>
                      <span>Actualizar Rol</span>
                    </button>
                    <Link
                      href="/profile"
                      className={styles.dropdownItem}
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <span>👤</span>
                      <span>Mi Perfil</span>
                    </Link>
                    <div className={styles.divider}></div>
                    <button
                      onClick={handleSignOut}
                      className={styles.dropdownItem}
                    >
                      <span>🚪</span>
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className={styles.userButton}>
                Iniciar Sesión
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}