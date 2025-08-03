'use client'

import Link from 'next/link'
import { memo } from 'react'

const TermsOfServicePage = memo(function TermsOfServicePage() {
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
          <h1 className="text-3xl font-bold text-gray-900">利用規約</h1>
          <p className="text-gray-600 mt-2">最終更新日: 2025年8月3日</p>
        </div>

        <div className="bg-white shadow rounded-lg p-8 space-y-8">
          {/* 概要 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">第1条（適用）</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              本利用規約（以下「本規約」）は、AI在庫管理システム（以下「本サービス」）の利用に関する条件を定めるものです。
              ユーザーが本サービスを利用する場合には、本規約に同意したものとみなします。
            </p>
            <p className="text-gray-700 leading-relaxed">
              本規約は、本サービスの利用に関してユーザーと運営者との間の権利義務関係を定めることを目的とし、
              ユーザーと運営者との間の本サービスの利用に関わる一切の関係に適用されます。
            </p>
          </section>

          {/* 利用登録 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">第2条（利用登録）</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              本サービスの利用を希望する者は、本規約に同意の上、Google OAuth認証により利用登録を行うものとします。
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              運営者は、利用登録の申請者に以下の事由があると判断した場合、利用登録の申請を承認しないことがあります：
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>利用登録の申請に際して虚偽の事項を届け出た場合</li>
              <li>本規約に違反したことがある者からの申請である場合</li>
              <li>反社会的勢力等（暴力団、暴力団員、右翼団体、反社会的勢力、その他これに準ずる者を意味します）である場合</li>
              <li>その他、運営者が利用登録を相当でないと判断した場合</li>
            </ul>
          </section>

          {/* サービス内容 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">第3条（サービス内容）</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              本サービスは、以下の機能を提供します：
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>所有物品のデジタル管理機能</li>
              <li>AI画像認識による自動情報入力機能</li>
              <li>AI価格調査機能</li>
              <li>価格推移の記録・表示機能</li>
              <li>データの保存・整理機能</li>
              <li>その他関連するサービス</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              運営者は、本サービスの内容を、ユーザーに事前に通知することなく変更、追加、停止することができるものとします。
            </p>
          </section>

          {/* 禁止事項 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">第4条（禁止事項）</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません：
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>法令または公序良俗に違反する行為</li>
              <li>犯罪行為に関連する行為</li>
              <li>本サービスに含まれる著作権、商標権その他の知的財産権を侵害する行為</li>
              <li>運営者、ほかのユーザー、またはその他第三者のサーバーまたはネットワークの機能を破壊したり、妨害したりする行為</li>
              <li>運営者のサービスの運営を妨害するおそれのある行為</li>
              <li>不正アクセスをし、またはこれを試みる行為</li>
              <li>逆アセンブル、逆コンパイル、リバースエンジニアリング等によりプログラムを解析する行為</li>
              <li>本サービスと競合する事業を行う者に利益を提供する行為</li>
              <li>反社会的勢力等への利益供与</li>
              <li>公序良俗に反する内容を含む情報を送信する行為</li>
              <li>その他、運営者が不適切と判断する行為</li>
            </ul>
          </section>

          {/* AI機能の利用 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">第5条（AI機能の利用）</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">5.1 利用制限</h3>
                <p className="text-gray-700 leading-relaxed">
                  無料プランでは、AI機能（画像認識・価格調査）の利用は月20回までに制限されます。
                  利用回数の超過時は、翌月まで機能をご利用いただけません。
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">5.2 AI機能の精度</h3>
                <p className="text-gray-700 leading-relaxed">
                  AI機能による結果は参考情報として提供されるものであり、その正確性や完全性について運営者は保証いたしません。
                  ユーザーは自身の判断で情報を活用するものとします。
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">5.3 価格情報の取り扱い</h3>
                <p className="text-gray-700 leading-relaxed">
                  価格調査機能により取得される価格情報は、調査時点での参考価格であり、
                  実際の取引価格を保証するものではありません。価格情報の利用に起因する損害について、運営者は責任を負いません。
                </p>
              </div>
            </div>
          </section>

          {/* データの取り扱い */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">第6条（ユーザーデータの取り扱い）</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">6.1 データの所有権</h3>
                <p className="text-gray-700 leading-relaxed">
                  ユーザーが本サービスに登録・アップロードしたデータ（画像、テキスト情報等）の著作権その他の権利は、
                  ユーザーまたは正当な権利者に帰属します。
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">6.2 データの利用許諾</h3>
                <p className="text-gray-700 leading-relaxed">
                  ユーザーは、本サービスの提供に必要な範囲内で、運営者がユーザーデータを利用することを許諾するものとします。
                  これには、AI機能の提供、サービス改善のための分析が含まれます。
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">6.3 データの保存期間</h3>
                <p className="text-gray-700 leading-relaxed">
                  ユーザーデータは、アカウントが有効である限り保存されます。
                  アカウント削除後は、法的要件に基づく必要最小限の期間を除き、データを削除します。
                </p>
              </div>
            </div>
          </section>

          {/* サービスの停止等 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">第7条（本サービスの提供の停止等）</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              運営者は、以下のいずれかの事由があると判断した場合、ユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします：
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>本サービスにかかるコンピュータシステムの保守点検または更新を行う場合</li>
              <li>地震、落雷、火災、停電または天災などの不可抗力により、本サービスの提供が困難となった場合</li>
              <li>コンピュータまたは通信回線等が事故により停止した場合</li>
              <li>その他、運営者が本サービスの提供が困難と判断した場合</li>
            </ul>
          </section>

          {/* 保証の否認および免責事項 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">第8条（保証の否認および免責事項）</h2>
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                運営者は、本サービスに事実上または法律上の瑕疵（安全性、信頼性、正確性、完全性、有効性、特定の目的への適合性、
                セキュリティなどに関する欠陥、エラーやバグ、権利侵害などを含みます）がないことを明示的にも黙示的にも保証しておりません。
              </p>
              <p className="text-gray-700 leading-relaxed">
                運営者は、本サービスに起因してユーザーに生じたあらゆる損害について、
                運営者の故意または重過失による場合を除き、一切の責任を負いません。
              </p>
              <p className="text-gray-700 leading-relaxed">
                前項ただし書に定める場合であっても、運営者は、過失（重過失を除きます）による行為により
                ユーザーに生じた損害のうち特別な事情から生じた損害（運営者またはユーザーが損害発生につき予見し、
                または予見し得た場合を含みます）について一切の責任を負いません。
              </p>
            </div>
          </section>

          {/* 利用規約の変更 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">第9条（利用規約の変更）</h2>
            <p className="text-gray-700 leading-relaxed">
              運営者は、ユーザーに通知することなく、いつでも本規約を変更することができるものとします。
              なお、本規約の変更後、本サービスの利用を開始した場合には、当該ユーザーは変更後の規約に同意したものとみなします。
            </p>
          </section>

          {/* 個人情報の取扱い */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">第10条（個人情報の取扱い）</h2>
            <p className="text-gray-700 leading-relaxed">
              運営者は、本サービスの利用によって取得する個人情報については、運営者の
              <Link href="/privacy" className="text-blue-600 hover:text-blue-500 underline mx-1">
                プライバシーポリシー
              </Link>
              に従い適切に取り扱うものとします。
            </p>
          </section>

          {/* 通知または連絡 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">第11条（通知または連絡）</h2>
            <p className="text-gray-700 leading-relaxed">
              ユーザーと運営者との間の通知または連絡は、運営者の定める方法によって行うものとします。
              運営者は、ユーザーから登録されたメールアドレスが有効なものとみなして当該メールアドレスに通知または連絡を行い、
              これらは発信時にユーザーに到達したものとみなします。
            </p>
          </section>

          {/* 準拠法・裁判管轄 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">第12条（準拠法・裁判管轄）</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              本規約の解釈にあたっては、日本法を準拠法とします。
            </p>
            <p className="text-gray-700 leading-relaxed">
              本サービスに関して紛争が生じた場合には、運営者の本店所在地を管轄する裁判所を専属的合意管轄とします。
            </p>
          </section>

          {/* 施行日 */}
          <section className="border-t pt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">附則</h2>
            <p className="text-gray-700 leading-relaxed">
              本規約は、2025年8月3日から施行するものとします。
            </p>
          </section>

          {/* アクションボタン */}
          <div className="border-t pt-6 flex flex-col sm:flex-row gap-4">
            <Link
              href="/privacy"
              className="inline-flex items-center px-4 py-2 border border-blue-600 text-blue-600 bg-white hover:bg-blue-50 rounded-md text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              プライバシーポリシー
            </Link>
            <Link
              href="/help"
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white hover:bg-gray-700 rounded-md text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              ヘルプページ
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
})

export default TermsOfServicePage