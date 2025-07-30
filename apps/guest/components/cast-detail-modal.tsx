"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Star, MessageCircle, Heart, Loader2 } from "lucide-react"
import Image from "next/image"
import { api } from "~/utils/api"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

interface CastDetailModalProps {
  isOpen: boolean
  onClose: () => void
  cast: {
    id: string
    displayName?: string
    avatar?: string
    bio?: string
    hourlyRate?: number
    tags?: { name: string }[]
    // Legacy support for old format
    name?: string
    age?: number
    message?: string
    price?: string
    image?: string
  } | null
}

export default function CastDetailModal({ isOpen, onClose, cast }: CastDetailModalProps) {
  const { toast } = useToast()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showHeader, setShowHeader] = useState(false)

  // Get cast ID
  const castId = cast?.id

  // API queries
  const { 
    data: castDetail, 
    isLoading: isLoadingDetail,
    error: detailError 
  } = api.guest.getCastDetail.useQuery(
    { castId: castId! },
    { 
      enabled: isOpen && !!castId,
      staleTime: 1000 * 60 * 5, // 5 minutes
    }
  )

  const { data: favoritesData } = api.guest.getFavorites.useQuery(
    { guestId: "", limit: 100, offset: 0 },
    { enabled: isOpen }
  )

  // Check if cast is in favorites
  const isFavorite = useMemo(() => {
    return favoritesData?.some(fav => fav.castId === castId) || false
  }, [favoritesData, castId])

  // Mutations
  const addFavoriteMutation = api.guest.addFavorite.useMutation({
    onSuccess: () => {
      toast({
        title: "お気に入りに追加しました",
        duration: 2000,
      })
    },
    onError: (error) => {
      toast({
        title: "エラー",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const removeFavoriteMutation = api.guest.removeFavorite.useMutation({
    onSuccess: () => {
      toast({
        title: "お気に入りから削除しました",
        duration: 2000,
      })
    },
    onError: (error) => {
      toast({
        title: "エラー",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const likeCastMutation = api.guest.likeCast.useMutation({
    onSuccess: (data) => {
      toast({
        title: "いいねを送信しました",
        description: data.message,
        duration: 3000,
      })
    },
    onError: (error) => {
      toast({
        title: "エラー",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  // Use detailed cast data if available, fallback to basic cast data
  const displayCast = castDetail || cast

  // Handler functions
  const handleFavoriteToggle = () => {
    if (!castId) return
    
    if (isFavorite) {
      removeFavoriteMutation.mutate({ castId })
    } else {
      addFavoriteMutation.mutate({ castId })
    }
  }

  const handleLikeCast = () => {
    if (!castId) return
    likeCastMutation.mutate({ castId })
  }

  // Scroll handler for header
  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement
      if (target.scrollTop > 300) {
        setShowHeader(true)
      } else {
        setShowHeader(false)
      }
    }

    const scrollContainer = document.getElementById("cast-detail-scroll")
    if (scrollContainer && isOpen) {
      scrollContainer.addEventListener("scroll", handleScroll)
      return () => scrollContainer.removeEventListener("scroll", handleScroll)
    }
  }, [isOpen])

  if (!isOpen || !cast) return null

  // Loading state
  if (isLoadingDetail) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-100 w-full md:max-w-sm mx-auto flex flex-col">
        <div className="p-4">
          <Skeleton className="h-96 w-full mb-4" />
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-full mb-4" />
          <div className="flex gap-2 mb-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="w-16 h-16 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (detailError) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-100 w-full md:max-w-sm mx-auto flex flex-col items-center justify-center p-4">
        <p className="text-red-500 mb-4">キャスト情報の読み込みに失敗しました</p>
        <Button onClick={onClose} variant="outline">
          閉じる
        </Button>
      </div>
    )
  }

  // Get display values
  const displayName = displayCast?.displayName || displayCast?.name || "Unknown"
  const displayAvatar = displayCast?.avatar || displayCast?.image || "/placeholder-user.jpg" 
  const displayBio = displayCast?.bio || displayCast?.message || ""
  const displayRate = displayCast?.hourlyRate ? `${displayCast.hourlyRate.toLocaleString()}P / 30分` : displayCast?.price || ""
  const displayTags = displayCast?.tags?.map(tag => tag.name) || []
  
  // Create images array (use avatar as main image for now)
  const images = [displayAvatar]
  
  // Calculate average rating
  const averageRating = displayCast?.reviews?.length > 0 
    ? displayCast.reviews.reduce((sum, review) => sum + review.rating, 0) / displayCast.reviews.length 
    : 0

  return (
    <div className="fixed inset-0 z-50 bg-gray-100 w-full md:max-w-sm mx-auto flex flex-col">
      {/* Header - appears on scroll */}
      <div
        className={`fixed top-0 left-1/2 transform -translate-x-1/2 w-full md:max-w-sm bg-gold-pink-gradient border-b shadow-lg px-4 py-4 h-16 flex items-center gap-3 transition-all duration-300 ${
          showHeader ? "z-30 translate-y-0 opacity-100" : "z-30 -translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <button onClick={onClose}>
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <span className="text-base font-medium text-white">{displayName}</span>
      </div>

      {/* Scrollable Content */}
      <div id="cast-detail-scroll" className="flex-1 overflow-y-auto pb-20 relative z-10">
        {/* Main Image */}
        <div className="relative h-96 bg-gray-200">
          <Image
            src={images[currentImageIndex] || "/placeholder-user.jpg"}
            alt="Cast profile"
            fill
            className="object-cover"
          />

          {/* Back Button */}
          <button
            onClick={onClose}
            className="absolute top-4 left-4 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center z-10"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>

          {/* Favorite Button */}
          <div className="absolute bottom-4 right-4">
            <button
              onClick={handleFavoriteToggle}
              disabled={addFavoriteMutation.isLoading || removeFavoriteMutation.isLoading}
              className="w-12 h-12 bg-white rounded-full flex flex-col items-center justify-center shadow-lg disabled:opacity-50"
            >
              {(addFavoriteMutation.isLoading || removeFavoriteMutation.isLoading) ? (
                <Loader2 className="w-7 h-7 text-gray-400 animate-spin" />
              ) : (
                <Star className={`w-7 h-7 ${isFavorite ? "text-yellow-400 fill-yellow-400" : "text-gray-400"}`} />
              )}
              <span className="text-[5px] text-gray-600 mt-0.5">お気に入り</span>
            </button>
          </div>
        </div>

        {/* Profile Info Section */}
        <div className="bg-white p-4">
          {/* Thumbnail Images */}
          <div className="flex gap-2 mb-4">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`w-16 h-16 rounded-lg overflow-hidden border-2 ${
                  currentImageIndex === index ? "border-gold-pink-gradient" : "border-gray-200"
                }`}
              >
                <Image
                  src={image || "/placeholder-user.jpg"}
                  alt={`Cast photo ${index + 1}`}
                  width={64}
                  height={64}
                  className="object-cover w-full h-full"
                />
              </button>
            ))}
          </div>

          {/* Online Status and Profile Info */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-xs text-green-600">オンライン中</span>
              {displayCast?.isVerified && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">認証済み</span>
              )}
            </div>
            <h1 className="text-base font-medium mb-1">
              {displayName}
            </h1>
            <p className="text-sm text-gray-700">
              {displayBio}
            </p>
            {averageRating > 0 && (
              <div className="flex items-center gap-1 mt-2">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-sm text-gray-600">{averageRating.toFixed(1)}</span>
                <span className="text-sm text-gray-500">({displayCast?.reviews?.length}件)</span>
              </div>
            )}
          </div>
        </div>

        {/* Gray Spacer */}
        <div className="h-2 bg-gray-100"></div>

        {/* Simple Profile Tags Section */}
        {displayTags && displayTags.length > 0 && (
          <>
            <div className="bg-white p-4">
              <h3 className="text-sm font-medium text-black mb-3">簡単プロフィール</h3>
              <div className="flex flex-wrap gap-2">
                {displayTags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-sm bg-gold-pink-gradient text-white rounded-md"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            {/* Gray Spacer */}
            <div className="h-2 bg-gray-100"></div>
          </>
        )}

        {/* Pricing Section */}
        <div className="bg-white p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">ポイント</span>
            <span className="text-xl font-bold">{displayRate}</span>
          </div>
        </div>

        {/* Gray Spacer */}
        <div className="h-2 bg-gray-100"></div>

        {/* Self Introduction Section */}
        <div className="bg-white p-4">
          <h3 className="text-sm font-medium text-black mb-3">自己紹介</h3>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
            {displayBio || `はじめまして！${displayName}です✨

普段は仕事で忙しい毎日を送っていますが、休日はスポーツをしたり、映画を見たりしてリラックスしています。

いろんな話をするのが好きで、多くの方とお会いできるのを楽しみにしています。一緒に楽しい時間を過ごしませんか？

気軽にメッセージをお送りください💪`}
          </p>
        </div>

        {/* Gray Spacer */}
        <div className="h-2 bg-gray-100"></div>

        {/* Basic Information Section */}
        <div className="bg-white p-4">
          <div className="space-y-3">
            {/* Height */}
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">身長：</span>
              <span className="text-sm font-medium">175cm</span>
            </div>

            {/* Residence */}
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">居住地：</span>
              <span className="text-sm font-medium">東京都</span>
            </div>

            {/* Education */}
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">学歴：</span>
              <span className="text-sm font-medium">大学卒</span>
            </div>

            {/* Job */}
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">お仕事：</span>
              <span className="text-sm font-medium">{displayCast?.category?.name || "会社員"}</span>
            </div>

            {/* Alcohol */}
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">お酒：</span>
              <span className="text-sm font-medium">ときどき飲む</span>
            </div>

            {/* Siblings */}
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">兄弟姉妹：</span>
              <span className="text-sm font-medium">長男</span>
            </div>
          </div>
        </div>

        {/* Final Gray Spacer */}
        <div className="h-4 bg-gray-100"></div>
      </div>

      {/* Bottom Action Buttons */}
      <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full md:max-w-sm bg-white border-t px-4 py-3 z-20">
        <Button 
          onClick={handleLikeCast}
          disabled={likeCastMutation.isLoading}
          className="w-full h-12 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2 bg-gold-pink-gradient hover:bg-accent-gold disabled:opacity-50"
        >
          {likeCastMutation.isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Heart className="w-4 h-4" />
          )}
          いいね
        </Button>
      </div>
    </div>
  )
}
