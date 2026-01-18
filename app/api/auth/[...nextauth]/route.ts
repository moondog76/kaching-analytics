import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import AzureADProvider from "next-auth/providers/azure-ad"

const handler = NextAuth({
  providers: [
    // Azure AD SSO Provider
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
    }),
    // Keep existing Credentials provider for demo/fallback
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
          } as any
        }

        return null
      }
    })
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.merchant = (user as any).merchant
        // For Azure AD users, extract info from profile
        if (account?.provider === 'azure-ad') {
          token.merchant = 'Enterprise' // Default for SSO users
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).merchant = token.merchant
      }
      return session
    }
  },
  session: {
    strategy: 'jwt' as const,
  },
  secret: process.env.NEXTAUTH_SECRET,
})

export { handler as GET, handler as POST }
