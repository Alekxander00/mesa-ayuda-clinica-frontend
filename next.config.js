// frontend/next.config.js - CONFIGURADO PARA PRODUCCIÓN
/** @type {import('next').NextConfig} */

const isProduction = process.env.NODE_ENV === 'production';
const backendUrl = isProduction 
  ? process.env.NEXT_PUBLIC_BACKEND_URL 
  : 'http://localhost:3001';

const nextConfig = {
  // Configuración para producción
  output: 'standalone',
  compress: true,
  poweredByHeader: false,
  
  // Rewrites para API en desarrollo y producción
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: isProduction 
          ? `${backendUrl}/api/:path*`
          : 'http://localhost:3001/api/:path*',
      },
    ];
  },

  // Headers de seguridad
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },

  // Variables de entorno
  env: {
    NEXT_PUBLIC_BACKEND_URL: backendUrl,
    NEXTAUTH_URL: isProduction 
      ? process.env.NEXTAUTH_URL 
      : 'http://localhost:3000',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  },
};

// Solo en desarrollo, deshabilitar algunas optimizaciones
if (!isProduction) {
  nextConfig.experimental = {
    serverComponentsExternalPackages: [],
  };
}

module.exports = nextConfig;