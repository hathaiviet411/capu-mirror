"use client"

import { useState } from "react"
import { ArrowLeft, ChevronRight, HelpCircle, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLogout } from "@/src/hooks/useLogout"

interface HelpScreenProps {
  onBack: () => void
}

export default function HelpScreen({ onBack }: HelpScreenProps) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const { logout, isLoading } = useLogout()

  const helpItems = [
    {
      icon: <HelpCircle className="w-6 h-6 text-gray-600" />,
      title: "よくあるご質問",
      onClick: () => window.open("https://capu-app.notion.site/22942cc8152980218b39f22bf5ff5312", "_blank", "noopener,noreferrer"),
    },
    {
      icon: <Shield className="w-6 h-6 text-gray-600" />,
      title: "安心・安全の取組み",
      onClick: () => window.open("https://capu-app.notion.site/22942cc815298023bd1af317ec0b1ca2", "_blank", "noopener,noreferrer"),
    },
  ]

  const legalItems = [
    {
      icon: (
        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
      title: "利用規約",
      onClick: () => window.open("https://capu-app.notion.site/Capu_-21b42cc81529808d8bbcfab37ec4c2ef", "_blank", "noopener,noreferrer"),
    },
    {
      icon: (
        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      ),
      title: "プライバシーポリシー",
      onClick: () => window.open("https://capu-app.notion.site/Capu_-21b42cc815298053b8f6e818e327c1f1", "_blank", "noopener,noreferrer"),
    },
    {
      icon: (
        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
          />
        </svg>
      ),
      title: "特定商取引法に基づく表記",
      onClick: () => window.open("https://capu-app.notion.site/20d42cc81529801fa98feada59226c01?pvs=74", "_blank", "noopener,noreferrer"),
    },
  ]

  const handleLogout = async () => {
    try {
      await logout()
      setShowLogoutConfirm(false)
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <div className="min-h-screen w-full md:max-w-sm mx-auto bg-gray-100 flex flex-col relative">
      {/* Header */}
      <div className="bg-gold-pink-gradient px-4 py-4 h-16 flex items-center gap-3 fixed top-0 left-1/2 transform -translate-x-1/2 w-full md:max-w-sm z-10 shadow-lg">
        <button onClick={onBack}>
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-base font-medium text-white">ヘルプ</h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto mt-[64px] bg-gray-100 pb-8">
        <div className="bg-white">
          {helpItems.map((item, index) => (
            <button
              key={index}
              onClick={item.onClick}
              className="w-full flex items-center justify-between p-4 border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span className="text-sm text-black">{item.title}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          ))}
        </div>

        {/* Gray Spacer */}
        <div className="h-4 bg-gray-100"></div>

        {/* Legal Items */}
        <div className="bg-white">
          {legalItems.map((item, index) => (
            <button
              key={index}
              onClick={item.onClick}
              className="w-full flex items-center justify-between p-4 border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span className="text-sm text-black">{item.title}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          ))}
        </div>

        {/* Gray Spacer */}
        <div className="h-4 bg-gray-100"></div>

        {/* Logout */}
        <div className="bg-white">
          <button onClick={() => setShowLogoutConfirm(true)} className="w-full flex items-center gap-3 p-4">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span className="text-sm text-black">ログアウト</span>
          </button>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full md:max-w-sm p-6">
            <h3 className="text-lg font-medium text-black text-center mb-4">ログアウトしますか？</h3>
            <p className="text-sm text-gray-600 text-center mb-6">ログアウトすると、再度ログインが必要になります。</p>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowLogoutConfirm(false)}
                variant="outline"
                className="flex-1 h-12 border-gray-300 text-gray-700 hover:bg-gray-50"
                disabled={isLoading}
              >
                キャンセル
              </Button>
              <Button
                onClick={handleLogout}
                className="flex-1 h-12 bg-red-500 hover:bg-red-600 text-white"
                disabled={isLoading}
              >
                {isLoading ? "ログアウト中..." : "ログアウト"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
