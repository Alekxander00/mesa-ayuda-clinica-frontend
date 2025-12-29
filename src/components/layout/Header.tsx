// frontend/src/components/layout/Header.tsx - ACTUALIZADO
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
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo y Navegación */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">🏥</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Mesa de Ayuda</h1>
                <p className="text-xs text-gray-500">Sistema Clínico</p>
              </div>
            </Link>

            <nav className="ml-8 flex space-x-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    item.current
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  {item.name}
                </Link>
              ))}

              {user?.role === "admin" && adminNavigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    item.current
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  {item.name}
                </Link>
              ))}

              {(user?.role === "technician" || user?.role === "admin") && technicianNavigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    item.current
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  }`}
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
                  className="flex items-center space-x-3 rounded-lg p-2 hover:bg-gray-50"
                >
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                  </div>
                  <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {user.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                    <button
                      onClick={handleRefreshRole}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <span className="mr-2">🔄</span>
                      Actualizar Rol
                    </button>
                    <Link
                      href="/profile"
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <span className="mr-2">👤</span>
                      Mi Perfil
                    </Link>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <span className="mr-2">🚪</span>
                      Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link 
                href="/login" 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
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