"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import LoginModal from "@/components/login-modal"
import SignupModal from "@/components/signup-modal"
import HomeScreen from "@/components/home-screen"

export default function CapuApp() {
  const { data: session, status } = useSession()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showSignupModal, setShowSignupModal] = useState(false)

  // デバッグ用ログ
  console.log("CapuApp state:", { showLoginModal, showSignupModal, session, status })

  // ローディング中
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">読み込み中...</div>
      </div>
    )
  }

  // ログイン済み
  if (session) {
    return (
      <div className="h-screen bg-black flex justify-center overflow-hidden">
        <div className="w-full md:max-w-sm h-full overflow-hidden">
          <HomeScreen />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex justify-center">
      <div className="min-h-screen relative overflow-y-auto w-full md:max-w-sm bg-white mobile-safe-area">
        {/* Background Gradient */}
        <div className="absolute inset-0 z-0">
          <div className="w-full h-full bg-main-navy-gradient"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-start p-3 pt-6 xs:p-4 xs:pt-8 iphone:p-4 iphone:pt-10 sm:p-6 sm:pt-12 shrink-0">
            <div></div>
            <div className="text-right">
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col justify-center px-3 py-2 xs:px-4 xs:py-4 iphone:px-4 iphone:py-6 sm:px-6 sm:py-8 min-h-0 relative">
            {/* Background Logo */}
            <div className="absolute inset-0 flex items-center justify-center z-1">
              <img 
                src="/capu-logo.svg" 
                alt="Capu Logo" 
                className="w-36 h-36 xs:w-40 xs:h-40 iphone:w-40 iphone:h-40 sm:w-48 sm:h-48 object-contain" 
              />
            </div>
          </div>

          {/* Bottom Section */}
          <div className="px-3 pb-4 xs:px-4 xs:pb-6 iphone:px-4 iphone:pb-6 sm:px-6 sm:pb-8 shrink-0">
            {/* Buttons */}
            <div className="space-y-2 xs:space-y-3 iphone:space-y-3 sm:space-y-4">
              <button
                onClick={() => {
                  console.log("新規登録ボタンがクリックされました")
                  setShowLoginModal(true)
                }}
                className="w-full h-11 xs:h-12 iphone:h-12 sm:h-14 bg-white border-2 border-accent-blue text-accent-blue hover:bg-accent-blue/10 hover:border-accent-blue hover:text-accent-blue text-sm xs:text-sm iphone:text-base sm:text-base font-semibold rounded-full transition-all duration-300 cursor-pointer transform hover:scale-[1.02] active:scale-[0.98] shadow-md"
              >
                ログイン
              </button>
            </div>
            
            {/* Terms */}
            <div className="pt-4 xs:pt-6 iphone:pt-6 sm:pt-8">
              <p className="text-white text-xs leading-relaxed text-center px-1 xs:px-2 iphone:px-2">
                本サービスは18歳以上が利用可能です。新規登録にあたって、
                <a href="https://capu-app.notion.site/Capu_-21b42cc81529808d8bbcfab37ec4c2ef" target="_blank" rel="noopener noreferrer" className="underline text-accent-blue cursor-pointer hover:text-white transition-colors">利用規約</a>と
                <a href="https://capu-app.notion.site/Capu_-21b42cc815298053b8f6e818e327c1f1" target="_blank" rel="noopener noreferrer" className="underline text-accent-blue cursor-pointer hover:text-white transition-colors">プライバシーポリシー</a>
                に同意することとします。
              </p>
            </div>
          </div>
        </div>

        {/* Login Modal */}
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onLogin={() => {
            // NextAuth will handle the session update
            setShowLoginModal(false)
          }}
        />
      </div>
    </div>
  )
}
