"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import styles from "./MobileMenu.module.css";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  navigation: Array<{
    name: string;
    href: string;
    current: boolean;
  }>;
  adminNavigation: Array<{
    name: string;
    href: string;
    current: boolean;
  }>;
}

export default function MobileMenu({ 
  isOpen, 
  onClose, 
  user, 
  navigation, 
  adminNavigation 
}: MobileMenuProps) {
  const router = useRouter();

  // Bloquear scroll cuando el menú está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Cerrar menú con tecla Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    onClose();
    router.push("/login");
  };

  const handleLinkClick = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className={styles.overlay}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Menú Móvil */}
      <div className={styles.menu}>
        {/* Header del Menú */}
        <div className={styles.header}>
          <div className={styles.userInfo}>
            {user ? (
              <>
                <div className={styles.avatar}>
                  <span className={styles.avatarText}>
                    {user.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className={styles.userDetails}>
                  <p className={styles.userName}>{user.name}</p>
                  <p className={styles.userEmail}>{user.email}</p>
                  <span className={styles.userRole}>{user.role}</span>
                </div>
              </>
            ) : (
              <div className={styles.userDetails}>
                <p className={styles.userName}>No has iniciado sesión</p>
                <p className={styles.userEmail}>Inicia sesión para continuar</p>
              </div>
            )}
          </div>
          
          <button 
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Cerrar menú"
          >
            <span className={styles.closeIcon}>×</span>
          </button>
        </div>

        {/* Navegación */}
        <nav className={styles.navigation}>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Navegación</h3>
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`${styles.navItem} ${item.current ? styles.active : ''}`}
                onClick={handleLinkClick}
                aria-current={item.current ? "page" : undefined}
              >
                <span className={styles.navIcon}>
                  {item.name.includes("🏠") ? "🏠" : 
                   item.name.includes("📋") ? "📋" : 
                   item.name.includes("➕") ? "➕" : ""}
                </span>
                <span className={styles.navText}>
                  {item.name.replace(/[🏠📋➕]/g, '').trim()}
                </span>
              </Link>
            ))}
          </div>

          {adminNavigation.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Administración</h3>
              {adminNavigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`${styles.navItem} ${item.current ? styles.active : ''}`}
                  onClick={handleLinkClick}
                  aria-current={item.current ? "page" : undefined}
                >
                  <span className={styles.navIcon}>✉️</span>
                  <span className={styles.navText}>
                    {item.name.replace('✉️ ', '')}
                  </span>
                </Link>
              ))}
            </div>
          )}

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Cuenta</h3>
            
            {user ? (
              <>
                <Link
                  href="/profile"
                  className={styles.navItem}
                  onClick={handleLinkClick}
                >
                  <span className={styles.navIcon}>👤</span>
                  <span className={styles.navText}>Mi Perfil</span>
                </Link>
                
                <button
                  onClick={handleSignOut}
                  className={`${styles.navItem} ${styles.logout}`}
                >
                  <span className={styles.navIcon}>🚪</span>
                  <span className={styles.navText}>Cerrar Sesión</span>
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className={styles.navItem}
                onClick={handleLinkClick}
              >
                <span className={styles.navIcon}>🔑</span>
                <span className={styles.navText}>Iniciar Sesión</span>
              </Link>
            )}
          </div>
        </nav>

        {/* Footer del Menú */}
        <div className={styles.footer}>
          <p className={styles.footerText}>
            Mesa de Ayuda - Sistema Clínico
          </p>
          <p className={styles.footerVersion}>
            v1.0.0
          </p>
        </div>
      </div>
    </>
  );
}