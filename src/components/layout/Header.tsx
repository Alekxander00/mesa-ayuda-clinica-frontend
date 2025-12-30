"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import styles from "./Header.module.css";
import MobileMenu from "./MobileMenu";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navigation = [
    {
      name: "🏠 Dashboard",
      href: "/dashboard",
      current: pathname === "/dashboard",
    },
    { name: "📋 Tickets", href: "/tickets", current: pathname === "/tickets" },
    {
      name: "➕ Nuevo Ticket",
      href: "/tickets/new",
      current: pathname === "/tickets/new",
    },
  ];

  const adminNavigation = [
    { 
      name: "✉️ Correos Autorizados", 
      href: "/admin/authorized-emails", 
      current: pathname === "/admin/authorized-emails" 
    },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleProfileClick = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  const handleMobileMenuClick = () => {
    setIsMobileMenuOpen(true);
  };

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  return (
    <>
      <header className={styles.header}>
        <div className={styles.container}>
          <div className={styles.innerContainer}>
            {/* Logo y Navegación Desktop */}
            <div className={styles.logoContainer}>
              <Link 
                href="/dashboard" 
                className={styles.logo}
                aria-label="Ir al dashboard"
              >
                <div className={styles.logoIcon}>
                  <span className={styles.logoText}>🏥</span>
                </div>
                <div className={styles.logoContent}>
                  <h1 className={styles.logoTitle}>Mesa de Ayuda</h1>
                  <p className={styles.logoSubtitle}>Sistema de Mensajería</p>
                </div>
              </Link>

              {/* Navegación Desktop */}
              <nav className={styles.nav} aria-label="Navegación principal">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`${styles.navItem} ${
                      item.current ? styles.navItemCurrent : ""
                    }`}
                    aria-current={item.current ? "page" : undefined}
                  >
                    {item.name}
                  </Link>
                ))}

                {user?.role === "admin" && adminNavigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`${styles.navItem} ${
                      item.current ? styles.navItemCurrent : ""
                    }`}
                    aria-current={item.current ? "page" : undefined}
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Botón Hamburguesa para Móvil */}
            <button 
              className={styles.mobileMenuButton}
              onClick={handleMobileMenuClick}
              aria-label="Abrir menú de navegación"
              aria-expanded={isMobileMenuOpen}
            >
              ☰
            </button>

            {/* Usuario y Menú Desktop */}
            <div className={styles.userSection}>
              {user ? (
                <div className={styles.userDropdown} ref={dropdownRef}>
                  <button
                    onClick={handleProfileClick}
                    className={styles.userButton}
                    aria-expanded={isProfileOpen}
                    aria-haspopup="true"
                    aria-label="Menú de perfil"
                  >
                    <div className={styles.userInfo}>
                      <span className={styles.userName}>{user.name}</span>
                      <span className={styles.userRole}>{user.role}</span>
                    </div>
                    <div className={styles.userAvatar}>
                      <span className={styles.userInitial}>
                        {user.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <svg 
                      className={`${styles.dropdownIcon} ${isProfileOpen ? styles.dropdownIconOpen : ''}`}
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 20 20" 
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {isProfileOpen && (
                    <div className={styles.dropdown}>
                      <div className={styles.dropdownHeader}>
                        <p className={styles.dropdownName}>{user.name}</p>
                        <p className={styles.dropdownEmail}>{user.email}</p>
                        <div className={styles.dropdownRoleBadge}>{user.role}</div>
                      </div>
                      
                      <div className={styles.dropdownDivider}></div>
                      
                      <Link
                        href="/profile"
                        className={styles.dropdownItem}
                        onClick={() => setIsProfileOpen(false)}
                        role="menuitem"
                      >
                        <span className={styles.dropdownItemIcon}>👤</span>
                        <span>Mi Perfil</span>
                      </Link>
                      
                      <div className={styles.dropdownDivider}></div>
                      
                      <button
                        onClick={handleSignOut}
                        className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                        role="menuitem"
                      >
                        <span className={styles.dropdownItemIcon}>🚪</span>
                        <span>Cerrar Sesión</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link 
                  href="/login" 
                  className={styles.loginButton}
                >
                  Iniciar Sesión
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Menú Móvil como Modal Overlay */}
      <MobileMenu 
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        user={user}
        navigation={navigation}
        adminNavigation={user?.role === "admin" ? adminNavigation : []}
      />
    </>
  );
}