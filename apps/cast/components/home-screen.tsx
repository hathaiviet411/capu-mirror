"use client"

import type React from "react"

import { useState, useCallback, useEffect } from "react"
import { Star, Search, Heart } from "lucide-react"
import Image from "next/image"
import SearchModal from "@/components/search-modal"
import CastDetailModal from "@/components/cast-detail-modal"
import MyPageScreen from "@/components/mypage-screen"
import { Button } from "@/components/ui/button"
import MessageListScreen from "@/components/message-list-screen"
import Footer from "@/components/shared/footer"

export default function HomeScreen() {
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState({ home: true, favorites: true, footprints: true })
  const [page, setPage] = useState({ home: 1, favorites: 1, footprints: 1 })
  const [activeTab, setActiveTab] = useState("オススメ")
  const [favorites, setFavorites] = useState<Set<number>>(new Set())
  const [searchText, setSearchText] = useState("検索してみる")
  const [showMyPage, setShowMyPage] = useState(false)
  const [showMessageList, setShowMessageList] = useState(false)

  const [showCastDetail, setShowCastDetail] = useState(false)
  const [selectedCast, setSelectedCast] = useState<any>(null)
  const [filterCount, setFilterCount] = useState(0)

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
            setShowMyPage(false)
            setShowMessageList(false)
            setShowCastDetail(false)
            setShowSearchModal(false)
            break
          case 'mypage':
            setShowMyPage(true)
            setShowMessageList(false)
            setShowCastDetail(false)
            setShowSearchModal(false)
            break
          case 'messages':
            setShowMessageList(true)
            setShowMyPage(false)
            setShowCastDetail(false)
            setShowSearchModal(false)
            break
          case 'cast-detail':
            setShowCastDetail(true)
            setShowMyPage(false)
            setShowMessageList(false)
            setShowSearchModal(false)
            break
          case 'search':
            setShowSearchModal(true)
            break
          default:
            // デフォルトはホーム画面
            setShowMyPage(false)
            setShowMessageList(false)
            setShowCastDetail(false)
            setShowSearchModal(false)
            break
        }
      } else {
        // 状態がない場合はホーム画面に戻す
        setShowMyPage(false)
        setShowMessageList(false)
        setShowCastDetail(false)
        setShowSearchModal(false)
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', handlePopState)
      return () => window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  // 画面遷移時にブラウザ履歴を追加する関数
  const pushToHistory = (screen: string, data?: any) => {
    if (typeof window !== 'undefined') {
      window.history.pushState({ screen, ...data }, '', window.location.href)
    }
  }

  // 各画面への遷移関数を更新
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
    pushToHistory('cast-detail', { castId: cast.id })
  }

  // 戻る処理
  const goBack = () => {
    if (typeof window !== 'undefined') {
      window.history.back()
    }
  }

  // フィルター条件数の変更をハンドルする関数
  const handleFilterCountChange = (count: number) => {
    setFilterCount(count)
  }

  const [castData, setCastData] = useState([
    {
      id: 1,
      age: 28,
      name: "だいき😊",
      message: "楽しくお話ししましょう🌟よろしくお願いします！",
      price: "10,000P / 30分",
      bgColor: "bg-gray-200",
      image: "https://randomuser.me/api/portraits/men/32.jpg",
      likes: 229,
    },
    {
      id: 2,
      age: 25,
      name: "けんじ💫",
      message: "一緒に素敵な時間を過ごしましょう✨",
      price: "15,000P / 30分",
      bgColor: "bg-gray-200",
      image: "https://randomuser.me/api/portraits/men/45.jpg",
      likes: 26500,
    },
    {
      id: 3,
      age: 23,
      name: "ひろき🎯",
      message: "映画や音楽の話が好きです😊",
      price: "20,000P / 30分",
      bgColor: "bg-gray-200",
      image: "https://randomuser.me/api/portraits/men/22.jpg",
      likes: 1340,
    },
    {
      id: 4,
      age: 26,
      name: "たくや🎸",
      message: "爽やか系です♪よろしくお願いします🎵",
      price: "12,000P / 30分",
      bgColor: "bg-gray-200",
      image: "https://randomuser.me/api/portraits/men/67.jpg",
      likes: 8420,
    },
    {
      id: 5,
      age: 29,
      name: "しんいち⚽",
      message: "スポーツと旅行が趣味です！",
      price: "18,000P / 30分",
      bgColor: "bg-gray-200",
      image: "https://randomuser.me/api/portraits/men/89.jpg",
      likes: 2638,
    },
    {
      id: 6,
      age: 24,
      name: "ゆうた🎮",
      message: "ゲームとアニメが大好きです🎬",
      price: "22,000P / 30分",
      bgColor: "bg-gray-200",
      image: "https://randomuser.me/api/portraits/men/15.jpg",
      likes: 999,
    },
  ])

  const [footprintData, setFootprintData] = useState([
    {
      id: 1,
      name: "りょうた🦁",
      age: 27,
      class: "VIP",
      timestamp: "06/19(木) 19:19",
      message:
        "こんにちは🦁 社交的でアクティブです✨ お酒も音楽も大好きです🍻 渋谷、恵比寿、六本木あたりによくいます...",
      bgColor: "bg-gray-200",
      image: "https://randomuser.me/api/portraits/men/56.jpg",
    },
    {
      id: 2,
      name: "海外帰りのけんと",
      age: 29,
      class: "",
      timestamp: "06/19(木) 19:13",
      message:
        "はじめまして🙋‍♂️ 海外から帰ってきました✈️🌺 普段は仕事でしっかりモードですが、プライベートではリラックスしています...",
      bgColor: "bg-gray-200",
      image: "https://randomuser.me/api/portraits/men/78.jpg",
    },
    {
      id: 3,
      name: "YUKI🤍",
      age: 25,
      class: "",
      timestamp: "06/19(木) 19:00",
      message:
        "はじめまして💎 最近また始めました🙋‍♂️ 六本木、恵比寿、西麻布あたりにいることが多いです🍸 昼間も仕事してます🏢 ゴルフ、ポーカー、サウナ...",
      bgColor: "bg-gray-200",
      image: "https://randomuser.me/api/portraits/men/91.jpg",
    },
  ])

  const toggleFavorite = (castId: number) => {
    const newFavorites = new Set(favorites)
    if (newFavorites.has(castId)) {
      newFavorites.delete(castId)
    } else {
      newFavorites.add(castId)
    }
    setFavorites(newFavorites)
  }

  const handleCastClick = (cast: any) => {
    navigateToCastDetail(cast)
  }

  // Generate more cast data
  const generateMoreCasts = useCallback((startId: number, count = 6) => {
    const names = ["まさき❄️", "しょう💪", "かずき🌟", "やまと✨", "かいと🎯", "りく💫", "そうた🎮", "はやと🍀"]
    const messages = [
      "楽しい時間を一緒に過ごしましょう💪",
      "スポーツやゲームの話が好きです✨",
      "爽やか系です♪よろしくお願いします🌟",
      "一緒に素敵な時間を過ごしませんか😊",
      "よろしくお願いします！",
      "楽しくお話ししましょう🎵",
      "いい出会いになればと思います💫",
      "一緒に楽しみましょう🎯",
    ]
    const prices = [
      "10,000P / 30分",
      "12,000P / 30分",
      "15,000P / 30分",
      "18,000P / 30分",
      "20,000P / 30分",
      "22,000P / 30分",
      "25,000P / 30分",
      "28,000P / 30分",
    ]
    const bgColors = [
      "bg-gray-200",
      "bg-gray-200",
      "bg-gray-200",
      "bg-gray-200",
      "bg-gray-200",
      "bg-gray-200",
      "bg-gray-200",
      "bg-gray-200",
    ]

    return Array.from({ length: count }, (_, index) => ({
      id: startId + index,
      age: 20 + (index % 10),
      name: names[index % names.length],
      message: messages[index % messages.length],
      price: prices[index % prices.length],
      bgColor: bgColors[index % bgColors.length],
      image: `https://randomuser.me/api/portraits/men/${(startId + index) % 100}.jpg`,
      likes: 100 + (index * 137) % 30000,
    }))
  }, [])

  // Generate more footprint data
  const generateMoreFootprints = useCallback((startId: number, count = 3) => {
    const names = ["たかし💎", "こうじ🎯", "あきら✨", "じろう🎸", "さとし💪", "のぼる🌟"]
    const classes = ["", "VIP", "プレミアム", ""]
    const messages = [
      "はじめまして✨ よろしくお願いします💪",
      "楽しい時間を一緒に過ごしませんか？🎯",
      "話すのが大好きです♪",
      "いい出会いを求めています💎",
      "一緒に楽しみましょう🎵",
      "爽やか系です♪よろしく🌟",
    ]
    const bgColors = [
      "bg-gray-200",
      "bg-gray-200",
      "bg-gray-200",
      "bg-gray-200",
      "bg-gray-200",
      "bg-gray-200",
    ]

    const now = new Date()
    return Array.from({ length: count }, (_, index) => ({
      id: startId + index,
      name: names[Math.floor(Math.random() * names.length)],
      age: Math.floor(Math.random() * 10) + 20,
      class: classes[Math.floor(Math.random() * classes.length)],
      timestamp: `06/19(木) ${String(now.getHours() - index - 1).padStart(2, "0")}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}`,
      message:
        messages[Math.floor(Math.random() * messages.length)] + " ".repeat(50) + "詳細なプロフィールはこちらから...",
      bgColor: bgColors[Math.floor(Math.random() * bgColors.length)],
      image: `https://randomuser.me/api/portraits/men/${Math.floor(Math.random() * 100)}.jpg`,
    }))
  }, [])

  // Load more data function
  const loadMoreData = useCallback(
    async (tabType: "home" | "favorites" | "footprints") => {
      if (loading || !hasMore[tabType]) return

      setLoading(true)

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      if (tabType === "home") {
        const newCasts = generateMoreCasts(castData.length + 1)
        // Use requestAnimationFrame to ensure smooth rendering
        requestAnimationFrame(() => {
          setCastData((prev) => [...prev, ...newCasts])
        })
        setPage((prev) => ({ ...prev, home: prev.home + 1 }))

        // Simulate end of data after 5 pages
        if (page.home >= 4) {
          setHasMore((prev) => ({ ...prev, home: false }))
        }
      } else if (tabType === "footprints") {
        const newFootprints = generateMoreFootprints(footprintData.length + 1)
        requestAnimationFrame(() => {
          setFootprintData((prev) => [...prev, ...newFootprints])
        })
        setPage((prev) => ({ ...prev, footprints: prev.footprints + 1 }))

        // Simulate end of data after 5 pages
        if (page.footprints >= 4) {
          setHasMore((prev) => ({ ...prev, footprints: false }))
        }
      }

      setLoading(false)
    },
    [loading, hasMore, castData.length, footprintData.length, page, generateMoreCasts, generateMoreFootprints],
  )

  // Scroll handler
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget

      // Load more when user is 200px from bottom
      if (scrollHeight - scrollTop <= clientHeight + 200) {
        if (activeTab === "オススメ") {
          loadMoreData("home")
        } else if (activeTab === "足あと") {
          loadMoreData("footprints")
        } else if (activeTab === "お気に入り") {
          loadMoreData("favorites")
        }
      }
    },
    [activeTab, loadMoreData],
  )

  const displayedCasts = activeTab === "お気に入り" ? castData.filter((cast) => favorites.has(cast.id)) : castData

  // Handle search button click - always open search modal for filtering
  const handleSearchClick = () => {
    navigateToSearch()
  }

  // Handle footer search button click - no action needed as it's just a tab indicator
  const handleFooterSearchClick = () => {
    // フッターの「探す」ボタンは状態表示のみで、実際の検索モーダルは開かない
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
      <div className="bg-main-navy-gradient sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 px-4">
          {/* Left spacer */}
          <div className="w-10"></div>
          
          {/* Tabs - Center */}
          <div className="flex">
            <button
              onClick={() => setActiveTab("オススメ")}
              className={`px-4 py-4 text-sm font-medium transition-colors focus:outline-none ${
                activeTab === "オススメ" ? "border-b-2 border-accent-blue text-accent-blue" : "border-b-2 border-transparent text-white"
              }`}
            >
              オススメ
            </button>
            <button
              onClick={() => setActiveTab("お気に入り")}
              className={`px-4 py-4 text-sm font-medium transition-colors focus:outline-none ${
                activeTab === "お気に入り" ? "border-b-2 border-accent-blue text-accent-blue" : "border-b-2 border-transparent text-white"
              }`}
            >
              お気に入り
            </button>
            <button
              onClick={() => setActiveTab("足あと")}
              className={`px-4 py-4 text-sm font-medium transition-colors focus:outline-none ${
                activeTab === "足あと" ? "border-b-2 border-accent-blue text-accent-blue" : "border-b-2 border-transparent text-white"
              }`}
            >
              足あと
            </button>
          </div>
          
          {/* Search icon - Right */}
          <button onClick={handleSearchClick} className="p-3 relative">
            <Search className="w-6 h-6 text-white" />
            {filterCount > 0 && (
              <div className="absolute top-0 -right-1 bg-main-navy-gradient text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
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
            {/* Footprint Items */}
            <div className="bg-white">
              {footprintData.map((footprint, index) => (
                <div key={`footprint-${footprint.id}-${index}`}>
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Profile Image */}
                      <div
                        className={`w-16 h-16 rounded-full ${footprint.bgColor} overflow-hidden flex-shrink-0`}
                      >
                        <Image
                          src={footprint.image || "/placeholder.svg?height=64&width=64"}
                          alt="Profile"
                          width={64}
                          height={64}
                          className="object-cover w-full h-full"
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        {/* Timestamp */}
                        <p className="text-xs text-gray-500 mb-2">{footprint.timestamp} • 足あとがつきました</p>

                        {/* Name and Class */}
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm font-medium text-gray-900">
                              {footprint.name} {footprint.age}歳
                            </span>
                          </div>
                          {footprint.class && (
                            <span className="bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded">
                              {footprint.class}
                            </span>
                          )}
                        </div>

                        {/* Message */}
                        <p className="text-xs text-gray-700 leading-relaxed mb-3">{footprint.message}</p>

                        {/* Message Button */}
                        <Button className="w-full h-10 bg-main-navy-gradient hover:bg-main-blue text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                          メッセージを送る
                        </Button>
                      </div>
                    </div>
                  </div>
                  {/* Divider between items */}
                  {index < footprintData.length - 1 && <div className="h-px bg-gray-200 mx-4"></div>}
                </div>
              ))}
            </div>

            {/* Loading Section */}
            {loading && activeTab === "足あと" && (
              <>
                <div className="h-2 bg-gray-100"></div>
                <div className="bg-white p-4 flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-400"></div>
                </div>
              </>
            )}

            {/* End of data Section */}
            {!hasMore.footprints && activeTab === "足あと" && footprintData.length > 6 && (
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
            {displayedCasts.length === 0 && activeTab === "お気に入り" ? (
              <div className="bg-white p-8 text-center">
                <p className="text-gray-600">お気に入りのキャストがいません</p>
              </div>
            ) : (
              /* Cast Masonry Grid Section */
              <div className="bg-white px-2 pb-4 pt-2">
                <div className="grid grid-cols-2 gap-2">
                  {displayedCasts.map((cast, index) => (
                    <div
                      key={`cast-${activeTab}-${cast.id}-${index}`}
                      onClick={() => handleCastClick(cast)}
                      className="relative mb-2 cursor-pointer group"
                    >
                      {/* Cast Image */}
                      <Image
                        src={cast.image || "/placeholder.svg?height=600&width=320"}
                        alt="Cast member"
                        width={320}
                        height={600}
                        className={`w-full h-72 object-cover rounded-lg ${cast.bgColor}`}
                      />

                      {/* Hover dark overlay - Desktop only */}
                      <div className="absolute inset-0 bg-black/0 md:group-hover:bg-black/40 transition-colors rounded-lg" />

                      {/* Caption & Meta */}
                      <div className="mt-1 px-1">
                        {/* Name and Age as title */}
                        <p className="text-sm font-semibold text-gray-900 leading-tight truncate">
                          {cast.age}歳 {cast.name}
                        </p>
                        {/* Message (limited to 2 lines) */}
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {cast.message}
                        </p>

                        {/* Price Row */}
                        <div className="flex items-center justify-end mt-1">
                          <span className="text-xs text-gray-500">{cast.price}</span>
                        </div>
                      </div>

                      {/* Favourite Star */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleFavorite(cast.id)
                        }}
                        className="absolute top-2 right-2 md:hover:scale-110 transition-transform z-10"
                      >
                        <Star
                          className={`w-5 h-5 drop-shadow ${favorites.has(cast.id) ? "text-yellow-400 fill-yellow-400" : "text-white fill-white"}`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Loading Section */}
            {loading && (activeTab === "オススメ" || activeTab === "お気に入り") && (
              <>
                <div className="h-2 bg-gray-100"></div>
                <div className="bg-white p-4 flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-400"></div>
                </div>
              </>
            )}

            {/* End of data Section */}
            {!hasMore.home && activeTab === "オススメ" && castData.length > 12 && (
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
        onSearch={setSearchText} 
        onFilterCountChange={handleFilterCountChange}
      />

      {/* Cast Detail Modal */}
      {selectedCast && (
        <CastDetailModal isOpen={showCastDetail} onClose={goBack} cast={selectedCast} />
      )}
    </div>
  )
}
