// frontend/src/components/layout/Header.tsx - ACTUALIZADO CON CSS MODULES
"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import styles from "./Header.module.css";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, refresh } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
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
    { name: "✉️ Correos Autorizados", href: "/admin/authorized-emails", current: pathname === "/admin/authorized-emails" },
    { name: "👥 Usuarios", href: "/users", current: pathname === "/users" },
    { name: "📊 Reportes", href: "/reports", current: pathname === "/reports" },
  ];

  const technicianNavigation = [
    { name: "🔧 Soporte", href: "/support", current: pathname === "/support" },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleProfileClick = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  const handleRefreshRole = async () => {
    console.log("🔄 Forzando actualización de rol...");
    await refresh();
  };

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.inner}>
          {/* Logo y Navegación */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Link href="/dashboard" className={styles.logo}>
              <div className={styles.logoIcon}>
                <span>🏥</span>
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
                  className={`${styles.navLink} ${
                    item.current
                      ? styles.navLinkCurrent
                      : styles.navLinkNotCurrent
                  }`}
                >
                  {item.name}
                </Link>
              ))}

              {user?.role === "admin" && adminNavigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`${styles.navLink} ${
                    item.current
                      ? styles.navLinkCurrent
                      : styles.navLinkNotCurrent
                  }`}
                >
                  {item.name}
                </Link>
              ))}

              {(user?.role === "technician" || user?.role === "admin") && technicianNavigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`${styles.navLink} ${
                    item.current
                      ? styles.navLinkCurrent
                      : styles.navLinkNotCurrent
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Usuario y Menú */}
          <div className={styles.userSection}>
            {user ? (
              <div className={styles.dropdownContainer} ref={dropdownRef}>
                <button
                  onClick={handleProfileClick}
                  className={styles.userButton}
                >
                  <div className={styles.userInfo}>
                    <span className={styles.userName}>
                      {user.name}
                    </span>
                    <span className={styles.userRole}>
                      {user.role}
                    </span>
                  </div>
                  <div className={styles.userAvatar}>
                    <span className={styles.userInitial}>
                      {user.name?.charAt(0).toUpperCase()}
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
                    <div className={styles.dropdownDivider}></div>
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
              <Link href="/login" className={styles.loginButton}>
                Iniciar Sesión
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}