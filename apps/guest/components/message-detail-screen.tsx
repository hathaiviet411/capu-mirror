"use client"

import type React from "react"

import { ArrowLeft, MoreHorizontal, Calendar, ImageIcon, Send, Loader2 } from "lucide-react"
import Image from "next/image"
import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import ScheduleProposalModal from "@/components/schedule-modal"
import ChatOptionsModal from "@/components/chat-options-modal"
import CastDetailModal from "@/components/cast-detail-modal"
import { api } from "~/utils/api"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

interface MessageDetailScreenProps {
  onBack: () => void
  messageData: {
    id: string
    conversationId: string
    castName: string
    castAge: number
    profileImage: string
    participant?: any
    conversation?: any
  }
}

export default function MessageDetailScreen({ onBack, messageData }: MessageDetailScreenProps) {
  const { toast } = useToast()
  const [messageText, setMessageText] = useState("")
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showChatOptions, setShowChatOptions] = useState(false)
  const [isPinned, setIsPinned] = useState(false)
  const [showCastDetail, setShowCastDetail] = useState(false)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const conversationId = messageData.conversationId

  // API queries
  const {
    data: messagesData,
    isLoading: isLoadingMessages,
    error: messagesError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchMessages,
  } = api.message.getMessages.useInfiniteQuery(
    {
      conversationId,
      limit: 50,
    },
    {
      enabled: !!conversationId,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      staleTime: 1000 * 60 * 2, // 2 minutes
      refetchInterval: 1000 * 30, // Auto-refresh every 30 seconds
    }
  )

  const { data: scheduleProposals } = api.message.getScheduleProposals.useQuery(
    { conversationId },
    { enabled: !!conversationId }
  )

  const { data: pinnedThreads } = api.message.getPinnedThreads.useQuery(
    { conversationId },
    { enabled: !!conversationId }
  )

  // Mutations
  const sendMessageMutation = api.message.sendMessage.useMutation({
    onSuccess: () => {
      setMessageText("")
      refetchMessages()
      scrollToBottom()
      toast({
        title: "メッセージを送信しました",
        duration: 2000,
      })
    },
    onError: (error) => {
      toast({
        title: "送信に失敗しました",
        description: error.message,
        variant: "destructive",
        duration: 3000,
      })
    },
  })

  const markAsReadMutation = api.message.markAsRead.useMutation({
    onError: (error) => {
      console.error("Failed to mark messages as read:", error)
    },
  })

  const proposeScheduleMutation = api.message.proposeSchedule.useMutation({
    onSuccess: () => {
      toast({
        title: "日程を提案しました",
        duration: 2000,
      })
      refetchMessages()
    },
    onError: (error) => {
      toast({
        title: "日程提案に失敗しました",
        description: error.message,
        variant: "destructive",
        duration: 3000,
      })
    },
  })

  const pinThreadMutation = api.message.pinThread.useMutation({
    onSuccess: () => {
      toast({
        title: "メッセージをピン留めしました",
        duration: 2000,
      })
    },
    onError: (error) => {
      toast({
        title: "ピン留めに失敗しました",
        description: error.message,
        variant: "destructive",
        duration: 3000,
      })
    },
  })

  // Process messages from API
  const messages = useMemo(() => {
    if (!messagesData) return []
    
    const allMessages = messagesData.pages.flatMap(page => page.messages)
    
    return allMessages.map(message => {
      const isCurrentUser = message.sender.id === messageData.conversation?.participants?.find(p => p.userType === "GUEST")?.id
      
      return {
        id: message.id,
        type: isCurrentUser ? "sent" : "received",
        text: message.content,
        timestamp: new Date(message.createdAt).toLocaleTimeString('ja-JP', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        date: (() => {
          const messageDate = new Date(message.createdAt)
          const today = new Date()
          const yesterday = new Date(today)
          yesterday.setDate(yesterday.getDate() - 1)
          
          if (messageDate.toDateString() === today.toDateString()) {
            return null // Don't show date for today
          } else if (messageDate.toDateString() === yesterday.toDateString()) {
            return "昨日"
          } else {
            return messageDate.toLocaleDateString('ja-JP', {
              month: '2-digit',
              day: '2-digit',
              weekday: 'short'
            })
          }
        })(),
        profileImage: isCurrentUser ? null : message.sender.image,
        readStatus: isCurrentUser ? "既読" : null, // TODO: Implement actual read status
        messageType: message.messageType,
        sender: message.sender,
        createdAt: message.createdAt,
      }
    }).reverse() // Reverse to show oldest first
  }, [messagesData, messageData.conversation])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  // Auto-scroll to bottom when new messages arrive (only if user is already at bottom)
  useEffect(() => {
    if (isAtBottom && messages.length > 0) {
      scrollToBottom()
    }
  }, [messages.length, isAtBottom, scrollToBottom])

  // Mark messages as read when component mounts or messages change
  useEffect(() => {
    if (messages.length > 0) {
      const messageIds = messages
        .filter(msg => msg.type === "received")
        .map(msg => msg.id)
      
      if (messageIds.length > 0) {
        markAsReadMutation.mutate({ messageIds })
      }
    }
  }, [messages, markAsReadMutation])

  // Handle scroll to detect if user is at bottom
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    const isAtBottomNow = scrollHeight - scrollTop <= clientHeight + 100
    setIsAtBottom(isAtBottomNow)

    // Load more messages when scrolling to top
    if (scrollTop === 0 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const handleSendMessage = useCallback(() => {
    if (messageText.trim() && !sendMessageMutation.isLoading) {
      sendMessageMutation.mutate({
        conversationId,
        content: messageText.trim(),
        messageType: "TEXT",
      })
    }
  }, [messageText, conversationId, sendMessageMutation])

  const handleImageSelect = () => {
    fileInputRef.current?.click()
  }

  const handleScheduleSubmit = useCallback((scheduleData: any) => {
    if (!scheduleData.date || !scheduleData.time || !scheduleData.duration) {
      toast({
        title: "必須項目を入力してください",
        variant: "destructive",
        duration: 3000,
      })
      return
    }

    const proposedDateTime = new Date(`${scheduleData.date}T${scheduleData.time}`)
    const durationMinutes = parseInt(scheduleData.duration) * 60 // Convert hours to minutes

    proposeScheduleMutation.mutate({
      conversationId,
      proposedDateTime,
      durationMinutes,
      message: scheduleData.message || undefined,
    })

    setShowScheduleModal(false)
  }, [conversationId, proposeScheduleMutation, toast])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // 画像アップロード処理
      console.log("画像アップロード:", file.name)
    }
  }

  const handleTogglePin = useCallback((pinned: boolean) => {
    setIsPinned(pinned)
    // TODO: Implement message pinning - need messageId to pin specific message
    // pinThreadMutation.mutate({ conversationId, messageId })
    toast({
      title: pinned ? "ピン留めしました" : "ピン留めを解除しました",
      duration: 2000,
    })
  }, [toast])

  const handleProfileClick = () => {
    setShowCastDetail(true)
  }

  // キャスト詳細用のデータを作成
  const castDetailData = useMemo(() => {
    const participant = messageData.participant || {}
    const castProfile = participant.castProfile || {}
    
    return {
      id: participant.id || messageData.id,
      displayName: castProfile.displayName || participant.name || messageData.castName,
      avatar: castProfile.avatar || participant.image || messageData.profileImage,
      bio: castProfile.bio || "一緒に楽しい時間を過ごしましょう✨",
      hourlyRate: castProfile.hourlyRate || 15000,
      tags: castProfile.tags || [],
      isVerified: castProfile.isVerified || false,
      reviews: castProfile.reviews || [],
      _count: castProfile._count || {},
    }
  }, [messageData])

  return (
    <div className="h-screen w-full md:max-w-sm mx-auto bg-gray-100 flex flex-col relative">
      {/* Header */}
      <div className="bg-gold-pink-gradient px-4 py-4 h-16 flex items-center justify-between fixed top-0 left-1/2 transform -translate-x-1/2 w-full md:max-w-sm z-10 shadow-lg">
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
      <div className="flex-1 overflow-y-auto mt-[120px] mb-[80px]" onScroll={handleScroll}>
        <div className="p-4">
          {/* Loading more messages indicator */}
          {isFetchingNextPage && (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          )}

          {/* Loading state */}
          {isLoadingMessages && (
            <>
              {[...Array(5)].map((_, index) => (
                <div key={`skeleton-${index}`} className={`flex mb-3 ${index % 2 === 0 ? "justify-start" : "justify-end"}`}>
                  {index % 2 === 0 && <Skeleton className="w-8 h-8 rounded-full mr-2" />}
                  <div className="max-w-xs">
                    <Skeleton className="h-16 w-full rounded-2xl" />
                    <Skeleton className="h-3 w-12 mt-1" />
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Error state */}
          {messagesError && (
            <div className="text-center py-8">
              <p className="text-red-500 mb-4">メッセージの読み込みに失敗しました</p>
              <button 
                onClick={() => refetchMessages()}
                className="text-blue-500 underline"
              >
                再試行
              </button>
            </div>
          )}

          {/* Messages */}
          {!isLoadingMessages && !messagesError && messages.map((message, index) => (
            <div key={`msg-detail-${message.id}-${index}`}>
              {/* Date Separator */}
              {message.date && (
                <div className="text-center my-6">
                  <span className="text-xs text-gray-500">{message.date}</span>
                </div>
              )}

              {/* System Message for Schedule Proposals */}
              {message.messageType === "SYSTEM" && (
                <div className="text-center my-4">
                  <div className="bg-blue-50 text-blue-800 px-4 py-2 rounded-lg inline-block text-sm">
                    {message.text}
                  </div>
                </div>
              )}

              {/* Regular Message */}
              {message.messageType !== "SYSTEM" && (
                <div className={`flex mb-3 ${message.type === "sent" ? "justify-end" : "justify-start"}`}>
                  {message.type === "received" && (
                    <button onClick={handleProfileClick} className="w-8 h-8 rounded-full overflow-hidden mr-2 flex-shrink-0 hover:opacity-80 transition-opacity">
                      <Image
                        src={message.profileImage || "/placeholder-user.jpg"}
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
                          ? "bg-gold-pink-gradient text-white rounded-br-md"
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
              )}
            </div>
          ))}
          
          {/* Empty state */}
          {!isLoadingMessages && !messagesError && messages.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-600">まだメッセージがありません</p>
              <p className="text-sm text-gray-500 mt-2">最初のメッセージを送ってみましょう</p>
            </div>
          )}
          
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
              disabled={sendMessageMutation.isLoading}
              className="w-9 h-9 bg-gold-pink-gradient hover:bg-gold-pink-gradient-dark rounded-full flex items-center justify-center shadow-sm flex-shrink-0 transition-colors disabled:opacity-50"
            >
              {sendMessageMutation.isLoading ? (
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              ) : (
                <Send className="w-5 h-5 text-white" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
