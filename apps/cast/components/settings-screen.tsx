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
      systemId: "CAPU_001234567",
    }

    return (
      <div className="min-h-screen w-full md:max-w-sm mx-auto bg-gray-100 flex flex-col relative">
        {/* Header */}
        <div className="bg-main-navy-gradient px-4 py-4 h-16 flex items-center gap-3 fixed top-0 left-1/2 transform -translate-x-1/2 w-full md:max-w-sm z-10 shadow-lg">
          <button onClick={() => setShowAccountSettings(false)}>
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-base font-medium text-white">アカウント設定</h1>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto mt-[64px] bg-gray-100 pb-8">
          <div className="bg-white">
            {/* システムID */}
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm-1-5h2v2h-2v-2zm0-8h2v6h-2V7z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-black">システムID</p>
                    <p className="text-xs text-gray-600">お客様のシステムID</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-black">{accountInfo.systemId}</p>
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
        <div className="bg-main-navy-gradient px-4 py-4 h-16 flex items-center gap-3 fixed top-0 left-1/2 transform -translate-x-1/2 w-full md:max-w-sm z-10 shadow-lg">
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
      <div className="bg-main-navy-gradient px-4 py-4 h-16 flex items-center gap-3 fixed top-0 left-1/2 transform -translate-x-1/2 w-full md:max-w-sm z-10 shadow-lg">
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