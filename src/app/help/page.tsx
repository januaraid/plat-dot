'use client'

import Link from 'next/link'
import { memo, useState } from 'react'

const HelpPage = memo(function HelpPage() {
  const [openSection, setOpenSection] = useState<string | null>(null)

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-500 flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              ホームに戻る
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">ヘルプ・使い方ガイド</h1>
          <p className="text-gray-600 mt-2">AI在庫管理システムの使い方をご案内します</p>
        </div>

        {/* クイックナビゲーション */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">よく見られる項目</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => toggleSection('getting-started')}
              className="text-left p-3 bg-white rounded-md border border-blue-200 hover:bg-blue-50 transition-colors"
            >
              <div className="font-medium text-blue-900">はじめての方へ</div>
              <div className="text-sm text-blue-700">基本的な使い方を学ぶ</div>
            </button>
            <button
              onClick={() => toggleSection('ai-features')}
              className="text-left p-3 bg-white rounded-md border border-blue-200 hover:bg-blue-50 transition-colors"
            >
              <div className="font-medium text-blue-900">AI機能について</div>
              <div className="text-sm text-blue-700">画像認識と価格調査機能</div>
            </button>
            <button
              onClick={() => toggleSection('troubleshooting')}
              className="text-left p-3 bg-white rounded-md border border-blue-200 hover:bg-blue-50 transition-colors"
            >
              <div className="font-medium text-blue-900">トラブルシューティング</div>
              <div className="text-sm text-blue-700">よくある問題と解決方法</div>
            </button>
            <button
              onClick={() => toggleSection('account')}
              className="text-left p-3 bg-white rounded-md border border-blue-200 hover:bg-blue-50 transition-colors"
            >
              <div className="font-medium text-blue-900">アカウント設定</div>
              <div className="text-sm text-blue-700">プロフィール・設定の管理</div>
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* はじめての方へ */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('getting-started')}
              className="w-full text-left px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
            >
              <h2 className="text-xl font-semibold text-gray-900">🚀 はじめての方へ</h2>
              <svg 
                className={`w-5 h-5 text-gray-500 transform transition-transform ${openSection === 'getting-started' ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {openSection === 'getting-started' && (
              <div className="px-6 py-4 space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">1. Googleアカウントでログイン</h3>
                  <p className="text-gray-700">右上の「ログイン」ボタンから、Googleアカウントを使用してログインしてください。</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">2. 最初のアイテムを追加</h3>
                  <p className="text-gray-700">「アイテム管理」画面から「新規作成」ボタンをクリックし、手持ちのアイテムを登録してみましょう。</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">3. AI機能を活用</h3>
                  <p className="text-gray-700">画像をアップロードすると、AIが自動でアイテム情報を入力し、価格調査も行えます。</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">4. フォルダで整理</h3>
                  <p className="text-gray-700">カテゴリ別にフォルダを作成して、アイテムを効率的に管理しましょう。</p>
                </div>
              </div>
            )}
          </div>

          {/* AI機能について */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('ai-features')}
              className="w-full text-left px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
            >
              <h2 className="text-xl font-semibold text-gray-900">🤖 AI機能について</h2>
              <svg 
                className={`w-5 h-5 text-gray-500 transform transition-transform ${openSection === 'ai-features' ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {openSection === 'ai-features' && (
              <div className="px-6 py-4 space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">画像認識機能</h3>
                  <p className="text-gray-700 mb-2">アイテム作成時に画像をアップロードすると、AIが画像を分析して以下の情報を自動入力します：</p>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>アイテム名</li>
                    <li>カテゴリ</li>
                    <li>メーカー・ブランド</li>
                    <li>基本的な説明</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">AI価格調査機能</h3>
                  <p className="text-gray-700 mb-2">アイテム詳細画面で「AI価格調査」ボタンをクリックすると、現在の市場価格を調査します：</p>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>複数のサイトから価格情報を収集</li>
                    <li>最安値・平均価格・最高価格を表示</li>
                    <li>価格の推移をグラフで確認</li>
                    <li>調査結果は履歴として保存</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">使用制限について</h3>
                  <p className="text-gray-700">無料プランでは月20回までAI機能をご利用いただけます。設定画面で使用状況を確認できます。</p>
                </div>
              </div>
            )}
          </div>

          {/* 基本機能 */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('basic-features')}
              className="w-full text-left px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
            >
              <h2 className="text-xl font-semibold text-gray-900">📋 基本機能</h2>
              <svg 
                className={`w-5 h-5 text-gray-500 transform transition-transform ${openSection === 'basic-features' ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {openSection === 'basic-features' && (
              <div className="px-6 py-4 space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">アイテム管理</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>アイテムの作成・編集・削除</li>
                    <li>複数画像のアップロードと管理</li>
                    <li>購入情報（日付・価格・場所）の記録</li>
                    <li>状態・メモの管理</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">フォルダ機能</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>階層構造でのフォルダ作成</li>
                    <li>アイテムのフォルダ間移動</li>
                    <li>フォルダ別での検索・絞り込み</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">検索・絞り込み</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>アイテム名での検索</li>
                    <li>カテゴリ・メーカー別の絞り込み</li>
                    <li>価格帯での絞り込み</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">ダッシュボード</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>所有アイテムの統計表示</li>
                    <li>最近追加したアイテム</li>
                    <li>AI価格推移グラフ</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* トラブルシューティング */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('troubleshooting')}
              className="w-full text-left px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
            >
              <h2 className="text-xl font-semibold text-gray-900">🔧 トラブルシューティング</h2>
              <svg 
                className={`w-5 h-5 text-gray-500 transform transition-transform ${openSection === 'troubleshooting' ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {openSection === 'troubleshooting' && (
              <div className="px-6 py-4 space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Q. 画像がアップロードできない</h3>
                  <p className="text-gray-700">A. 以下をご確認ください：</p>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>ファイル形式がJPEG、PNG、WebPであること</li>
                    <li>ファイルサイズが10MB以下であること</li>
                    <li>ブラウザでJavaScriptが有効になっていること</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Q. AI機能が使えない</h3>
                  <p className="text-gray-700">A. 以下をご確認ください：</p>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>月の使用制限（20回）に達していないか</li>
                    <li>インターネット接続が安定しているか</li>
                    <li>ページを再読み込みしてみる</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Q. ログインできない</h3>
                  <p className="text-gray-700">A. 以下をお試しください：</p>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>ブラウザのCookieが有効になっているか確認</li>
                    <li>プライベートブラウジングモードを終了</li>
                    <li>ブラウザのキャッシュをクリア</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Q. データが表示されない</h3>
                  <p className="text-gray-700">A. 以下をお試しください：</p>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>ページを再読み込み</li>
                    <li>ブラウザの開発者ツールでエラーを確認</li>
                    <li>別のブラウザで試してみる</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* アカウント設定 */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('account')}
              className="w-full text-left px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
            >
              <h2 className="text-xl font-semibold text-gray-900">👤 アカウント設定</h2>
              <svg 
                className={`w-5 h-5 text-gray-500 transform transition-transform ${openSection === 'account' ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {openSection === 'account' && (
              <div className="px-6 py-4 space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">プロフィール設定</h3>
                  <p className="text-gray-700 mb-2">ヘッダーのアイコンから「設定」を選択して以下の項目を管理できます：</p>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>表示名の変更</li>
                    <li>AI使用状況の確認</li>
                    <li>通知設定（準備中）</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">データ管理</h3>
                  <p className="text-gray-700 mb-2">設定画面からデータの管理が行えます：</p>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>データエクスポート（準備中）</li>
                    <li>アカウント削除（準備中）</li>
                    <li>プライバシー設定の確認</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">認証について</h3>
                  <p className="text-gray-700">本サービスはGoogleアカウントによる認証を使用しており、安全性が確保されています。メールアドレスの変更はGoogleアカウント側で行ってください。</p>
                </div>
              </div>
            )}
          </div>

          {/* お問い合わせ */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">📞 サポート・お問い合わせ</h2>
            <div className="space-y-4">
              <p className="text-gray-700">
                上記で解決しない問題やご要望がございましたら、以下の方法でお問い合わせください。
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 font-medium">現在サポート体制を整備中です</p>
                <p className="text-gray-600 text-sm mt-1">
                  お急ぎの場合は、ブラウザの開発者ツールのコンソールでエラー内容をご確認いただき、
                  可能な範囲で詳細情報をお教えいただけると助かります。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="mt-8 border-t pt-6 flex flex-col sm:flex-row gap-4">
          <Link
            href="/profile"
            className="inline-flex items-center px-4 py-2 border border-blue-600 text-blue-600 bg-white hover:bg-blue-50 rounded-md text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            プロフィールへ
          </Link>
          <Link
            href="/settings"
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white hover:bg-gray-700 rounded-md text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            設定ページへ
          </Link>
        </div>
      </div>
    </div>
  )
})

export default HelpPage