// frontend/src/app/login/page.tsx - ACTUALIZADO
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import AnimatedBackground from "@/components/Animated/AnimatedBackground";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const checkEmailAuthorization = async (email: string): Promise<boolean> => {
    try {
      const baseURL = process.env.NEXT_PUBLIC_API_URL || 'https://mesa-ayuda-clinica-backend-production.up.railway.app/api';
      
      const response = await fetch(`${baseURL}/auth/check-email/${encodeURIComponent(email)}`);
      
      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.isAuthorized;
    } catch (err) {
      console.error('❌ Error verificando autorización:', err);
      return false;
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError("");

      console.log("🔐 Iniciando login con Google...");

      // Iniciar sesión con Google
      const result = await signIn("google", {
        redirect: false,
        callbackUrl: "/dashboard",
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      if (result?.ok) {
        console.log("✅ Login con Google exitoso");
        
        // Esperar un momento para que la sesión se establezca
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Obtener el email del usuario desde la sesión (esto se haría normalmente después del login)
        // En un caso real, NextAuth maneja esto automáticamente
        
        // Redirigir a dashboard - el AuthProvider se encargará de verificar la autorización
        router.push('/dashboard');
      }
    } catch (err: any) {
      console.error("❌ Error en login:", err);
      setError(err.message || "Error al iniciar sesión");
      setLoading(false);
    }
  };

  return (
    <>
      <AnimatedBackground />

      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>
              <img src="../favicon.ico" alt="Logo" />
            </div>

            <h1 className={styles.title}>Mesa de Ayuda ALXO</h1>
            <p className={styles.subtitle}>Sistema de gestión de tickets</p>
          </div>

          {error && (
            <div className={styles.error}>
              <p className={styles.errorTitle}>Error</p>
              <p className={styles.errorMessage}>{error}</p>
              <button
                onClick={() => setError("")}
                className={styles.errorButton}
              >
                Intentar de nuevo
              </button>
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className={styles.googleButton}
          >
            {loading ? (
              <span className={styles.loading}>
                <div className={styles.spinner}></div>
                Procesando...
              </span>
            ) : (
              <>
                <svg className={styles.googleIcon} viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Iniciar sesión con Google
              </>
            )}
          </button>

          <div className={styles.footer}>
            <p>
              Solo los correos autorizados pueden acceder al sistema.
              Contacta al administrador si necesitas acceso.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}