"use client"

import { ArrowLeft, ChevronRight, Heart, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useState } from "react"

interface NotificationScreenProps {
  onBack: () => void
  returnTo?: 'mypage' | 'messages' | 'home'
}

export default function NotificationScreen({ onBack, returnTo }: NotificationScreenProps) {
  const [activeTab, setActiveTab] = useState("お知らせ")

  const notifications = [
    {
      id: 1,
      timestamp: "07/01(火) 14:10",
      type: "favorite",
      title: "お気に入りキャストがつぶやきました",
      castName: "しんご⚽",
      castAge: 23,
      message:
        "はじめまして🌟 プロフィール見ていただきありがとうございます！📚パト歴3ヶ月📚趣味は料理/散歩/映画鑑賞/お酒🍷♡ 野球観戦も好きなので...",
      profileImage: "https://randomuser.me/api/portraits/men/84.jpg",
      actionType: "message",
    },
    {
      id: 2,
      timestamp: "07/01(火) 13:44",
      type: "favorite",
      title: "お気に入りキャストがつぶやきました",
      castName: "あかり",
      castAge: 20,
      message:
        "はじめまして！見てくれてありがとうございます(´∀｀)!! 都内で学生してます！通信学生なので学校がない日は仕事をしてます💪 顔は...",
      profileImage: "https://randomuser.me/api/portraits/men/78.jpg",
      actionType: "like",
    },
    {
      id: 3,
      timestamp: "06/30(月) 15:54",
      type: "footprint",
      title: "「探す」から足あとがつきました",
      castName: "みきや💪",
      castAge: 24,
      message:
        "東京住み、関西出身！常ににこにこしてます😊筋トレ、ごはん、甘いもの、小説、ドラマ、映画、アニメが好きです😍自炊、サウナ...",
      profileImage: "https://randomuser.me/api/portraits/men/61.jpg",
      actionType: "like",
    },
    {
      id: 4,
      timestamp: "06/29(日) 17:30",
      type: "footprint",
      title: "足あとがつきました",
      castName: "りゅうが🐺東京",
      castAge: 24,
      message: "",
      profileImage: "https://randomuser.me/api/portraits/men/52.jpg",
      actionType: "like",
    },
  ]

  const news = [
    {
      id: 1,
      date: "2025/7/1",
      title: "【10,000P割引】ワンモア‼クーポンが当たりました🎯",
      isNew: true,
    },
    {
      id: 2,
      date: "2025/7/1",
      title: "利用規約違反者への対処について",
      isNew: false,
    },
    {
      id: 3,
      date: "2025/6/11",
      title: "【8周年記念】8,000Pクーポンが必ずもらえるキャンペーン開催🎊",
      isNew: false,
    },
    {
      id: 4,
      date: "2025/6/2",
      title: "利用規約違反者への対処について",
      isNew: false,
    },
    {
      id: 5,
      date: "2025/5/1",
      title: "利用規約違反者への対処について",
      isNew: false,
    },
    {
      id: 6,
      date: "2025/3/31",
      title: "利用規約違反者への対処について",
      isNew: false,
    },
  ]

  return (
    <div className="h-screen w-full md:max-w-sm mx-auto bg-gray-100 flex flex-col relative">
      {/* Header */}
      <div className="bg-main-navy-gradient px-4 py-4 h-16 flex items-center gap-3 fixed top-0 left-1/2 transform -translate-x-1/2 w-full md:max-w-sm z-10 shadow-lg">
        <button onClick={onBack}>
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-base font-medium text-white">通知</h1>
      </div>

      {/* Tab Navigation - Fixed below header */}
      <div className="bg-white px-4 py-3 flex gap-4 fixed top-16 left-1/2 transform -translate-x-1/2 w-full md:max-w-sm z-9 shadow-sm">
        <button
          onClick={() => setActiveTab("お知らせ")}
          className={`px-4 py-2 rounded-full text-sm ${
            activeTab === "お知らせ" ? "bg-main-navy-gradient text-white" : "bg-gray-100 text-gray-600"
          }`}
        >
          お知らせ
        </button>
        <button
          onClick={() => setActiveTab("ニュース")}
          className={`px-4 py-2 rounded-full text-sm ${
            activeTab === "ニュース" ? "bg-main-navy-gradient text-white" : "bg-gray-100 text-gray-600"
          }`}
        >
          ニュース
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pt-[120px] bg-gray-100 pb-8">
        {activeTab === "お知らせ" ? (
          /* お知らせ Tab - キャストからの通知 */
          <div className="bg-white">
            {notifications.map((notification, index) => (
              <div key={`notification-${notification.id}-${index}`}>
                <div className="p-4">
                  {/* Timestamp and Type */}
                  <p className="text-xs text-gray-500 mb-4">
                    {notification.timestamp} • {notification.title}
                  </p>

                  <div className="flex items-start gap-4 mb-4">
                    {/* Profile Image */}
                    <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0">
                      <Image
                        src={notification.profileImage || "/placeholder.svg"}
                        alt="Cast profile"
                        width={80}
                        height={80}
                        className="object-cover w-full h-full"
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      {/* Cast Info */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-black">
                          {notification.castName} {notification.castAge}歳
                        </span>
                      </div>

                      {/* Message */}
                      {notification.message && (
                        <p className="text-sm text-gray-700 leading-relaxed">{notification.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  {notification.actionType === "message" ? (
                    <Button className="w-full h-12 bg-main-navy-gradient hover:bg-main-blue text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2">
                      <Mail className="w-4 h-4" />
                      メッセージを送る
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full h-12 border-2 border-accent-blue text-accent-blue hover:bg-main-navy-gradient hover:text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2 bg-white"
                    >
                      <Heart className="w-4 h-4" />
                      いいね
                    </Button>
                  )}
                </div>
                {/* Divider */}
                {index < notifications.length - 1 && <div className="h-px bg-gray-100 mx-4"></div>}
              </div>
            ))}
          </div>
        ) : (
          /* ニュース Tab - アプリからのお知らせ通知 */
          <div className="bg-white">
            {news.map((newsItem, index) => (
              <div key={`news-${newsItem.id}-${index}`}>
                <div className="p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-xs text-gray-500">{newsItem.date}</p>
                      {newsItem.isNew && (
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">NEW</span>
                      )}
                    </div>
                    <h3 className="text-sm font-medium text-black leading-relaxed">
                      {newsItem.title}
                    </h3>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </div>
                {/* Divider */}
                {index < news.length - 1 && <div className="h-px bg-gray-100 mx-4"></div>}
              </div>
            ))}
          </div>
        )}

        {/* Final Gray Spacer */}
        <div className="h-4 bg-gray-100"></div>
      </div>
    </div>
  )
}
