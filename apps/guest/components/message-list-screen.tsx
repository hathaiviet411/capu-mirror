"use client"

import type React from "react"

import { Search, User, MessageCircle, ArrowLeft, Loader2 } from "lucide-react"
import Image from "next/image"
import { useState, useRef, useCallback, useEffect, useMemo } from "react"
import NotificationIcon from "@/components/shared/notification-icon"
import NotificationScreen from "@/components/notification-screen"
import MessageDetailScreen from "@/components/message-detail-screen"
import Footer from "@/components/shared/footer"
import { api } from "~/utils/api"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

interface MessageListScreenProps {
  onBack: () => void
  onNavigateToMyPage: () => void
  onNavigateToHome?: () => void
}

export default function MessageListScreen({ onBack, onNavigateToMyPage, onNavigateToHome }: MessageListScreenProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("すべて")
  const [searchText, setSearchText] = useState("")
  const [showNotifications, setShowNotifications] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const touchStartY = useRef(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [showMessageDetail, setShowMessageDetail] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<any>(null)

  // API queries
  const { 
    data: conversationsData, 
    isLoading: isLoadingConversations,
    error: conversationsError,
    refetch: refetchConversations,
  } = api.message.getConversations.useQuery({
    limit: 50,
    offset: 0,
  }, {
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: 1000 * 30, // Refetch every 30 seconds for real-time feel
  })

  const { data: favoritesData } = api.guest.getFavorites.useQuery({
    guestId: "",
    limit: 100,
    offset: 0,
  }, {
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

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
      await refreshMessages()
    }
    setPullDistance(0)
  }, [pullDistance, isRefreshing])

  // Process conversations data
  const processedConversations = useMemo(() => {
    if (!conversationsData) return []

    return conversationsData.map(conversation => {
      // Find the other participant (not current user)
      const otherParticipants = conversation.participants.filter(p => p.id !== conversation.participants[0]?.id)
      const otherParticipant = otherParticipants[0]

      // Get last message
      const lastMessage = conversation.messages[0]
      
      // Format timestamp
      const formatTimestamp = (date: Date) => {
        const now = new Date()
        const messageDate = new Date(date)
        const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60)
        
        if (diffInHours < 24) {
          return messageDate.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
        } else if (diffInHours < 48) {
          return '昨日'
        } else {
          return messageDate.toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' })
        }
      }

      return {
        id: conversation.id,
        conversationId: conversation.id,
        castName: otherParticipant?.name || "Unknown",
        castAge: 25, // TODO: Get age from participant profile
        lastMessage: lastMessage?.content || "",
        timestamp: lastMessage ? formatTimestamp(lastMessage.createdAt) : "",
        unreadCount: conversation._count.messages,
        profileImage: otherParticipant?.image || "/placeholder-user.jpg",
        isOnline: false, // TODO: Add online status
        isPinned: false, // TODO: Add pinned functionality
        participant: otherParticipant,
        conversation,
      }
    })
  }, [conversationsData])

  // Filter conversations based on search and active tab
  const filteredConversations = useMemo(() => {
    let filtered = processedConversations

    // Search filter
    if (searchText.trim()) {
      filtered = filtered.filter(conv => 
        conv.castName.toLowerCase().includes(searchText.toLowerCase())
      )
    }

    // Tab filter (お気に入り)
    if (activeTab === "お気に入り") {
      const favoriteIds = new Set(favoritesData?.map(fav => fav.castId) || [])
      filtered = filtered.filter(conv => 
        conv.participant && favoriteIds.has(conv.participant.id)
      )
    }

    return filtered
  }, [processedConversations, searchText, activeTab, favoritesData])

  const refreshMessages = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await refetchConversations()
      toast({
        title: "メッセージを更新しました",
        duration: 2000,
      })
    } catch (error) {
      toast({
        title: "更新に失敗しました",
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      setIsRefreshing(false)
    }
  }, [refetchConversations, toast])

  const handleMessageClick = (conversation: any) => {
    navigateToMessageDetail(conversation)
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
      <div className="bg-gold-pink-gradient px-4 py-4 h-16 flex items-center justify-between fixed top-0 left-1/2 transform -translate-x-1/2 w-full md:max-w-sm z-10 shadow-lg">
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
              activeTab === "すべて" ? "bg-gold-pink-gradient text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            すべて
          </button>
          <button
            onClick={() => setActiveTab("お気に入り")}
            className={`px-4 py-2 rounded-full text-sm ${
              activeTab === "お気に入り" ? "bg-gold-pink-gradient text-white" : "bg-gray-100 text-gray-600"
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
          {/* Loading State */}
          {isLoadingConversations && (
            <>
              {[...Array(6)].map((_, index) => (
                <div key={`skeleton-${index}`} className="p-4 flex items-center gap-4">
                  <Skeleton className="w-16 h-16 rounded-full" />
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Error State */}
          {conversationsError && (
            <div className="p-8 text-center">
              <p className="text-red-500 mb-4">メッセージの読み込みに失敗しました</p>
              <button 
                onClick={() => refetchConversations()}
                className="text-blue-500 underline"
              >
                再試行
              </button>
            </div>
          )}

          {/* Empty State */}
          {!isLoadingConversations && !conversationsError && filteredConversations.length === 0 && (
            <div className="p-8 text-center">
              <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">
                {searchText.trim() ? "検索に一致するメッセージがありません" : "メッセージがありません"}
              </p>
              {activeTab === "お気に入り" && (
                <p className="text-sm text-gray-500">お気に入りのキャストとメッセージを開始してください</p>
              )}
            </div>
          )}

          {/* Message List */}
          {!isLoadingConversations && !conversationsError && filteredConversations.map((conversation, index) => (
            <div key={`conversation-${conversation.id}-${index}`}>
              <button
                className="w-full p-4 flex items-center gap-4 hover:bg-gray-50"
                onClick={() => handleMessageClick(conversation)}
              >
                {/* Profile Image */}
                <div className="relative flex-shrink-0">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200">
                    <Image
                      src={conversation.profileImage}
                      alt="Profile"
                      width={64}
                      height={64}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  {/* Online Status */}
                  {conversation.isOnline && (
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>

                {/* Message Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-black truncate">
                        {conversation.castName}
                      </h3>
                      {/* Pin Icon */}
                      {conversation.isPinned && (
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
                    {conversation.timestamp && (
                      <span className="text-xs text-gray-500 whitespace-nowrap ml-2">{conversation.timestamp}</span>
                    )}
                  </div>
                  <div className="flex items-end justify-between">
                    {conversation.lastMessage && (
                      <p className="text-sm text-gray-600 text-left flex-1 truncate">{conversation.lastMessage}</p>
                    )}
                    {conversation.unreadCount > 0 && (
                      <div className="w-7 h-7 bg-gold-pink-gradient rounded-full flex items-center justify-center ml-2 flex-shrink-0">
                        <span className="text-white text-sm font-bold">
                          {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
              {/* Divider */}
              {index < filteredConversations.length - 1 && <div className="h-px bg-gray-100 mx-4"></div>}
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
