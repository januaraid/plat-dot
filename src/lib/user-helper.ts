import { prisma } from './prisma'

/**
 * ユーザーがデータベースに存在することを確認し、存在しない場合は作成する
 */
export async function ensureUserExists(user: {
  id: string
  email: string
  name?: string | null
  image?: string | null
}) {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: user.email },
    })

    if (!existingUser) {
      // ユーザーが存在しない場合は作成
      const newUser = await prisma.user.create({
        data: {
          email: user.email,
          name: user.name,
          image: user.image,
        },
      })
      return newUser
    } else {
      // 既存ユーザーの情報を更新
      const updatedUser = await prisma.user.update({
        where: { email: user.email },
        data: {
          name: user.name,
          image: user.image,
          updatedAt: new Date(),
        },
      })
      return updatedUser
    }
  } catch (error) {
    console.error('Error ensuring user exists:', error)
    throw error
  }
}

/**
 * セッションユーザーの詳細情報を取得
 */
export async function getUserDetails(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        subscriptionTier: true,
        aiUsageCount: true,
        aiUsageLimit: true,
      },
    })
    return user
  } catch (error) {
    console.error('Error fetching user details:', error)
    return null
  }
}