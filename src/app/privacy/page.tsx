'use client'

import Link from 'next/link'
import { memo } from 'react'

const PrivacyPolicyPage = memo(function PrivacyPolicyPage() {
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
          <h1 className="text-3xl font-bold text-gray-900">プライバシーポリシー</h1>
          <p className="text-gray-600 mt-2">最終更新日: 2025年8月3日</p>
        </div>

        <div className="bg-white shadow rounded-lg p-8 space-y-8">
          {/* 概要 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. 概要</h2>
            <p className="text-gray-700 leading-relaxed">
              AI在庫管理システム（以下「本サービス」）は、ユーザーの皆様のプライバシーを尊重し、個人情報の保護に努めています。
              本プライバシーポリシーは、本サービスがどのような情報を収集し、どのように使用・保護するかについて説明します。
            </p>
          </section>

          {/* 収集する情報 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. 収集する情報</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">2.1 Googleアカウント情報</h3>
                <p className="text-gray-700 leading-relaxed">
                  Google OAuth認証を通じて以下の情報を取得します：
                </p>
                <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1">
                  <li>メールアドレス</li>
                  <li>表示名</li>
                  <li>プロフィール画像</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">2.2 アプリケーション利用情報</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>作成したアイテム情報（名前、説明、カテゴリ、画像等）</li>
                  <li>フォルダ構成と管理データ</li>
                  <li>AI機能の使用履歴と回数</li>
                  <li>価格調査履歴とその結果</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">2.3 技術的情報</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>アクセスログとエラーログ</li>
                  <li>使用環境に関する基本的な技術情報</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 情報の使用目的 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. 情報の使用目的</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              収集した情報は以下の目的で使用されます：
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>本サービスの提供と機能の実現</li>
              <li>ユーザー認証とアカウント管理</li>
              <li>AI機能による画像認識と価格調査</li>
              <li>サービスの改善と不具合修正</li>
              <li>利用規約違反の防止と対応</li>
              <li>法的義務の履行</li>
            </ul>
          </section>

          {/* AI機能とデータ処理 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. AI機能とデータ処理</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">4.1 画像認識機能</h3>
                <p className="text-gray-700 leading-relaxed">
                  アップロードされた画像は、AI技術を使用してアイテム情報の自動入力に活用されます。
                  画像データは処理後、当社のセキュアなストレージに保存されます。
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">4.2 価格調査機能</h3>
                <p className="text-gray-700 leading-relaxed">
                  アイテム情報は、市場価格調査のためにAIシステムで処理され、
                  価格推移データとして保存・表示されます。
                </p>
              </div>
            </div>
          </section>

          {/* データの保存と保護 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. データの保存と保護</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">5.1 保存期間</h3>
                <p className="text-gray-700 leading-relaxed">
                  ユーザーデータは、アカウントが有効である限り保存されます。
                  アカウント削除後は、法的要件に基づく必要最小限の期間を除き、データを削除します。
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">5.2 セキュリティ対策</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>暗号化による通信保護（HTTPS/TLS）</li>
                  <li>データベースアクセス制御</li>
                  <li>定期的なセキュリティ監査</li>
                  <li>適切なアクセス権限管理</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 第三者との情報共有 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. 第三者との情報共有</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              当社は、以下の場合を除き、ユーザーの個人情報を第三者と共有することはありません：
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>ユーザーの明示的な同意がある場合</li>
              <li>法的要求や緊急事態への対応</li>
              <li>サービス提供に必要な技術パートナーとの限定的な共有（適切な保護措置を講じた場合）</li>
            </ul>
          </section>

          {/* ユーザーの権利 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. ユーザーの権利</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              ユーザーは以下の権利を有します：
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>個人情報の確認・修正（設定ページから可能）</li>
              <li>データの削除要求（アカウント削除機能※準備中）</li>
              <li>データエクスポート（※準備中）</li>
              <li>処理の制限や異議申し立て</li>
            </ul>
          </section>

          {/* Cookieの使用 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Cookieの使用</h2>
            <p className="text-gray-700 leading-relaxed">
              本サービスは、認証状態の維持と機能向上のためにCookieを使用します。
              ブラウザの設定でCookieを無効にすることも可能ですが、一部機能が制限される場合があります。
            </p>
          </section>

          {/* 変更について */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">9. プライバシーポリシーの変更</h2>
            <p className="text-gray-700 leading-relaxed">
              本プライバシーポリシーは、法的要件やサービス改善に応じて更新される場合があります。
              重要な変更については、サービス内で通知いたします。
            </p>
          </section>

          {/* お問い合わせ */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">10. お問い合わせ</h2>
            <p className="text-gray-700 leading-relaxed">
              プライバシーに関するご質問やご要望がございましたら、以下までお問い合わせください。
            </p>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700">
                <strong>連絡先:</strong> 準備中（今後サポート体制を整備予定）
              </p>
            </div>
          </section>

          {/* アクションボタン */}
          <div className="border-t pt-6 flex flex-col sm:flex-row gap-4">
            <Link
              href="/settings"
              className="inline-flex items-center px-4 py-2 border border-blue-600 text-blue-600 bg-white hover:bg-blue-50 rounded-md text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              設定ページへ
            </Link>
            <Link
              href="/profile"
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white hover:bg-gray-700 rounded-md text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              プロフィールへ
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
})

export default PrivacyPolicyPage