import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      subscriptionTier?: string
      aiUsageCount?: number
      aiUsageLimit?: number
    }
    hasSession: boolean
  }

  interface User {
    id: string
    subscriptionTier?: string
    aiUsageCount?: number
    aiUsageLimit?: number
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
  }
}