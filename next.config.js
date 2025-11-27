/** @type {import('next').NextConfig} */

const nextConfig = {
  output: 'standalone',
  compress: true,
  poweredByHeader: false,
  
  // ✅ SOLUCIÓN: ELIMINAR REWRITES TEMPORALMENTE para debugging
  async rewrites() {
    // ❌ COMENTAR TEMPORALMENTE LOS REWRITES
    /*
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://mesa-ayuda-clinica-backend-production.up.railway.app/api';
    console.log('🔧 Configurando rewrites para backend (excluyendo NextAuth):', backendUrl);
    
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/:path*`,
        has: [
          {
            type: 'header',
            key: 'next-action',
          }
        ],
        missing: [
          {
            type: 'header',
            key: 'next-action',
          }
        ]
      },
      {
        source: '/api/:path((?!auth/).*)',
        destination: `${backendUrl}/:path*`,
      }
    ];
    */
    
    // ✅ RETORNAR ARRAY VACÍO TEMPORALMENTE
    return [];
  },

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
};

if (process.env.NODE_ENV !== 'production') {
  nextConfig.experimental = {
    serverComponentsExternalPackages: [],
  };
}

module.exports = nextConfig;