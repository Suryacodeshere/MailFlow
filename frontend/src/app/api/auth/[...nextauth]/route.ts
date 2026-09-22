import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    })
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      // Send user data to our backend to sync
      if (session.user) {
        try {
          await fetch((process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000') + '/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: session.user.email,
              name: session.user.name,
              avatar: session.user.image,
              googleId: token.sub
            })
          });
        } catch (e) {
          console.error("Failed to sync user with backend");
        }
      }
      return session;
    }
  }
})

export { handler as GET, handler as POST }
