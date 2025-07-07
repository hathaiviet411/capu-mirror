"use client"

import type React from "react"

import { ArrowLeft, MoreHorizontal, Calendar, ImageIcon, Send } from "lucide-react"
import Image from "next/image"
import { useState, useRef, useEffect } from "react"
import ScheduleProposalModal from "@/components/schedule-modal"
import ChatOptionsModal from "@/components/chat-options-modal"
import CastDetailModal from "@/components/cast-detail-modal"

interface MessageDetailScreenProps {
  onBack: () => void
  messageData: {
    castName: string
    castAge: number
    profileImage: string
  }
}

export default function MessageDetailScreen({ onBack, messageData }: MessageDetailScreenProps) {
  const [messageText, setMessageText] = useState("")
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showChatOptions, setShowChatOptions] = useState(false)
  const [isPinned, setIsPinned] = useState(false)
  const [showCastDetail, setShowCastDetail] = useState(false)

  const messages = [
    {
      id: 1,
      type: "received",
      text: "はじめまして！プロフィール見ていただきありがとうございます😊",
      timestamp: "10:23",
      profileImage: messageData.profileImage,
    },
    {
      id: 2,
      type: "received",
      text: "よろしくお願いします✨",
      timestamp: "10:24",
      profileImage: messageData.profileImage,
    },
    {
      id: 3,
      type: "sent",
      text: "こちらこそよろしくお願いします！\nプロフィール拝見させていただきました💪",
      timestamp: "11:15",
      readStatus: "既読",
    },
    {
      id: 4,
      type: "received",
      text: "ありがとうございます！\nスポーツはお好きですか？",
      timestamp: "11:20",
      profileImage: messageData.profileImage,
    },
    {
      id: 5,
      type: "sent",
      text: "はい！サッカーとテニスをやってます⚽\n○○さんは何かスポーツされますか？",
      timestamp: "11:25",
      readStatus: "既読",
    },
    {
      id: 6,
      type: "received",
      text: "すごいですね！僕も最近ジムに通い始めました💪\n今度一緒にスポーツできたら楽しそうですね",
      timestamp: "11:30",
      profileImage: messageData.profileImage,
    },
    {
      id: 7,
      type: "sent",
      text: "それは素晴らしいですね！\nぜひ今度一緒にスポーツしましょう😊",
      timestamp: "18:45",
      readStatus: "既読",
      date: "06月23日(月)",
    },
    {
      id: 8,
      type: "received",
      text: "今度お時間あるときに\n一緒にお食事でもいかがですか？🍽️",
      timestamp: "18:49",
      profileImage: messageData.profileImage,
    },
    {
      id: 9,
      type: "sent",
      text: "ぜひお願いします！\n今度日程を調整させていただきますね✨",
      timestamp: "19:32",
      readStatus: "既読",
      date: "06月24日(火)",
    },
  ]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [])

  const handleSendMessage = () => {
    if (messageText.trim()) {
      // メッセージ送信処理
      console.log("メッセージ送信:", messageText)
      setMessageText("")
    }
  }

  const handleImageSelect = () => {
    fileInputRef.current?.click()
  }

  const handleScheduleSubmit = (scheduleData: any) => {
    console.log("日程提案:", scheduleData)
    // 実際のアプリでは、ここで日程提案メッセージを送信
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // 画像アップロード処理
      console.log("画像アップロード:", file.name)
    }
  }

  const handleTogglePin = (pinned: boolean) => {
    setIsPinned(pinned)
    // ここで実際のピン留め状態をサーバーに保存する処理を追加
  }

  const handleProfileClick = () => {
    setShowCastDetail(true)
  }

  // キャスト詳細用のデータを作成
  const castDetailData = {
    id: 1,
    name: messageData.castName,
    age: messageData.castAge,
    image: messageData.profileImage,
    price: "15,000P / 30分",
    message: "一緒に楽しい時間を過ごしましょう✨",
    bgColor: "bg-gray-200",
    images: [
      messageData.profileImage,
      `https://randomuser.me/api/portraits/men/${Math.floor(Math.random() * 50) + 20}.jpg`,
      `https://randomuser.me/api/portraits/men/${Math.floor(Math.random() * 50) + 50}.jpg`,
    ],
    tags: ["爽やか系", "スポーツ好き", "会話上手"],
  }

  return (
    <div className="h-screen w-full md:max-w-sm mx-auto bg-gray-100 flex flex-col relative">
      {/* Header */}
      <div className="bg-main-navy-gradient px-4 py-4 h-16 flex items-center justify-between fixed top-0 left-1/2 transform -translate-x-1/2 w-full md:max-w-sm z-10 shadow-lg">
        <div className="flex items-center gap-3">
          <button onClick={onBack}>
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <button onClick={handleProfileClick} className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/30 hover:border-white/60 transition-colors">
            <Image
              src={messageData.profileImage || "/placeholder.svg"}
              alt="Profile"
              width={40}
              height={40}
              className="object-cover w-full h-full"
            />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-base font-medium text-white">{messageData.castName}</span>
            {isPinned && (
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
        </div>
        <button onClick={() => setShowChatOptions(true)}>
          <MoreHorizontal className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Status Banner - Fixed */}
      <div className="bg-white px-4 py-3 flex items-center justify-between border-b fixed top-[64px] left-1/2 transform -translate-x-1/2 w-full md:max-w-sm z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-xs">日程未定</span>
          <span className="text-xs text-gray-700">日程調整後、合流ができます</span>
        </div>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto mt-[120px] mb-[80px]">
        <div className="p-4">
        {messages.map((message, index) => (
          <div key={`msg-detail-${message.id}-${index}`}>
            {/* Date Separator */}
            {message.date && (
              <div className="text-center my-6">
                <span className="text-xs text-gray-500">{message.date}</span>
              </div>
            )}

            {/* Message */}
            <div className={`flex mb-3 ${message.type === "sent" ? "justify-end" : "justify-start"}`}>
              {message.type === "received" && (
                <button onClick={handleProfileClick} className="w-8 h-8 rounded-full overflow-hidden mr-2 flex-shrink-0 hover:opacity-80 transition-opacity">
                  <Image
                    src={message.profileImage || "/placeholder.svg"}
                    alt="Profile"
                    width={32}
                    height={32}
                    className="object-cover w-full h-full"
                  />
                </button>
              )}

              <div className={`max-w-xs ${message.type === "sent" ? "order-1" : ""}`}>
                <div
                  className={`px-3 py-2 rounded-2xl ${
                    message.type === "sent"
                      ? "bg-main-navy-gradient text-white rounded-br-md"
                      : "bg-gray-200 text-gray-800 rounded-bl-md"
                  }`}
                >
                  <p className="text-sm whitespace-pre-line leading-relaxed">{message.text}</p>
                </div>

                <div
                  className={`flex items-center mt-1 text-xs text-gray-500 ${
                    message.type === "sent" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.type === "sent" && message.readStatus && <span className="mr-1">{message.readStatus}</span>}
                  <span>{message.timestamp}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Hidden File Input */}
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />

      {/* Schedule Proposal Modal */}
      <ScheduleProposalModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSubmit={handleScheduleSubmit}
      />

      {/* Chat Options Modal */}
      <ChatOptionsModal
        isOpen={showChatOptions}
        onClose={() => setShowChatOptions(false)}
        isPinned={isPinned}
        onTogglePin={handleTogglePin}
      />

      {/* Cast Detail Modal */}
      <CastDetailModal
        isOpen={showCastDetail}
        onClose={() => setShowCastDetail(false)}
        cast={castDetailData}
      />

      {/* Message Input */}
      <div className="bg-gray-50 border-t px-4 py-3 fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full md:max-w-sm">
        <div className="flex items-end gap-2">
          {/* Input Container */}
          <div className="flex-1 bg-white rounded-3xl border border-gray-200 shadow-sm">
            <div className="flex items-end">
              <textarea
                placeholder="メッセージ"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="flex-1 bg-transparent text-sm focus:outline-none resize-none px-4 py-3 max-h-20 min-h-[44px] leading-5"
                rows={1}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
                style={{
                  height: "auto",
                  minHeight: "44px",
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement
                  target.style.height = "auto"
                  target.style.height = Math.min(target.scrollHeight, 80) + "px"
                }}
              />

              {/* Calendar Button */}
              <button
                onClick={() => setShowScheduleModal(true)}
                className="p-2 hover:bg-gray-100 rounded-full mr-1 flex-shrink-0"
              >
                <Calendar className="w-5 h-5 text-gray-600" />
              </button>

              {/* Image Button */}
              <button onClick={handleImageSelect} className="p-2 hover:bg-gray-100 rounded-full mr-2 flex-shrink-0">
                <ImageIcon className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Send Button */}
          {messageText.trim() && (
            <button
              onClick={handleSendMessage}
              className="w-9 h-9 bg-main-navy-gradient hover:bg-main-blue rounded-full flex items-center justify-center shadow-sm flex-shrink-0 transition-colors"
            >
              <Send className="w-5 h-5 text-white" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
