import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // テストユーザー作成
  const testUser = await prisma.user.create({
    data: {
      email: 'test@example.com',
      name: 'テストユーザー',
      subscriptionTier: 'free',
      aiUsageCount: 0,
      aiUsageLimit: 20,
    },
  })

  // テストフォルダ作成
  const testFolder = await prisma.folder.create({
    data: {
      name: 'テスト用フォルダ',
      description: 'サンプルフォルダです',
      userId: testUser.id,
    },
  })

  // サブフォルダ作成
  const subFolder = await prisma.folder.create({
    data: {
      name: 'サブフォルダ',
      description: '階層テスト用',
      parentId: testFolder.id,
      userId: testUser.id,
    },
  })

  // テストアイテム作成
  const testItem = await prisma.item.create({
    data: {
      name: 'サンプルアイテム',
      description: 'テスト用のサンプルアイテムです',
      category: 'テスト',
      purchaseDate: new Date('2024-01-01'),
      purchasePrice: 1000,
      folderId: testFolder.id,
      userId: testUser.id,
    },
  })

  console.log('✅ Seeding completed successfully!')
  console.log('📊 Created:')
  console.log(`  - User: ${testUser.email}`)
  console.log(`  - Folders: ${testFolder.name} (with ${subFolder.name})`)
  console.log(`  - Items: ${testItem.name}`)
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })