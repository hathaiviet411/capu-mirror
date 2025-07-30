"use client"

import type React from "react"

import SearchModal, { type SearchFilters } from "@/components/search-modal"

import { api } from "~/utils/api"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Star, Search, Heart } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { useState, useCallback, useEffect } from "react"

import Image from "next/image"
import Footer from "@/components/shared/footer"
import MyPageScreen from "@/components/mypage-screen"
import CastDetailModal from "@/components/cast-detail-modal"
import MessageListScreen from "@/components/message-list-screen"

export default function HomeScreen() {
  const { toast } = useToast()
  const { data: session } = useSession()
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [hasMore, setHasMore] = useState({ home: true, favorites: true, footprints: true })
  const [page, setPage] = useState({ home: 0, favorites: 0, footprints: 0 })
  const [activeTab, setActiveTab] = useState("オススメ")
  const [searchText, setSearchText] = useState("検索してみる")
  const [showMyPage, setShowMyPage] = useState(false)
  const [showMessageList, setShowMessageList] = useState(false)

  const [showCastDetail, setShowCastDetail] = useState(false)
  const [selectedCast, setSelectedCast] = useState<any>(null)
  const [filterCount, setFilterCount] = useState(0)

  // API Queries - removed problematic getMyProfile call
  // Use session data instead

  // Get list of female cast users
  const {
    data: castUsersData,
    isLoading: isLoadingCastUsers,
    error: castUsersError,
  } = api.guest.getListCastUser.useQuery(
    {
      limit: 20,
      offset: 0,
    },
    {
      enabled: activeTab === "オススメ",
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    }
  )

  // Favorites - temporarily disabled
  const {
    data: favoritesData,
    isLoading: isLoadingFavorites,
    refetch: refetchFavorites,
  } = api.guest.getFavorites.useQuery(
    {
      guestId: session?.user?.id || "",
      limit: 100,
      offset: 0,
    },
    {
      enabled: !!session?.user?.id,
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    }
  )

  // Footprints - temporarily disabled
  const {
    data: footprintsData,
    isLoading: isLoadingFootprints,
    error: footprintsError,
  } = api.user.getFootprints.useQuery(
    {
      limit: 20,
      offset: 0,
    },
    {
      enabled: activeTab === "足あと",
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    }
  )

  // Mutations
  const addFavoriteMutation = api.guest.addFavorite.useMutation({
    onSuccess: () => {
      refetchFavorites()
      toast({
        title: "お気に入りに追加しました",
        duration: 2000,
      })
    },
    onError: (error) => {
      if (error.message.includes("既にお気に入りに追加されています")) {
        // すでにお気に入りの場合は何もしない
        return
      }
      toast({
        title: "エラー",
        description: error.message,
        variant: "destructive",
        duration: 3000,
      })
    },
  })

  const removeFavoriteMutation = api.guest.removeFavorite.useMutation({
    onSuccess: () => {
      refetchFavorites()
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
        duration: 3000,
      })
    },
  })

  // Create favorites set from API data
  const favoriteIds = new Set(favoritesData?.map(fav => fav.castId) || [])

  // Get current tab data
  const getCurrentTabData = () => {
    switch (activeTab) {
      case "オススメ":
        return {
          data: castUsersData || [],
          isLoading: isLoadingCastUsers,
          hasMore: false,
          fetchMore: () => {},
          isFetchingMore: false,
        }
      case "お気に入り":
        return {
          data: favoritesData || [],
          isLoading: isLoadingFavorites,
          hasMore: false,
          fetchMore: () => {},
          isFetchingMore: false,
        }
      case "足あと":
        return {
          data: footprintsData || [],
          isLoading: isLoadingFootprints,
          hasMore: false,
          fetchMore: () => {},
          isFetchingMore: false,
        }
      default:
        return {
          data: [],
          isLoading: false,
          hasMore: false,
          fetchMore: () => {},
          isFetchingMore: false,
        }
    }
  }

  const currentTabData = getCurrentTabData()

  // ブラウザ履歴を使った画面遷移管理
  useEffect(() => {
    // 初期状態をブラウザ履歴に追加
    if (typeof window !== 'undefined') {
      window.history.replaceState({ screen: 'home' }, '', window.location.href)
    }

    const handlePopState = (event: PopStateEvent) => {
      const state = event.state

      if (state) {
        switch (state.screen) {
          case 'home':
            setShowSearchModal(false)
            setShowMyPage(false)
            setShowMessageList(false)
            setShowCastDetail(false)
            setSelectedCast(null)
            break
          case 'search':
            setShowSearchModal(true)
            break
          case 'mypage':
            setShowMyPage(true)
            break
          case 'messages':
            setShowMessageList(true)
            break
          case 'cast-detail':
            setShowCastDetail(true)
            break
          default:
            // ホームから戻る場合は親のonBackを呼ぶ
            if (state.screen === 'home' || state.screen === 'mypage') {
              goBack()
            }
        }
      } else {
        // ブラウザの戻るボタンが押された場合
        goBack()
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // 画面遷移時にブラウザ履歴を追加する関数
  const pushToHistory = (screen: string, data?: any) => {
    if (typeof window !== 'undefined') {
      window.history.pushState({ screen, data }, '', window.location.href)
    }
  }

  const navigateToMyPage = () => {
    setShowMyPage(true)
    pushToHistory('mypage')
  }

  const navigateToMessages = () => {
    setShowMessageList(true)
    pushToHistory('messages')
  }

  const navigateToSearch = () => {
    setShowSearchModal(true)
    pushToHistory('search')
  }

  const navigateToCastDetail = (cast: any) => {
    setSelectedCast(cast)
    setShowCastDetail(true)
    pushToHistory('cast-detail', cast)
  }

  const goBack = () => {
    if (typeof window !== 'undefined') {
      window.history.back()
    }
  }

  const handleFilterCountChange = (count: number) => {
    setFilterCount(count)
  }

  const handleCastClick = (cast: any) => {
    navigateToCastDetail(cast)
  }

  const calculateAverageRating = (reviews: any[]) => {
    if (!reviews || reviews.length === 0) return 0
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0)
    return Math.round((sum / reviews.length) * 10) / 10
  }

  const formatPrice = (hourlyRate: number) => {
    return `${hourlyRate.toLocaleString()}P / 30分`
  }

  // Get data for current tab
  const getTabData = () => {
    switch (activeTab) {
      case "オススメ":
        return {
          data: castUsersData || [],
          isLoading: isLoadingCastUsers,
          hasMore: false,
          fetchMore: () => {},
          isFetchingMore: false,
        }
      case "お気に入り":
        return {
          data: favoritesData || [],
          isLoading: isLoadingFavorites,
          hasMore: false,
          fetchMore: () => {},
          isFetchingMore: false,
        }
      case "足あと":
        return {
          data: footprintsData || [],
          isLoading: isLoadingFootprints,
          hasMore: false,
          fetchMore: () => {},
          isFetchingMore: false,
        }
      default:
        return {
          data: [],
          isLoading: false,
          hasMore: false,
          fetchMore: () => {},
          isFetchingMore: false,
        }
    }
  }

  const tabData = getTabData()

  // Scroll handler
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget

      // Load more when user is 200px from bottom
      if (scrollHeight - scrollTop <= clientHeight + 200) {
        // For now, we don't have pagination implemented
        console.log("Load more triggered but not implemented yet")
      }
    },
    [],
  )

  // Get displayed casts based on active tab
  const displayedCasts = activeTab === "お気に入り" ? (favoritesData || []) : (castUsersData || [])

  // Handle search functionality
  const handleSearchSubmit = useCallback((searchText: string, filters: SearchFilters) => {
    setSearchText(searchText)
    // TODO: Implement actual search functionality with the filters
    // For now, we'll just update the search text display
    console.log("Search submitted:", { searchText, filters })
  }, [])

  // Handle search button click - always open search modal for filtering
  const handleSearchClick = () => {
    navigateToSearch()
  }

  // Handle footer search button click - no action needed as it's just a tab indicator
  const handleFooterSearchClick = () => {
    // フッターの「探す」ボタンは状態表示のみで、実際の検索モーダルは開かない
  }

  // Toggle favorite function
  const toggleFavorite = (castId: string) => {
    if (favoriteIds.has(castId)) {
      removeFavoriteMutation.mutate({ castId })
    } else {
      addFavoriteMutation.mutate({ castId })
    }
  }

  // Show MyPage if selected
  if (showMyPage) {
    return <MyPageScreen onBack={goBack} />
  }

  // Show MessageList if selected
  if (showMessageList) {
    return <MessageListScreen onBack={goBack} onNavigateToMyPage={navigateToMyPage} onNavigateToHome={goBack} />
  }

  return (
    <div className="h-full w-full bg-gray-100 flex flex-col relative">
      {/* Tab Navigation + Search icon */}
      <div className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 px-4">
          {/* Left spacer */}
          <div className="w-10"></div>
          
          {/* Tabs - Center */}
          <div className="flex">
            <button
              onClick={() => setActiveTab("オススメ")}
              className={`px-4 py-4 text-sm font-medium transition-colors focus:outline-none ${
                activeTab === "オススメ" ? "border-bottom-gold-pink-gradient text-gold-pink-gradient" : "border-b-2 border-transparent text-gray-600"
              }`}
            >
              オススメ
            </button>
            <button
              onClick={() => setActiveTab("お気に入り")}
              className={`px-4 py-4 text-sm font-medium transition-colors focus:outline-none ${
                activeTab === "お気に入り" ? "border-bottom-gold-pink-gradient text-gold-pink-gradient" : "border-b-2 border-transparent text-gray-600"
              }`}
            >
              お気に入り
            </button>
            <button
              onClick={() => setActiveTab("足あと")}
              className={`px-4 py-4 text-sm font-medium transition-colors focus:outline-none ${
                activeTab === "足あと" ? "border-bottom-gold-pink-gradient text-gold-pink-gradient" : "border-b-2 border-transparent text-gray-600"
              }`}
            >
              足あと
            </button>
          </div>
          
          {/* Search icon - Right */}
          <button onClick={handleSearchClick} className="p-3 relative">
            <Search className="w-6 h-6 text-gray-700" />
            {filterCount > 0 && (
              <div className="absolute top-0 -right-1 bg-gold-pink-gradient text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {filterCount > 9 ? "9+" : filterCount}
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden relative z-0 content-with-safe-footer bg-gray-100" onScroll={handleScroll}>
        {activeTab === "足あと" ? (
          /* Footprint List */
          <div>
            {/* Top Spacer */}
            <div className="h-4 bg-gray-100"></div>
            
            {/* Loading skeleton */}
            {isLoadingFootprints && tabData.data.length === 0 ? (
              <div className="bg-white">
                {[...Array(3)].map((_, index) => (
                  <div key={`skeleton-${index}`}>
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <Skeleton className="w-16 h-16 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-48 mb-2" />
                          <Skeleton className="h-4 w-32 mb-2" />
                          <Skeleton className="h-16 w-full mb-3" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                      </div>
                    </div>
                    {index < 2 && <div className="h-px bg-gray-200 mx-4"></div>}
                  </div>
                ))}
              </div>
            ) : tabData.data.length === 0 ? (
              <div className="bg-white p-8 text-center">
                <p className="text-gray-600">まだ足あとがついていません</p>
              </div>
            ) : (
              /* Footprint Items */
              <div className="bg-white">
                {tabData.data.map((footprint: any, index: number) => {
                  const viewer = footprint.viewer
                  const profile = viewer.userType === "CAST" ? viewer.castProfile : viewer.guestProfile
                  const displayName = profile?.displayName || viewer.name || "ユーザー"
                  const avatar = profile?.avatar || viewer.image
                  const timestamp = new Date(footprint.viewedAt).toLocaleString('ja-JP', {
                    month: '2-digit',
                    day: '2-digit',
                    weekday: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                  
                  return (
                    <div key={`footprint-${footprint.id}-${index}`}>
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          {/* Profile Image */}
                          <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                            <Image
                              src={avatar || "/placeholder-user.jpg"}
                              alt="Profile"
                              width={64}
                              height={64}
                              className="object-cover w-full h-full"
                            />
                          </div>

                          {/* Content */}
                          <div className="flex-1">
                            {/* Timestamp */}
                            <p className="text-xs text-gray-500 mb-2">{timestamp} • 足あとがつきました</p>

                            {/* Name and Class */}
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-sm font-medium text-gray-900">
                                  {displayName}
                                </span>
                              </div>
                              {viewer.userType === "CAST" && profile?.hourlyRate && (
                                <span className="bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded">
                                  {formatPrice(profile.hourlyRate)}
                                </span>
                              )}
                            </div>

                            {/* Message */}
                            {viewer.userType === "CAST" && profile?.bio && (
                              <p className="text-xs text-gray-700 leading-relaxed mb-3 line-clamp-3">{profile.bio}</p>
                            )}

                            {/* Message Button */}
                            <Button 
                              onClick={() => viewer.userType === "CAST" && handleCastClick(profile)}
                              className="w-full h-10 bg-gold-pink-gradient hover:bg-gold-pink-gradient-dark text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2"
                            >
                              {viewer.userType === "CAST" ? (
                                <>プロフィールを見る</>
                              ) : (
                                <>
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                    />
                                  </svg>
                                  メッセージを送る
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                      {/* Divider between items */}
                      {index < tabData.data.length - 1 && <div className="h-px bg-gray-200 mx-4"></div>}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Loading Section */}
            {tabData.isFetchingMore && (
              <>
                <div className="h-2 bg-gray-100"></div>
                <div className="bg-white p-4 flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-400"></div>
                </div>
              </>
            )}

            {/* Load More Button */}
            {tabData.hasMore && !tabData.isFetchingMore && (
              <>
                <div className="h-2 bg-gray-100"></div>
                <div className="bg-white p-4">
                  <Button
                    onClick={tabData.fetchMore}
                    className="w-full h-12 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg"
                  >
                    もっと見る
                  </Button>
                </div>
              </>
            )}

            {/* End of data Section */}
            {!tabData.hasMore && tabData.data.length > 0 && (
              <>
                <div className="h-2 bg-gray-100"></div>
                <div className="bg-white p-4 text-center">
                  <p className="text-gray-600 text-sm">これ以上の足あとはありません</p>
                </div>
              </>
            )}

            {/* Final Gray Spacer */}
            <div className="h-4 bg-gray-100"></div>
          </div>
        ) : (
          /* Cast Masonry Grid Section */
          <div>
            {/* Top Spacer */}
            <div className="h-4 bg-gray-100"></div>
            
            {/* Loading skeleton */}
            {(isLoadingCastUsers || isLoadingFavorites) && displayedCasts.length === 0 ? (
              <div className="bg-white px-2 pb-4 pt-2">
                <div className="grid grid-cols-2 gap-2">
                  {[...Array(6)].map((_, index) => (
                    <div key={`skeleton-${index}`} className="mb-2">
                      <Skeleton className="w-full h-72 rounded-lg" />
                      <div className="mt-1 px-1">
                        <Skeleton className="h-4 w-24 mb-1" />
                        <Skeleton className="h-8 w-full mb-1" />
                        <Skeleton className="h-4 w-20 ml-auto" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : displayedCasts.length === 0 ? (
              <div className="bg-white p-8 text-center">
                <p className="text-gray-600">
                  {activeTab === "お気に入り" ? "お気に入りのキャストがいません" : "キャストが見つかりません"}
                </p>
              </div>
            ) : (
              /* Cast Masonry Grid Section */
              <div className="bg-white px-2 pb-4 pt-2">
                <div className="grid grid-cols-2 gap-2">
                  {displayedCasts.map((cast: any, index: number) => {
                    // Handle different data structures for favorites vs recommended
                    let castProfile, avatar, userImage
                    
                    if (activeTab === "お気に入り") {
                      // Favorites structure: { cast: { ... }, user: { ... } }
                      castProfile = cast.cast
                      userImage = cast.cast?.user?.image
                      avatar = castProfile?.avatar || userImage || "/placeholder-user.jpg"
                    } else {
                      // Recommended structure: { castProfile: { ... }, image: ... }
                      castProfile = cast.castProfile
                      userImage = cast.image
                      avatar = castProfile?.avatar || userImage || "/placeholder-user.jpg"
                    }
                    
                    console.log("Cast data:", { cast, castProfile, activeTab, avatar })
                    const averageRating = calculateAverageRating(castProfile?.reviews || [])
                    const reviewCount = castProfile?._count?.reviews || 0
                    const favoriteCount = castProfile?._count?.favorites || 0
                    
                    return (
                      <div
                        key={`cast-${activeTab}-${castProfile?.id}-${index}`}
                        onClick={() => handleCastClick(castProfile)}
                        className="relative mb-2 cursor-pointer group"
                      >
                        {/* Cast Image */}
                        <Image
                          src={avatar}
                          alt="Cast member"
                          width={320}
                          height={600}
                          className="w-full h-72 object-cover rounded-lg bg-gray-200"
                        />

                        {/* Hover dark overlay - Desktop only */}
                        <div className="absolute inset-0 bg-black/0 md:group-hover:bg-black/40 transition-colors rounded-lg" />

                        {/* Caption & Meta */}
                        <div className="mt-1 px-1">
                          {/* Name as title */}
                          <p className="text-sm font-semibold text-gray-900 leading-tight truncate">
                            {castProfile?.displayName}
                          </p>
                          {/* Bio (limited to 2 lines) */}
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {castProfile?.bio || "プロフィールメッセージなし"}
                          </p>

                          {/* Price Row */}
                          <div className="flex items-center justify-between mt-1">
                            <div className="flex items-center gap-1">
                              {averageRating > 0 && (
                                <>
                                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                  <span className="text-xs text-gray-600">{averageRating.toFixed(1)}</span>
                                </>
                              )}
                              {reviewCount > 0 && (
                                <span className="text-xs text-gray-500">({reviewCount})</span>
                              )}
                            </div>
                            <span className="text-xs text-gray-500">{formatPrice(castProfile?.hourlyRate || 0)}</span>
                          </div>
                        </div>

                        {/* Favourite Star */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleFavorite(castProfile?.id)
                          }}
                          className="absolute top-2 right-2 md:hover:scale-110 transition-transform z-10"
                          disabled={addFavoriteMutation.isLoading || removeFavoriteMutation.isLoading}
                        >
                          <Star
                            className={`w-5 h-5 drop-shadow ${favoriteIds.has(castProfile?.id) ? "text-yellow-400 fill-yellow-400" : "text-white fill-white"}`}
                          />
                        </button>

                        {/* Verified Badge */}
                        {castProfile?.isVerified && (
                          <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                            認証済
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Loading Section */}
            {tabData.isFetchingMore && (
              <>
                <div className="h-2 bg-gray-100"></div>
                <div className="bg-white p-4 flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-400"></div>
                </div>
              </>
            )}

            {/* End of data Section */}
            {!tabData.hasMore && activeTab === "オススメ" && displayedCasts.length > 0 && (
              <>
                <div className="h-2 bg-gray-100"></div>
                <div className="bg-white p-4 text-center">
                  <p className="text-gray-600 text-sm">これ以上のキャストはいません</p>
                </div>
              </>
            )}

            {/* Final Gray Spacer */}
            <div className="h-4 bg-gray-100"></div>
          </div>
        )}
      </div>

      {/* Bottom Navigation - Fixed */}
      <Footer
        onSearchClick={handleFooterSearchClick}
        onMessageClick={navigateToMessages}
        onProfileClick={navigateToMyPage}
        messageCount={17}
        activeButton="search"
      />

      {/* Search Modal */}
      <SearchModal 
        isOpen={showSearchModal} 
        onClose={goBack} 
        onSearch={handleSearchSubmit}
        onFilterCountChange={handleFilterCountChange}
      />

      {/* Cast Detail Modal */}
      {selectedCast && (
        <CastDetailModal isOpen={showCastDetail} onClose={goBack} cast={selectedCast} />
      )}
    </div>
  )
}
