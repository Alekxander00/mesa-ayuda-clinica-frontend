// frontend/src/app/unauthorized/page.tsx
'use client';

import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function UnauthorizedPage() {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-4">🚫</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Acceso No Autorizado</h1>
        
        <p className="text-gray-600 mb-6">
          Tu correo electrónico no está autorizado para usar este sistema.
          Contacta al administrador para solicitar acceso.
        </p>

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
            <h3 className="font-medium text-blue-800 mb-2">¿Qué puedes hacer?</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Contacta al administrador del sistema</li>
              <li>• Verifica que tu correo esté correctamente escrito</li>
              <li>• Si crees que es un error, notifica al soporte</li>
            </ul>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleLogout}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
            >
              Cerrar Sesión
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg transition-colors duration-200"
            >
              Reintentar
            </button>
          </div>

          <div className="text-sm text-gray-500 pt-4 border-t border-gray-200">
            <p>
              Si eres administrador,{' '}
              <Link href="/admin/authorized-emails" className="text-blue-600 hover:underline">
                gestiona los correos autorizados aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}