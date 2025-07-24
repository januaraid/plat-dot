import { NextRequest, NextResponse } from 'next/server'

/**
 * アイテムAPI用テストエンドポイント
 * 開発環境でのみ使用
 */

const TEST_ITEMS = [
  {
    id: 1,
    name: "MacBook Pro 14inch",
    description: "2021年モデル、M1 Pro、16GB RAM、512GB SSD",
    category: "電子機器",
    purchaseDate: "2021-11-15T00:00:00.000Z",
    purchasePrice: 239800,
    purchaseLocation: "Apple Store",
    condition: "良好",
    notes: "開発用のメインマシン",
  },
  {
    id: 2,
    name: "AirPods Pro",
    description: "第2世代、MagSafe充電ケース付き",
    category: "オーディオ",
    purchaseDate: "2022-09-23T00:00:00.000Z",
    purchasePrice: 39800,
    purchaseLocation: "Amazon",
    condition: "良好",
    notes: "毎日使用中",
  },
  {
    id: 3,
    name: "ソニー α7III",
    description: "フルサイズミラーレス一眼、ボディのみ",
    category: "カメラ",
    purchaseDate: "2020-03-10T00:00:00.000Z",
    purchasePrice: 198000,
    purchaseLocation: "ヨドバシカメラ",
    condition: "良好",
    notes: "趣味の写真撮影用",
  },
]

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  return NextResponse.json({
    message: "アイテムAPIテスト用データ",
    testEndpoints: {
      "GET /api/items": "アイテム一覧取得",
      "POST /api/items": "アイテム新規作成",
      "GET /api/items/[id]": "単一アイテム取得",
      "PUT /api/items/[id]": "アイテム更新",
      "DELETE /api/items/[id]": "アイテム削除",
    },
    sampleData: TEST_ITEMS,
    sampleRequest: {
      create: {
        name: "新しいアイテム",
        description: "説明文（オプション）",
        category: "カテゴリー（オプション）",
        purchaseDate: "2024-01-01T00:00:00.000Z（オプション）",
        purchasePrice: 10000,
        purchaseLocation: "購入場所（オプション）",
        condition: "状態（オプション）",
        notes: "メモ（オプション）",
        folderId: 1,
      },
      update: {
        name: "更新されたアイテム名",
        description: "更新された説明",
      },
      search: {
        q: "検索キーワード",
        category: "カテゴリー",
        folderId: "1",
        page: "1",
        limit: "20",
        sort: "updatedAt",
        order: "desc",
      }
    }
  })
}