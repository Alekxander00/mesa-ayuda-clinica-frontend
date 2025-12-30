// frontend/src/middleware/apiErrorHandler.ts
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useApiErrorHandler() {
  const router = useRouter();

  useEffect(() => {
    const originalFetch = window.fetch;
    
    window.fetch = async function(...args) {
      try {
        const response = await originalFetch.apply(this, args);
        
        // Interceptar respuestas 403
        if (response.status === 403) {
          const errorText = await response.text();
          console.error('🚫 Interceptado error 403:', errorText);
          
          try {
            const errorData = JSON.parse(errorText);
            
            // Verificar si es error de correo no autorizado
            if (errorData.code === 'EMAIL_NOT_AUTHORIZED' || 
                errorData.error?.includes('Acceso denegado') ||
                errorData.message?.includes('no está autorizado')) {
              
              console.log('📤 Redirigiendo a /unauthorized desde interceptor global');
              router.push('/unauthorized');
              
              // Retornar una respuesta vacía para evitar que el código que hizo la petición continúe
              return new Response(JSON.stringify({}), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
              });
            }
          } catch (parseError) {
            // No se pudo parsear el error como JSON
          }
        }
        
        return response;
      } catch (error) {
        console.error('❌ Error en fetch interceptor:', error);
        throw error;
      }
    };

    // Limpiar al desmontar
    return () => {
      window.fetch = originalFetch;
    };
  }, [router]);
}