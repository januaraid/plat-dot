import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { prisma } from "./db"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  debug: process.env.NODE_ENV === "development",
  callbacks: {
    async signIn({ user, account }) {      
      if (account?.provider === 'google' && user.email) {
        try {
          await prisma.user.upsert({
            where: { email: user.email },
            update: {
              name: user.name,
              image: user.image,
              updatedAt: new Date(),
            },
            create: {
              email: user.email,
              name: user.name,
              image: user.image,
            },
          })
        } catch (error) {
          console.error('Error saving user to database:', error)
        }
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
        
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: session.user.email! },
            select: {
              id: true,
              subscriptionTier: true,
              aiUsageCount: true,
              aiUsageLimit: true,
            },
          })
          
          if (dbUser) {
            session.user.id = dbUser.id
            session.user.subscriptionTier = dbUser.subscriptionTier
            session.user.aiUsageCount = dbUser.aiUsageCount
            session.user.aiUsageLimit = dbUser.aiUsageLimit
          }
        } catch (error) {
          console.error('Error fetching user from database:', error)
        }
      }
      return session
    },
  },
})