"use client"

import type React from "react"

import { Search, User, MessageCircle, ArrowLeft } from "lucide-react"
import Image from "next/image"
import { useState, useRef, useCallback, useEffect } from "react"
import NotificationIcon from "@/components/shared/notification-icon"
import NotificationScreen from "@/components/notification-screen"
import MessageDetailScreen from "@/components/message-detail-screen"
import Footer from "@/components/shared/footer"

interface MessageListScreenProps {
  onBack: () => void
  onNavigateToMyPage: () => void
  onNavigateToHome?: () => void
}

export default function MessageListScreen({ onBack, onNavigateToMyPage, onNavigateToHome }: MessageListScreenProps) {
  const [activeTab, setActiveTab] = useState("すべて")
  const [searchText, setSearchText] = useState("")
  const [showNotifications, setShowNotifications] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const touchStartY = useRef(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [showMessageDetail, setShowMessageDetail] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<any>(null)

  // ブラウザ履歴を使った画面遷移管理
  useEffect(() => {
    // MessageList状態をブラウザ履歴に追加
    if (typeof window !== 'undefined') {
      window.history.pushState({ screen: 'message-list-main' }, '', window.location.href)
    }

    const handlePopState = (event: PopStateEvent) => {
      const state = event.state

      if (state) {
        switch (state.screen) {
          case 'message-list-main':
            setShowNotifications(false)
            setShowMessageDetail(false)
            setSelectedMessage(null)
            break
          case 'message-detail':
            setShowMessageDetail(true)
            break
          case 'notifications':
            setShowNotifications(true)
            break
          default:
            // メッセージリストから戻る場合は親のonBackを呼ぶ
            if (state.screen === 'home' || state.screen === 'mypage' || state.screen === 'messages') {
              onBack()
            }
            break
        }
      } else {
        // 状態がない場合は親のonBackを呼ぶ
        onBack()
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', handlePopState)
      return () => window.removeEventListener('popstate', handlePopState)
    }
  }, [onBack])

  // 画面遷移時にブラウザ履歴を追加する関数
  const pushToHistory = (screen: string, data?: any) => {
    if (typeof window !== 'undefined') {
      window.history.pushState({ screen, ...data }, '', window.location.href)
    }
  }

  // 戻る処理
  const goBack = () => {
    if (typeof window !== 'undefined') {
      window.history.back()
    }
  }

  // メッセージ詳細から戻る処理
  const backToMessageList = () => {
    setShowMessageDetail(false)
    setSelectedMessage(null)
  }

  // 各画面への遷移関数
  const navigateToNotifications = () => {
    setShowNotifications(true)
    pushToHistory('notifications')
  }

  const navigateToMessageDetail = (message: any) => {
    setSelectedMessage(message)
    setShowMessageDetail(true)
    pushToHistory('message-detail', { messageId: message.id })
  }

  const messages = [
    {
      id: 1,
      castName: "patoコンシェルジュ",
      castAge: 11,
      lastMessage: "素敵な方とお会いできることを楽しみにしています✨",
      timestamp: "2025/06/03",
      unreadCount: 3,
      profileImage: "https://randomuser.me/api/portraits/men/75.jpg",
      isOnline: false,
      isPinned: false,
    },
    {
      id: 2,
      castName: "ゆうき💪",
      castAge: 20,
      lastMessage: "お疲れさまです！体調はいかがですか？😊",
      timestamp: "昨日",
      unreadCount: 1,
      profileImage: "https://randomuser.me/api/portraits/men/32.jpg",
      isOnline: true,
      isPinned: true,
    },
    {
      id: 3,
      castName: "りくと🎯東京",
      castAge: 24,
      lastMessage: "今度一緒にお食事でもいかがですか？😊",
      timestamp: "2025/06/29",
      unreadCount: 0,
      profileImage: "https://randomuser.me/api/portraits/men/45.jpg",
      isOnline: false,
      isPinned: false,
    },
    {
      id: 4,
      castName: "まさとくん🍺",
      castAge: 27,
      lastMessage: "今度お酒を飲みながらお話しできればと思います🍻",
      timestamp: "2025/06/24",
      unreadCount: 0,
      profileImage: "https://randomuser.me/api/portraits/men/67.jpg",
      isOnline: false,
      isPinned: false,
    },
    {
      id: 5,
      castName: "たると⚽",
      castAge: 25,
      lastMessage: "サッカー観戦一緒に行きませんか？⚽",
      timestamp: "2025/06/23",
      unreadCount: 0,
      profileImage: "https://randomuser.me/api/portraits/men/43.jpg",
      isOnline: true,
      isPinned: false,
    },
    {
      id: 6,
      castName: "りょうすけ🎮",
      castAge: 23,
      lastMessage: "ゲームの話で盛り上がりましたね😄",
      timestamp: "2025/06/22",
      unreadCount: 0,
      profileImage: "https://randomuser.me/api/portraits/men/68.jpg",
      isOnline: false,
      isPinned: false,
    },
    {
      id: 7,
      castName: "しんや🎸",
      castAge: 23,
      lastMessage: "音楽の趣味が合いそうですね🎵",
      timestamp: "2025/06/21",
      unreadCount: 0,
      profileImage: "https://randomuser.me/api/portraits/men/89.jpg",
      isOnline: false,
      isPinned: false,
    },
  ]

  // Sort messages: pinned first, then by timestamp
  const sortedMessages = [...messages].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    return 0
  })

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const container = scrollContainerRef.current
    if (!container || container.scrollTop > 0) return

    const currentY = e.touches[0].clientY
    const distance = Math.max(0, currentY - touchStartY.current)

    if (distance > 0) {
      e.preventDefault()
      setPullDistance(Math.min(distance, 100))
    }
  }, [])

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance > 60 && !isRefreshing) {
      setIsRefreshing(true)
      // Simulate refresh
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setIsRefreshing(false)
    }
    setPullDistance(0)
  }, [pullDistance, isRefreshing])

  const refreshMessages = useCallback(async () => {
    // メッセージリストの更新処理
    console.log("メッセージを更新中...")
  }, [])

  const handleMessageClick = (message: any) => {
    navigateToMessageDetail(message)
  }

  if (showMessageDetail && selectedMessage) {
    return <MessageDetailScreen onBack={backToMessageList} messageData={selectedMessage} />
  }

  if (showNotifications) {
    return <NotificationScreen onBack={() => setShowNotifications(false)} returnTo="messages" />
  }

  return (
    <div className="h-full w-full bg-gray-100 flex flex-col relative">
      {/* Header */}
      <div className="bg-main-navy-gradient px-4 py-4 h-16 flex items-center justify-between fixed top-0 left-1/2 transform -translate-x-1/2 w-full md:max-w-sm z-10 shadow-lg">
        <div className="flex items-center gap-3">
          <button onClick={onBack}>
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-base font-medium text-white">メッセージ</h1>
        </div>
        <NotificationIcon onClick={navigateToNotifications} hasNotifications={true} />
      </div>

      {/* Main Content */}
      <div
        ref={scrollContainerRef}
        className="flex-1 mt-[64px] bg-gray-100 overflow-y-auto content-with-safe-footer"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ transform: `translateY(${pullDistance}px)` }}
      >
        {/* Pull to Refresh Indicator */}
        {(pullDistance > 0 || isRefreshing) && (
          <div className="flex justify-center items-center py-4 bg-white">
            <div className={`transition-transform ${isRefreshing ? "animate-spin" : ""}`}>
              <svg className="w-6 h-6 text-gold-pink-gradient" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>
            <span className="ml-2 text-sm text-gray-600">
              {isRefreshing ? "更新中..." : pullDistance > 60 ? "離して更新" : "引っ張って更新"}
            </span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white px-4 py-3 flex gap-4 mb-2">
          <button
            onClick={() => setActiveTab("すべて")}
            className={`px-4 py-2 rounded-full text-sm ${
              activeTab === "すべて" ? "bg-accent-blue text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            すべて
          </button>
          <button
            onClick={() => setActiveTab("お気に入り")}
            className={`px-4 py-2 rounded-full text-sm ${
              activeTab === "お気に入り" ? "bg-accent-blue text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            お気に入り
          </button>
        </div>

        {/* Search Bar */}
        <div className="bg-white px-4 py-3 mb-2">
          <div className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-2">
            <Search className="w-5 h-5 text-gray-600" />
            <input
              type="text"
              placeholder="ニックネームで検索"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Message List */}
        <div className="bg-white">
          {sortedMessages.map((message, index) => (
            <div key={`message-${message.id}-${index}`}>
              <button
                className="w-full p-4 flex items-center gap-4 hover:bg-gray-50"
                onClick={() => handleMessageClick(message)}
              >
                {/* Profile Image */}
                <div className="relative flex-shrink-0">
                  <div className="w-16 h-16 rounded-full overflow-hidden">
                    <Image
                      src={message.profileImage || "/placeholder.svg"}
                      alt="Profile"
                      width={64}
                      height={64}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  {/* Online Status */}
                  {message.isOnline && (
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>

                {/* Message Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-black truncate">
                        {message.castName} {message.castAge}歳
                      </h3>
                      {/* Pin Icon */}
                      {message.isPinned && (
                        <svg className="w-4 h-4 text-gold-pink-gradient flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
                          <path
                            fillRule="evenodd"
                            d="M3 8a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    {message.timestamp && (
                      <span className="text-xs text-gray-500 whitespace-nowrap ml-2">{message.timestamp}</span>
                    )}
                  </div>
                  <div className="flex items-end justify-between">
                    {message.lastMessage && (
                      <p className="text-sm text-gray-600 text-left flex-1">{message.lastMessage}</p>
                    )}
                    {message.unreadCount > 0 && (
                      <div className="w-7 h-7 bg-main-navy-gradient rounded-full flex items-center justify-center ml-2 flex-shrink-0">
                        <span className="text-white text-sm font-bold">{message.unreadCount}</span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
              {/* Divider */}
              {index < sortedMessages.length - 1 && <div className="h-px bg-gray-100 mx-4"></div>}
            </div>
          ))}
        </div>
      </div>
      {/* Bottom Navigation - Fixed */}
      <Footer
        onSearchClick={onNavigateToHome || onBack}
        onMessageClick={() => {}}
        onProfileClick={onNavigateToMyPage}
        messageCount={17}
        activeButton="message"
      />
    </div>
  )
}
