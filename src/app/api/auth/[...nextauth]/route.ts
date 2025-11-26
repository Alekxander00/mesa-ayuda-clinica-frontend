// frontend/src/app/api/auth/[...nextauth]/route.ts - ACTUALIZADO CON ROLES
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

console.log('🔐 NextAuth Config - Inicializando...');

const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }: any) {
      console.log('🔐 NextAuth - SignIn:', user?.email);
      
      // Aquí podríamos sincronizar con el backend si es necesario
      try {
        const response = await fetch('http://localhost:3001/api/auth/sync-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: user.email,
            name: user.name,
          }),
        });
        
        if (response.ok) {
          const userData = await response.json();
          console.log('🔐 Usuario sincronizado con backend:', userData);
        }
      } catch (error) {
        console.warn('⚠️ No se pudo sincronizar usuario con backend:', error);
      }
      
      return true;
    },
    async session({ session, token }: any) {
      console.log('🔐 NextAuth - Session callback:', session.user?.email);
      
      if (session.user) {
        session.user.id = token.sub;
        
        // Intentar obtener información actualizada del usuario desde el backend
        try {
          const response = await fetch(`http://localhost:3001/api/auth/user-info?email=${session.user.email}`);
          if (response.ok) {
            const userData = await response.json();
            session.user.role = userData.role;
            session.user.id = userData.id;
            console.log('🔐 Sesión actualizada con datos del backend:', userData);
          }
        } catch (error) {
          console.warn('⚠️ No se pudo obtener información del usuario del backend:', error);
        }
      }
      return session;
    },
    async jwt({ token, user, account }: any) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
  pages: {
    signIn: '/login',
  },
  debug: true,
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };