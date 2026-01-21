import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import AzureADProvider from "next-auth/providers/azure-ad"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"

// Extend the built-in types
declare module "next-auth" {
  interface User {
    merchantId?: string
    merchantName?: string
    role?: string
  }
  interface Session {
    user: {
      id?: string
      email?: string
      name?: string
      merchantId?: string
      merchantName?: string
      role?: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    merchantId?: string
    merchantName?: string
    role?: string
    userId?: string
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    // Azure AD SSO Provider
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID || "",
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET || "",
      tenantId: process.env.AZURE_AD_TENANT_ID || "",
    }),
    // Credentials provider with database lookup
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email", placeholder: "user@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Look up user in database
          const user = await prisma.users.findUnique({
            where: { email: credentials.email },
            include: { merchant: true }
          })

          if (!user || !user.is_active) {
            return null
          }

          // Check password - require password_hash for all users
          if (!user.password_hash) {
            console.warn(`Login attempt for user without password hash: ${user.email}`)
            return null
          }

          const isValidPassword = await bcrypt.compare(credentials.password, user.password_hash)
          if (!isValidPassword) {
            return null
          }

          // Update last_login
          await prisma.users.update({
            where: { id: user.id },
            data: { last_login: new Date() }
          })

          return {
            id: user.id,
            email: user.email,
            name: user.name || user.email,
            merchantId: user.merchant_id || undefined,
            merchantName: user.merchant?.name || undefined,
            role: user.role || 'merchant'
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // On initial sign in, add user data to token
      if (user) {
        token.userId = user.id
        token.merchantId = user.merchantId
        token.merchantName = user.merchantName
        token.role = user.role

        // For Azure AD users, look up or create user in database
        if (account?.provider === 'azure-ad' && user.email) {
          try {
            let dbUser = await prisma.users.findFirst({
              where: {
                OR: [
                  { email: user.email },
                  { sso_provider: 'azure_ad', sso_id: account.providerAccountId }
                ]
              },
              include: { merchant: true }
            })

            if (!dbUser) {
              // Create new SSO user - they'll need to be assigned to a merchant by admin
              dbUser = await prisma.users.create({
                data: {
                  email: user.email,
                  name: user.name || user.email,
                  sso_provider: 'azure_ad',
                  sso_id: account.providerAccountId,
                  role: 'merchant',
                  is_active: true
                },
                include: { merchant: true }
              })
            } else if (!dbUser.sso_id) {
              // Link existing user to SSO
              await prisma.users.update({
                where: { id: dbUser.id },
                data: {
                  sso_provider: 'azure_ad',
                  sso_id: account.providerAccountId,
                  last_login: new Date()
                }
              })
            }

            token.userId = dbUser.id
            token.merchantId = dbUser.merchant_id || undefined
            token.merchantName = dbUser.merchant?.name || undefined
            token.role = dbUser.role || 'merchant'
          } catch (error) {
            console.error('SSO user lookup error:', error)
          }
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId
        session.user.merchantId = token.merchantId
        session.user.merchantName = token.merchantName
        session.user.role = token.role
      }
      return session
    }
  },
  session: {
    strategy: 'jwt' as const,
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: 60 * 60,   // Refresh token every hour
  },
  secret: process.env.NEXTAUTH_SECRET,
}
