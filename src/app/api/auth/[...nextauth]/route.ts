// frontend/src/app/api/auth/[...nextauth]/route.ts - VERSIÓN CORREGIDA
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

// ✅ CONFIGURACIÓN SIMPLIFICADA Y FUNCIONAL
const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  
  callbacks: {
    async signIn({ user, account, profile, email, credentials }: any) {
      console.log('🔐 SignIn callback:', { email: user.email });
      return true;
    },
    
    async jwt({ token, account, profile }: any) {
      // ✅ Solo guardar información básica en el token
      if (account) {
        token.accessToken = account.access_token;
        token.idToken = account.id_token;
      }
      return token;
    },
    
    async session({ session, token }: any) {
      try {
        // ✅ Pasar información básica a la sesión
        if (session.user) {
          session.user.id = token.sub;
          // El rol se obtendrá del backend después
          session.user.role = 'user'; // Valor por defecto, será actualizado
          session.accessToken = token.accessToken;
        }
        return session;
      } catch (error) {
        console.error('Error en session callback:', error);
        return session;
      }
    },
  },

  pages: {
    signIn: '/login',
    error: '/auth/error',
  },

  secret: process.env.NEXTAUTH_SECRET!,
  
  // ✅ CONFIGURACIÓN ADICIONAL
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };