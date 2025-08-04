"use client"

import { api } from "~/utils/api"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useState, useEffect, useMemo, useCallback } from "react"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Star, MessageCircle, Heart, Loader2 } from "lucide-react"
import Image from "next/image"

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
    name?: string
    age?: number
    message?: string
    price?: string
    image?: string
  } | null
}

export default function CastDetailModal({ isOpen, onClose, cast }: CastDetailModalProps) {
  const { toast } = useToast()
  const { data: session } = useSession()

  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showHeader, setShowHeader] = useState(false)

  const castId = useMemo(() => cast?.id, [cast?.id])

  const calculateAge = useCallback((birthDate: string | Date | null | undefined): number => {
    if (!birthDate) return 0
    
    const birth = new Date(birthDate)
    const today = new Date()
    
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    
    return age
  }, [])

  const { data: castDetail, isLoading: isLoadingDetail, error: detailError } = api.guest.getCastDetail.useQuery(
    { castId: castId || "" },
    { 
      enabled: isOpen && !!castId,
      staleTime: 1000 * 60 * 5,
    }
  )

  const { data: favoritesData } = api.guest.getFavorites.useQuery(
    { guestId: session?.user?.id || "", limit: 100, offset: 0 },
    { enabled: isOpen && !!session?.user?.id }
  )

  const isFavorite = useMemo(() => {
    if (!castId || !favoritesData) return false
    return favoritesData.some(fav => fav.favoriteUserId === castId)
  }, [favoritesData, castId])

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

  const handleFavoriteToggle = useCallback(() => {
    if (!castId) return
    
    if (isFavorite) {
      removeFavoriteMutation.mutate({ castId })
    } else {
      addFavoriteMutation.mutate({ castId })
    }
  }, [castId, isFavorite, removeFavoriteMutation, addFavoriteMutation])

  const handleLikeCast = useCallback(() => {
    if (!castId) return
    likeCastMutation.mutate({ castId })
  }, [castId, likeCastMutation])

  const handleCloseClick = useCallback(() => {
    onClose()
  }, [onClose])

  const handleImageClick = useCallback((index: number) => {
    setCurrentImageIndex(index)
  }, [])

  const handleReloadClick = useCallback(() => {
    window.location.reload()
  }, [])

  const handleScroll = useCallback((e: Event) => {
    const target = e.target as HTMLElement
    if (target.scrollTop > 300) {
      setShowHeader(true)
    } else {
      setShowHeader(false)
    }
  }, [])

  const castTags = useMemo(() => 
    (castDetail as any)?.userTags?.map((tag: any) => tag.name) || [],
    [castDetail]
  )

  const castInformation = useMemo(() => 
    (castDetail as any)?.user,
    [castDetail]
  )

  const castName = useMemo(() => 
    castInformation?.name || "Unknown",
    [castInformation?.name]
  )

  const castAliasName = useMemo(() => 
    castInformation?.aliasName || "",
    [castInformation?.aliasName]
  )

  const castAge = useMemo(() => 
    calculateAge(castInformation?.birthDate) || "",
    [castInformation?.birthDate]
  )

  const castQuote = useMemo(() => 
    castInformation?.quote || "",
    [castInformation?.quote]
  )

  const castAvatar = useMemo(() => 
    castInformation?.image || "/placeholder-user.jpg",
    [castInformation?.image]
  )

  const castHourlyRate = useMemo(() => 
    castInformation?.hourlyRate || "",
    [castInformation?.hourlyRate]
  )

  const castAdditionalImages = useMemo(() => 
    castInformation?.additionalImages || [],
    [castInformation?.additionalImages]
  )

  const castSelfIntro = useMemo(() => 
    castInformation?.selfIntro || "",
    [castInformation?.selfIntro]
  )

  const castImages = useMemo(() => 
    [castAvatar, ...castAdditionalImages].filter(Boolean),
    [castAvatar, castAdditionalImages]
  )

  const castHeight = useMemo(() => 
    castInformation?.height || "",
    [castInformation?.height]
  )

  const castWeight = useMemo(() => 
    castInformation?.weight || "",
    [castInformation?.weight]
  )

  const castResidence = useMemo(() => 
    castInformation?.residence || "",
    [castInformation?.residence]
  )

  const castEducation = useMemo(() => 
    castInformation?.education || "",
    [castInformation?.education]
  )

  const castOccupation = useMemo(() => 
    castInformation?.occupation || "",
    [castInformation?.occupation]
  )

  const castDrinkingLevel = useMemo(() => 
    castInformation?.drinkingLevel || "",
    [castInformation?.drinkingLevel]
  )

  const castSmokingLevel = useMemo(() => 
    castInformation?.smokingLevel || "",
    [castInformation?.smokingLevel]
  )

  const castSiblings = useMemo(() => 
    castInformation?.siblings || "",
    [castInformation?.siblings]
  )

  const averageRating = useMemo(() => {
    const reviews = (castDetail as any)?.reviews
    if (!reviews || reviews.length === 0) return 0
    return reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length
  }, [castDetail])

  const reviewCount = useMemo(() => 
    (castDetail as any)?.reviews?.length || 0,
    [castDetail]
  )

  useEffect(() => {
    const scrollContainer = document.getElementById("cast-detail-scroll")
    if (scrollContainer && isOpen) {
      scrollContainer.addEventListener("scroll", handleScroll)
      return () => scrollContainer.removeEventListener("scroll", handleScroll)
    }
  }, [isOpen, handleScroll])

  if (!isOpen || !cast) return null

  if (isLoadingDetail) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-100 w-full md:max-w-sm mx-auto flex flex-col">
        <div className="flex-1 overflow-y-auto pb-20 relative z-10">
          <div className="relative h-96 bg-gray-200">
            <Skeleton className="w-full h-full" />
            
            <div className="absolute top-4 left-4 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center">
              <Skeleton className="w-5 h-5 rounded" />
            </div>

            <div className="absolute bottom-4 right-4 w-12 h-12 bg-white rounded-full flex flex-col items-center justify-center shadow-lg">
              <Skeleton className="w-7 h-7 rounded" />
              <Skeleton className="w-8 h-1 mt-1 rounded" />
            </div>
          </div>

          <div className="bg-white p-4">
            <div className="flex gap-2 mb-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="w-16 h-16 rounded-lg" />
              ))}
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Skeleton className="w-3 h-3 rounded-full" />
                <Skeleton className="h-3 w-20 rounded" />
                <Skeleton className="h-3 w-16 rounded" />
              </div>

              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mb-2" />

              <div className="flex items-center gap-1 mt-2">
                <Skeleton className="w-4 h-4 rounded" />
                <Skeleton className="h-4 w-8 rounded" />
                <Skeleton className="h-4 w-12 rounded" />
              </div>
            </div>
          </div>

          <div className="h-2 bg-gray-100"></div>

          <div className="bg-white p-4">
            <Skeleton className="h-4 w-24 mb-3" />

            <div className="flex flex-wrap gap-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="w-16 h-8 rounded-md" />
              ))}
            </div>
          </div>

          <div className="h-2 bg-gray-100"></div>

          <div className="bg-white p-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-6 w-24" />
            </div>
          </div>

          <div className="h-2 bg-gray-100"></div>

          <div className="bg-white p-4">
            <Skeleton className="h-4 w-20 mb-3" />

            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>

          <div className="h-2 bg-gray-100"></div>

          <div className="bg-white p-4">
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </div>

          <div className="h-4 bg-gray-100"></div>
        </div>

        <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full md:max-w-sm bg-white border-t px-4 py-3 z-20">
          <Skeleton className="w-full h-12 rounded-lg" />
        </div>
      </div>
    )
  }

  if (detailError) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-100 w-full md:max-w-sm mx-auto flex flex-col">
        <div className="bg-gold-pink-gradient px-4 py-4 h-16 flex items-center gap-3">
          <button onClick={handleCloseClick}>
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <span className="text-base font-medium text-white">エラー</span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h2 className="text-lg font-semibold text-gray-900 mb-2">キャスト情報の読み込みに失敗しました</h2>
          
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            {
              detailError.message === "キャストが見つかりません"
                ? "このキャストは存在しないか、削除された可能性があります。"
                : detailError.message === "このキャストは現在利用できません"
                  ? "このキャストは現在利用できません。しばらく時間をおいてから再度お試しください。"
                  : "ネットワークエラーが発生しました。インターネット接続を確認してから再度お試しください。"
            }
          </p>
          
          <div className="flex gap-3">
            <Button onClick={handleCloseClick} variant="outline" className="flex-1" >
              <span>閉じる</span>
            </Button>
            
            <Button 
              onClick={handleReloadClick} 
              className="flex-1 bg-gold-pink-gradient hover:bg-gold-pink-gradient-dark text-white"
            >
              <span>再読み込み</span>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-100 w-full md:max-w-sm mx-auto flex flex-col">
      <div id="cast-detail-scroll" className="flex-1 overflow-y-auto pb-20 relative z-10">
        <div className="relative h-96 bg-gray-200">
          <Image
            src={castImages[currentImageIndex] || "/placeholder-user.jpg"}
            alt="Cast profile"
            fill
            className="object-cover"
          />

          <button
            onClick={handleCloseClick}
            className="absolute top-4 left-4 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center z-10"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>

          <div className="absolute bottom-4 right-4">
            <button
              onClick={handleFavoriteToggle}
              disabled={addFavoriteMutation.isLoading || removeFavoriteMutation.isLoading}
              className="w-12 h-12 bg-white rounded-full flex flex-col items-center justify-center shadow-lg disabled:opacity-50"
            >
              {
                (addFavoriteMutation.isLoading || removeFavoriteMutation.isLoading) ? (
                  <Loader2 className="w-7 h-7 text-gray-400 animate-spin" />
                ) : (
                  <Star className={`w-7 h-7 ${isFavorite ? "text-yellow-400 fill-yellow-400" : "text-gray-400"}`} />
                )
              }

              <span className="text-[5px] text-gray-600 mt-0.5">お気に入り</span>
            </button>
          </div>
        </div>

        <div className="bg-white p-4">
          <div className="flex gap-2 mb-4">
            {
              castImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => handleImageClick(index)}
                  className={`
                    w-16 h-16 rounded-lg overflow-hidden border-2 
                    ${currentImageIndex === index? "border-gold-pink-gradient": "border-gray-200"}`
                  }
                >
                  <Image
                    src={image || "/placeholder-user.jpg"}
                    alt={`Cast photo ${index + 1}`}
                    width={64}
                    height={64}
                    className="object-cover w-full h-full"
                  />
                </button>
              ))
            }
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-xs text-green-600">オンライン中</span>
            </div>

            <h1 className="text-base font-medium mb-1">
              {castAliasName} - {castAge}歳
            </h1>

            <p className="text-sm text-gray-700">
              {castQuote}
            </p>

            {
              averageRating > 0 && (
                <div className="flex items-center gap-1 mt-2">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-sm text-gray-600">{averageRating.toFixed(1)}</span>
                  <span className="text-sm text-gray-500">({reviewCount}件)</span>
                </div>
              )
            }
          </div>
        </div>

        <div className="h-2 bg-gray-100"></div>

        {
          castTags && castTags.length > 0 && (
            <>
              <div className="bg-white p-4">
                <h3 className="text-sm font-medium text-black mb-3">簡単プロフィール</h3>
                <div className="flex flex-wrap gap-2">
                  {
                    castTags.map((tag: string, index: number) => (
                      <span key={index} className="px-2 py-1 text-sm bg-gold-pink-gradient text-white rounded-md">
                        {tag}
                      </span>
                    ))
                  }
                </div>
              </div>

              <div className="h-2 bg-gray-100"></div>
            </>
          )
        }

        <div className="bg-white p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">ポイント</span>
            <span className="text-xl font-bold">{castHourlyRate}</span>
          </div>
        </div>

        <div className="h-2 bg-gray-100"></div>

        <div className="bg-white p-4">
          <h3 className="text-sm font-medium text-black mb-3">自己紹介</h3>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
            {castSelfIntro}
          </p>
        </div>

        <div className="h-2 bg-gray-100"></div>

        <div className="bg-white p-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">身長：</span>
              <span className="text-sm font-medium">{castHeight}cm</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">居住地：</span>
              <span className="text-sm font-medium">{castResidence}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">学歴：</span>
              <span className="text-sm font-medium">{castEducation}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">お仕事：</span>
              <span className="text-sm font-medium">{castOccupation}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">お酒：</span>
              <span className="text-sm font-medium">{castDrinkingLevel}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">タバコ：</span>
              <span className="text-sm font-medium">{castSmokingLevel}</span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">兄弟姉妹：</span>
              <span className="text-sm font-medium">{castSiblings}</span>
            </div>
          </div>
        </div>

        <div className="h-4 bg-gray-100"></div>
      </div>

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
