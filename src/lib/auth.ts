import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account consent",
          access_type: "offline",
          response_type: "code",
          include_granted_scopes: "true",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24時間（セッション更新間隔を1日に制限）
  },
  debug: process.env.NODE_ENV === "development",
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
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
        if (user.name) token.name = user.name
        if (user.image) token.image = user.image
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        // メールアドレスをユーザーIDとして使用（一貫性を保つ）
        if (token.userId) {
          session.user.id = token.userId as string
        }
        
        // トークンからユーザー情報を復元（元の情報を保持）
        // NextAuth.jsのデフォルト動作を優先し、トークンからの情報は補完のみ
        if (token.email && !session.user.email) {
          session.user.email = token.email as string
        }
        if (token.name && !session.user.name) {
          session.user.name = token.name as string
        }
        if (token.image && !session.user.image) {
          session.user.image = token.image as string
        }
        
        // Edge Runtimeでは基本情報のみ設定（Prismaアクセスを避ける）
        session.user.subscriptionTier = 'free'
        session.user.aiUsageCount = 0
        session.user.aiUsageLimit = 20
      }
      return session
    },
  },
})