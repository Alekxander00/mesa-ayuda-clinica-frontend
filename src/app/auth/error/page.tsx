'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams?.get('error') || 'Unknown error';

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Error de Autenticación</h1>
      <p>Ocurrió un error durante el inicio de sesión: <strong>{error}</strong></p>
      <a href="/login" style={{ color: 'blue', textDecoration: 'underline' }}>
        Volver al login
      </a>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <ErrorContent />
    </Suspense>
  );
}