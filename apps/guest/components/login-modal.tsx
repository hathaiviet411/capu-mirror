"use client"

import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { signIn } from "next-auth/react"
import { useState } from "react"

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onLogin: () => void
}

export default function LoginModal({ isOpen, onClose, onLogin }: LoginModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  
  console.log("LoginModal isOpen:", isOpen)
  if (!isOpen) return null

  // GUE-01-1: LINEログインボタンクリック処理
  const handleLineLogin = async () => {
    setIsLoading(true)
    try {
      // TODO: LINE OAuth実装時に実際のプロバイダーを使用
      // 現在は仮の実装として Discord を使用
      await signIn("discord", { callbackUrl: "/" })
      onLogin()
    } catch (error) {
      console.error("Login failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // GUE-01-2: 利用規約リンククリック処理
  const handleTermsClick = () => {
    window.open("https://capu-app.notion.site/Capu_-21b42cc81529808d8bbcfab37ec4c2ef", "_blank", "noopener,noreferrer")
  }

  // GUE-01-3: プライバシーポリシーリンククリック処理
  const handlePrivacyClick = () => {
    window.open("https://capu-app.notion.site/Capu_-21b42cc815298053b8f6e818e327c1f1", "_blank", "noopener,noreferrer")
  }

  // GUE-01-4: 閉じるボタンクリック処理
  const handleClose = () => {
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col w-full md:max-w-sm mx-auto">
      {/* Background Gradient - similar to page.tsx */}
      <div className="absolute inset-0 z-0">
        <div className="w-full h-full bg-gradient-to-br from-white via-gray-50 to-pink-50"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-transparent to-gray-100/60"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-100/40 to-pink-100/45"></div>
      </div>
      
      <div className="relative z-10 flex-1 flex items-center justify-center px-6">
        <div className="w-full px-4">
          <p className="text-gray-700 text-center mb-8 text-sm leading-relaxed">
            18歳以上なので
            <button 
              onClick={handleTermsClick}
              className="underline text-pink-600 hover:text-pink-700 mx-1"
            >
              利用規約
            </button>
            と
            <button 
              onClick={handlePrivacyClick}
              className="underline text-pink-600 hover:text-pink-700 mx-1"
            >
              プライバシーポリシー
            </button>
            に同意して、
          </p>

          {/* Login Options */}
          <div className="space-y-4">
            {/* LINE Login */}
            <Button
              onClick={handleLineLogin}
              disabled={isLoading}
              className="w-full h-14 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-base font-semibold rounded-full flex items-center justify-center gap-3 shadow-lg"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
              </svg>
              {isLoading ? "ログイン中..." : "LINEでログイン"}
            </Button>
          </div>
        </div>
      </div>

      {/* Close Button */}
      <div className="relative z-10 pb-8 flex justify-center">
        <Button
          onClick={handleClose}
          variant="ghost"
          className="text-gray-600 hover:bg-gray-100/50 flex flex-col items-center gap-1 h-auto py-3"
        >
          <X className="w-6 h-6" />
          <span className="text-xs">閉じる</span>
        </Button>
      </div>
    </div>
  )
}
