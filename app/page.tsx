"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import LoginModal from "@/components/login-modal"
import SignupModal from "@/components/signup-modal"
import HomeScreen from "@/components/home-screen"

export default function CapuApp() {
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showSignupModal, setShowSignupModal] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // デバッグ用ログ
  console.log("CapuApp state:", { showLoginModal, showSignupModal, isLoggedIn })

  if (isLoggedIn) {
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
          <div className="w-full h-full bg-gradient-to-br from-white via-gray-50 to-pink-50"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-gray-100/50"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-100/30 to-pink-100/35"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-start p-3 pt-6 xs:p-4 xs:pt-8 iphone:p-4 iphone:pt-10 sm:p-6 sm:pt-12 shrink-0">
            <div></div>
            <div className="text-right">
              <img 
                src="/capu-logo.svg" 
                alt="Capu Logo" 
                className="w-14 h-14 xs:w-16 xs:h-16 iphone:w-16 iphone:h-16 sm:w-20 sm:h-20 object-contain ml-auto" 
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col justify-center px-3 py-2 xs:px-4 xs:py-4 iphone:px-4 iphone:py-6 sm:px-6 sm:py-8 min-h-0">
            <div className="space-y-4 xs:space-y-6 iphone:space-y-6 sm:space-y-8">
              <div>
                <p className="text-gray-700 text-sm xs:text-base iphone:text-base sm:text-lg leading-relaxed mb-3 xs:mb-4 iphone:mb-4 sm:mb-6">
                  世の中には偽物が増えすぎたと<br />
                  思っているあなたに。
                </p>
              </div>

              <div className="space-y-2 xs:space-y-3 iphone:space-y-3 sm:space-y-4">
                <h1 className="text-gold-pink-gradient text-xl xs:text-2xl iphone:text-2xl sm:text-3xl font-medium leading-tight">
                  "#最高の乾杯"に
                </h1>
                <h1 className="text-gold-pink-gradient text-xl xs:text-2xl iphone:text-2xl sm:text-3xl font-medium leading-tight">
                  Capuでつながる。
                </h1>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="px-3 pb-4 xs:px-4 xs:pb-6 iphone:px-4 iphone:pb-6 sm:px-6 sm:pb-8 shrink-0">
            {/* Buttons */}
            <div className="space-y-2 xs:space-y-3 iphone:space-y-3 sm:space-y-4">
              <button
                onClick={() => {
                  console.log("ログインボタンがクリックされました")
                  setShowLoginModal(true)
                }}
                className="w-full h-11 xs:h-12 iphone:h-12 sm:h-14 bg-gold-pink-gradient hover:bg-gold-pink-gradient-dark text-white text-sm xs:text-sm iphone:text-base sm:text-base font-semibold rounded-full shadow-lg cursor-pointer transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                ログイン
              </button>
              <button
                onClick={() => {
                  console.log("新規登録ボタンがクリックされました")
                  setShowSignupModal(true)
                }}
                className="w-full h-11 xs:h-12 iphone:h-12 sm:h-14 bg-white border-2 border-gold-pink-gradient text-gold-pink-gradient hover:bg-gold-pink-gradient/10 hover:border-gold-pink-gradient hover:text-gold-pink-gradient text-sm xs:text-sm iphone:text-base sm:text-base font-semibold rounded-full transition-all duration-300 cursor-pointer transform hover:scale-[1.02] active:scale-[0.98] shadow-md"
              >
                新規登録
              </button>
            </div>
            
            {/* Terms */}
            <div className="pt-4 xs:pt-6 iphone:pt-6 sm:pt-8">
              <p className="text-gray-500 text-xs leading-relaxed text-center px-1 xs:px-2 iphone:px-2">
                本サービスは18歳以上が利用可能です。新規登録にあたって、
                <span className="underline text-gray-700 cursor-pointer hover:text-gold-pink-gradient transition-colors">利用規約</span>と
                <span className="underline text-gray-700 cursor-pointer hover:text-gold-pink-gradient transition-colors">プライバシーポリシー</span>
                に同意することとします。
              </p>
            </div>
          </div>
        </div>

        {/* Login Modal */}
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onLogin={() => setIsLoggedIn(true)}
        />
        <SignupModal
          isOpen={showSignupModal}
          onClose={() => setShowSignupModal(false)}
          onSignup={() => setIsLoggedIn(true)}
        />
      </div>
    </div>
  )
}
