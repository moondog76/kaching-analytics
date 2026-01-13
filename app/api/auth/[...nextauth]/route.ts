import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email", placeholder: "user@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // For demo: hardcoded users
        // In production, check against database
        const users = [
          {
            id: '1',
            email: 'carrefour@demo.com',
            password: 'demo123',
            name: 'Carrefour Admin',
            merchant: 'Carrefour'
          },
          {
            id: '2',
            email: 'lidl@demo.com',
            password: 'demo123',
            name: 'Lidl Admin',
            merchant: 'Lidl'
          }
        ]
        
        const user = users.find(
          u => u.email === credentials?.email && u.password === credentials?.password
        )
        
        if (user) {
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            merchant: user.merchant
          }
        }
        
        return null
      }
    })
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.merchant = user.merchant
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.merchant = token.merchant
      }
      return session
    }
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
})

export { handler as GET, handler as POST }
