import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

// ✅ CONFIGURACIÓN 100% LOCAL - SIN LLAMADAS EXTERNAS EN CALLBACKS
const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  
  // ✅ ELIMINAR COMPLETAMENTE LOS CALLBACKS QUE HACEN FETCH
  callbacks: {
    async session({ session, token }: any) {
      try {
        // ✅ PERMITIR QUE EL ROL SEA ACTUALIZADO DESDE EL FRONTEND
        if (session.user) {
          session.user.id = token.sub;
          // El rol puede venir del token O ser actualizado luego via update()
          session.user.role = token.role || 'user';
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

  secret: process.env.NEXTAUTH_SECRET,
  
  // ✅ CONFIGURACIÓN ADICIONAL PARA ESTABILIDAD
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };