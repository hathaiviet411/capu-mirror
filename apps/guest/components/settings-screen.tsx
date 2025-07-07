"use client"

import { useState } from "react"
import { ArrowLeft, ChevronRight, User, Bell } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import Image from "next/image"

interface SettingsScreenProps {
  onBack: () => void
}

export default function SettingsScreen({ onBack }: SettingsScreenProps) {
  const [showAccountSettings, setShowAccountSettings] = useState(false)
  const [showNotificationSettings, setShowNotificationSettings] = useState(false)
  const [officialNotificationEnabled, setOfficialNotificationEnabled] = useState(true)

  const settingsItems = [
    {
      icon: <User className="w-6 h-6 text-gray-600" />,
      title: "アカウント設定",
      onClick: () => setShowAccountSettings(true),
    },
    {
      icon: <Bell className="w-6 h-6 text-gray-600" />,
      title: "通知設定",
      onClick: () => setShowNotificationSettings(true),
    },
  ]

  // アカウント設定画面
  if (showAccountSettings) {
    // アカウント情報（実際のアプリでは API から取得）
    const accountInfo = {
      lineId: "@capu_user_12345",
    }

    return (
      <div className="min-h-screen w-full md:max-w-sm mx-auto bg-gray-100 flex flex-col relative">
        {/* Header */}
        <div className="bg-gold-pink-gradient px-4 py-4 h-16 flex items-center gap-3 fixed top-0 left-1/2 transform -translate-x-1/2 w-full md:max-w-sm z-10 shadow-lg">
          <button onClick={() => setShowAccountSettings(false)}>
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-base font-medium text-white">アカウント設定</h1>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto mt-[64px] bg-gray-100 pb-8">
          <div className="bg-white">
            {/* LINE ID */}
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.05-.2-.06-.05-.15-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.4-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.13-.31-1.09-.65.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-black">LINE ID</p>
                    <p className="text-xs text-gray-600">連携中のLINE ID</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-black">{accountInfo.lineId}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 通知設定画面
  if (showNotificationSettings) {
    return (
      <div className="min-h-screen w-full md:max-w-sm mx-auto bg-gray-100 flex flex-col relative">
        {/* Header */}
        <div className="bg-gold-pink-gradient px-4 py-4 h-16 flex items-center gap-3 fixed top-0 left-1/2 transform -translate-x-1/2 w-full md:max-w-sm z-10 shadow-lg">
          <button onClick={() => setShowNotificationSettings(false)}>
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-base font-medium text-white">通知設定</h1>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto mt-[64px] bg-gray-100 pb-8">
          <div className="bg-white">
            {/* 公式LINE公式アカウントへの通知設定 */}
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-200">
                    <Image
                      src="/capu-logo.svg"
                      alt="Capu Logo"
                      width={24}
                      height={24}
                      className="w-6 h-6"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-black">公式LINE公式アカウント</p>
                    <p className="text-xs text-gray-600">公式LINE公式アカウントからの通知を受け取る</p>
                  </div>
                </div>
                <Switch
                  checked={officialNotificationEnabled}
                  onCheckedChange={setOfficialNotificationEnabled}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // メイン設定画面
  return (
    <div className="min-h-screen w-full md:max-w-sm mx-auto bg-gray-100 flex flex-col relative">
      {/* Header */}
      <div className="bg-gold-pink-gradient px-4 py-4 h-16 flex items-center gap-3 fixed top-0 left-1/2 transform -translate-x-1/2 w-full md:max-w-sm z-10 shadow-lg">
        <button onClick={onBack}>
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-base font-medium text-white">設定</h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto mt-[64px] bg-gray-100 pb-8">
        <div className="bg-white">
          {settingsItems.map((item, index) => (
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
      </div>
    </div>
  )
} 