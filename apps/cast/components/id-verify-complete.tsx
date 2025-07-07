"use client"

import { ArrowLeft } from "lucide-react"

interface IdentityVerificationCompleteScreenProps {
  onBack: () => void
}

export default function IdentityVerificationCompleteScreen({ onBack }: IdentityVerificationCompleteScreenProps) {
  return (
    <div className="min-h-screen w-full md:max-w-sm mx-auto bg-gray-100 flex flex-col relative">
      {/* Header */}
      <div className="bg-gold-pink-gradient px-4 py-4 h-16 flex items-center gap-3 fixed top-0 left-1/2 transform -translate-x-1/2 w-full md:max-w-sm z-10 shadow-lg">
        <button onClick={onBack}>
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-base font-medium text-white">本人確認完了</h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto mt-[64px] bg-gray-100 flex flex-col items-center justify-center p-4">
        {/* Icon */}
        <div className="mb-8">
          <svg className="w-24 h-24 text-gold-pink-gradient" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
            <circle cx="16" cy="8" r="3" stroke="currentColor" strokeWidth={1.5} fill="none" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.5 7l1 1 2-2" />
          </svg>
        </div>

        {/* Main Message */}
        <div className="text-center mb-8">
          <h2 className="text-lg font-medium text-black mb-2">ご提示ありがとうございます</h2>
          <h3 className="text-lg font-medium text-black mb-6">ただいま本人確認中です</h3>

          <div className="space-y-2 text-sm text-gray-600">
            <p>順次、確認作業を行っております。</p>
            <p>本人確認完了後公式LINEアカウントより</p>
            <p>お知らせいたします。</p>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="w-full md:max-w-sm border-2 border-gold-pink-gradient rounded-lg p-4 relative">
          {/* Lock Icon */}
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gray-100 px-2">
            <svg className="w-8 h-8 text-gold-pink-gradient" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>

          <div className="pt-4">
            <h4 className="text-sm font-medium text-black text-center mb-4">お客様情報は厳重に管理しています</h4>
            <p className="text-xs text-gray-600 leading-relaxed text-center">
              提出いただいた証明書の画像は本人確認のみに使用し、それ以外の目的で使用しません。また、証明書を含むお客様からお預かりした個人情報は退会後、一定期間保管させていただいたのちに削除しています。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
