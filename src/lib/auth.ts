import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"

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
      // Edge Runtimeではデータベース操作を避ける
      // ユーザー情報はAPIルート側で必要に応じて処理
      return true
    },
    async jwt({ token, user }) {
      // 初回サインイン時にuser.emailからユーザーIDを決定的に生成
      if (user?.email) {
        // メールアドレスをベースにした一意IDを生成（常に同じ値になる）
        const consistentId = user.email
        token.userId = consistentId
        token.email = user.email
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.userId) {
        // メールアドレスをユーザーIDとして使用（一貫性を保つ）
        session.user.id = token.userId as string
        
        // Edge Runtimeでは基本情報のみ設定（Prismaアクセスを避ける）
        session.user.subscriptionTier = 'free'
        session.user.aiUsageCount = 0
        session.user.aiUsageLimit = 20
      }
      return session
    },
  },
})