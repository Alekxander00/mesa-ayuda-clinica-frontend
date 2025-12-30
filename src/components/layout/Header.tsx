// frontend/src/components/layout/Header.tsx - MEJORADO
"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

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
    <header className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo y Navegación */}
          <div className="flex items-center">
            <Link 
              href="/dashboard" 
              className="flex items-center space-x-3 group"
              aria-label="Ir al dashboard"
            >
              <div className="h-9 w-9 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform duration-200 shadow-md">
                <span className="text-white font-bold text-lg">🏥</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                  Mesa de Ayuda
                </h1>
                <p className="text-xs text-gray-500">Sistema Clínico</p>
              </div>
            </Link>

            <nav className="ml-6 sm:ml-8 flex space-x-1" aria-label="Navegación principal">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    item.current
                      ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-100 shadow-sm"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm"
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
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    item.current
                      ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-100 shadow-sm"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm"
                  }`}
                  aria-current={item.current ? "page" : undefined}
                >
                  {item.name}
                </Link>
              ))}

              {(user?.role === "technician" || user?.role === "admin") && technicianNavigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    item.current
                      ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-100 shadow-sm"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm"
                  }`}
                  aria-current={item.current ? "page" : undefined}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Usuario y Menú */}
          <div className="flex items-center">
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={handleProfileClick}
                  className="flex items-center space-x-3 rounded-lg p-2 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
                  aria-expanded={isProfileOpen}
                  aria-haspopup="true"
                  aria-label="Menú de perfil"
                >
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-gray-900 truncate max-w-[120px]">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                  </div>
                  <div className="h-9 w-9 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full flex items-center justify-center shadow-md ring-2 ring-white">
                    <span className="text-white font-bold text-sm">
                      {user.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <svg 
                    className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`}
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
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-10 transform transition-all duration-200 origin-top-right">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      <div className="mt-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                          {user.role}
                        </span>
                      </div>
                    </div>
                    
                    <div className="py-1">
                      <button
                        onClick={handleRefreshRole}
                        className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150 group"
                        role="menuitem"
                      >
                        <span className="mr-3 text-gray-400 group-hover:text-blue-600 transition-colors duration-150">🔄</span>
                        <span>Actualizar Rol</span>
                      </button>
                      <Link
                        href="/profile"
                        className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150 group"
                        onClick={() => setIsProfileOpen(false)}
                        role="menuitem"
                      >
                        <span className="mr-3 text-gray-400 group-hover:text-blue-600 transition-colors duration-150">👤</span>
                        <span>Mi Perfil</span>
                      </Link>
                    </div>
                    
                    <div className="border-t border-gray-100 py-1">
                      <button
                        onClick={handleSignOut}
                        className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors duration-150 group"
                        role="menuitem"
                      >
                        <span className="mr-3 text-red-400 group-hover:text-red-600 transition-colors duration-150">🚪</span>
                        <span>Cerrar Sesión</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link 
                href="/login" 
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Iniciar Sesión
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}