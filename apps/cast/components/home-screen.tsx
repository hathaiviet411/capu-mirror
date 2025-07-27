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
import { useSession } from "next-auth/react"

export default function HomeScreen() {
  const { data: session } = useSession()
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState({ home: true, favorites: true, footprints: true })
  const [page, setPage] = useState({ home: 1, favorites: 1, footprints: 1 })
  const [activeTab, setActiveTab] = useState("オススメ")
  const [favorites, setFavorites] = useState<Set<number>>(new Set())
  const [searchText, setSearchText] = useState("検索してみる")
  const [showMyPage, setShowMyPage] = useState(false)
  const [showMessageList, setShowMessageList] = useState(false)

  // Mock data for cast app - no TRPC needed
  const castProfileLoading = false
  const conversationsLoading = false
  const unreadCount = 0

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

  // Mock guest data - これは後でAPIに置き換える予定
  const [guestData, setGuestData] = useState([
    {
      id: 1,
      age: 28,
      name: "田中 美咲",
      job: "会社員",
      location: "東京都",
      message: "お仕事終わりにリラックスしたいです😊お話しましょう♪",
      interests: ["映画", "カフェ巡り", "読書"],
      bgColor: "bg-gray-200",
      image: "https://randomuser.me/api/portraits/women/32.jpg",
      likes: 229,
      isOnline: true,
      lastLogin: "2時間前",
    },
    {
      id: 2,
      age: 25,
      name: "佐藤 花音",
      job: "看護師",
      location: "神奈川県",
      message: "夜勤明けでちょっと疲れました💦誰かお話し相手になってください✨",
      interests: ["音楽", "お酒", "旅行"],
      bgColor: "bg-gray-200",
      image: "https://randomuser.me/api/portraits/women/45.jpg",
      likes: 26500,
      isOnline: false,
      lastLogin: "30分前",
    },
    {
      id: 3,
      age: 23,
      name: "鈴木 あやか",
      job: "学生",
      location: "東京都",
      message: "大学生です📚映画やカフェ巡りが好きです😊",
      interests: ["映画", "カフェ巡り", "アニメ"],
      bgColor: "bg-gray-200",
      image: "https://randomuser.me/api/portraits/women/22.jpg",
      likes: 1340,
      isOnline: true,
      lastLogin: "オンライン",
    },
    {
      id: 4,
      age: 26,
      name: "山田 まり",
      job: "事務員",
      location: "千葉県",
      message: "お仕事でストレスが溜まっています😅優しい人と話したいです🎵",
      interests: ["お酒", "料理", "ドラマ"],
      bgColor: "bg-gray-200",
      image: "https://randomuser.me/api/portraits/women/67.jpg",
      likes: 8420,
      isOnline: true,
      lastLogin: "オンライン",
    },
    {
      id: 5,
      age: 29,
      name: "渡辺 さくら",
      job: "販売員",
      location: "埼玉県",
      message: "接客業をしています！趣味は旅行と美容です💄",
      interests: ["旅行", "美容", "ショッピング"],
      bgColor: "bg-gray-200",
      image: "https://randomuser.me/api/portraits/women/89.jpg",
      likes: 2638,
      isOnline: false,
      lastLogin: "1時間前",
    },
    {
      id: 6,
      age: 24,
      name: "中村 ゆい",
      job: "美容師",
      location: "東京都",
      message: "美容師をしています✂️ おしゃれやファッションの話が好きです🎬",
      interests: ["ファッション", "美容", "映画"],
      bgColor: "bg-gray-200",
      image: "https://randomuser.me/api/portraits/women/15.jpg",
      likes: 999,
      isOnline: true,
      lastLogin: "オンライン",
    },
  ])

  const [footprintData, setFootprintData] = useState([
    {
      id: 1,
      name: "高橋 みなみ",
      age: 27,
      job: "会社員",
      location: "東京都",
      timestamp: "06/19(木) 19:19",
      message:
        "こんにちは💖 会社員をしています✨ お酒も好きですが、カフェでゆっくり話すのも好きです☕ 渋谷、恵比寿あたりによくいます...",
      interests: ["お酒", "カフェ巡り", "読書"],
      bgColor: "bg-gray-200",
      image: "https://randomuser.me/api/portraits/women/56.jpg",
      isOnline: true,
    },
    {
      id: 2,
      name: "松本 りな",
      age: 29,
      job: "デザイナー",
      location: "神奈川県",
      timestamp: "06/19(木) 19:13",
      message:
        "はじめまして🙋‍♀️ デザイナーをしています🎨 クリエイティブな仕事をしていますが、プライベートではのんびりしています...",
      interests: ["アート", "デザイン", "カフェ巡り"],
      bgColor: "bg-gray-200",
      image: "https://randomuser.me/api/portraits/women/78.jpg",
      isOnline: false,
    },
    {
      id: 3,
      name: "岡田 えみ",
      age: 25,
      job: "受付",
      location: "東京都",
      timestamp: "06/19(木) 19:00",
      message:
        "はじめまして💎 受付のお仕事をしています🙋‍♀️ 六本木、恵比寿、表参道あたりによくいます🍸 ヨガ、カフェ巡り、映画鑑賞が好きです🎬...",
      interests: ["ヨガ", "カフェ巡り", "映画"],
      bgColor: "bg-gray-200",
      image: "https://randomuser.me/api/portraits/women/91.jpg",
      isOnline: true,
    },
  ])

  const toggleFavorite = (guestId: number) => {
    const newFavorites = new Set(favorites)
    if (newFavorites.has(guestId)) {
      newFavorites.delete(guestId)
    } else {
      newFavorites.add(guestId)
    }
    setFavorites(newFavorites)
  }

  const handleGuestClick = (guest: any) => {
    navigateToCastDetail(guest)
  }

  // Generate more guest data
  const generateMoreGuests = useCallback((startId: number, count = 6) => {
    const names = ["小林 かな", "加藤 なお", "伊藤 みく", "吉田 あい", "斎藤 りん", "清水 まお", "森 ひな", "池田 みゆ"]
    const jobs = ["会社員", "看護師", "販売員", "美容師", "事務員", "学生", "デザイナー", "受付"]
    const locations = ["東京都", "神奈川県", "千葉県", "埼玉県", "大阪府", "愛知県"]
    const messages = [
      "お仕事終わりにお話ししませんか？😊",
      "今日は疲れました💦癒やしてください✨",
      "楽しい時間を過ごしましょう♪",
      "優しい人とお話ししたいです🌟",
      "リラックスしたい気分です😌",
      "一緒に楽しい時間を過ごしませんか？💫",
      "お疲れ様です！お話しましょう🎵",
      "素敵な出会いがあればいいなと思っています🎯",
    ]
    const interestsList = [
      ["映画", "カフェ巡り", "読書"],
      ["音楽", "お酒", "旅行"],
      ["アニメ", "ゲーム", "映画"],
      ["料理", "お酒", "ドラマ"],
      ["ファッション", "美容", "ショッピング"],
      ["ヨガ", "健康", "カフェ巡り"],
      ["アート", "デザイン", "美術館"],
      ["スポーツ", "フィットネス", "旅行"],
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
      job: jobs[index % jobs.length],
      location: locations[index % locations.length],
      message: messages[index % messages.length],
      interests: interestsList[index % interestsList.length],
      bgColor: bgColors[index % bgColors.length],
      image: `https://randomuser.me/api/portraits/women/${(startId + index) % 100}.jpg`,
      likes: 100 + (index * 137) % 30000,
      isOnline: Math.random() > 0.5,
      lastLogin: Math.random() > 0.5 ? "オンライン" : `${Math.floor(Math.random() * 12) + 1}時間前`,
    }))
  }, [])

  // Generate more footprint data
  const generateMoreFootprints = useCallback((startId: number, count = 3) => {
    const names = ["田村 あゆみ", "原 ちか", "青木 まり", "西村 ゆか", "橋本 みか", "石井 さき"]
    const jobs = ["会社員", "看護師", "販売員", "美容師", "事務員", "デザイナー"]
    const locations = ["東京都", "神奈川県", "千葉県", "埼玉県", "大阪府", "愛知県"]
    const messages = [
      "はじめまして✨ よろしくお願いします💖",
      "お仕事終わりです！お話しませんか？🎯",
      "今日は疲れました💦癒やしてください♪",
      "素敵な出会いを求めています💎",
      "一緒に楽しい時間を過ごしましょう🎵",
      "リラックスしたい気分です♪よろしく🌟",
    ]
    const interestsList = [
      ["映画", "カフェ巡り", "読書"],
      ["音楽", "お酒", "旅行"],
      ["アニメ", "ゲーム", "映画"],
      ["料理", "お酒", "ドラマ"],
      ["ファッション", "美容", "ショッピング"],
      ["ヨガ", "健康", "カフェ巡り"],
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
      job: jobs[Math.floor(Math.random() * jobs.length)],
      location: locations[Math.floor(Math.random() * locations.length)],
      timestamp: `06/19(木) ${String(now.getHours() - index - 1).padStart(2, "0")}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}`,
      message:
        messages[Math.floor(Math.random() * messages.length)] + " ".repeat(50) + "詳細なプロフィールはこちらから...",
      interests: interestsList[Math.floor(Math.random() * interestsList.length)],
      bgColor: bgColors[Math.floor(Math.random() * bgColors.length)],
      image: `https://randomuser.me/api/portraits/women/${Math.floor(Math.random() * 100)}.jpg`,
      isOnline: Math.random() > 0.5,
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
        const newGuests = generateMoreGuests(guestData.length + 1)
        // Use requestAnimationFrame to ensure smooth rendering
        requestAnimationFrame(() => {
          setGuestData((prev) => [...prev, ...newGuests])
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
    [loading, hasMore, guestData.length, footprintData.length, page, generateMoreGuests, generateMoreFootprints],
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

  const displayedGuests = activeTab === "お気に入り" ? guestData.filter((guest) => favorites.has(guest.id)) : guestData

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
              <div className="absolute top-0 -right-1 bg-accent-blue text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
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

                        {/* Name, Age, Job and Class */}
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${footprint.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                            <span className="text-sm font-medium text-gray-900">
                              {footprint.name} {footprint.age}歳
                            </span>
                            <span className="text-xs text-gray-500">
                              ({footprint.job})
                            </span>
                          </div>
                        </div>

                        {/* Location */}
                        <p className="text-xs text-gray-500 mb-2">{footprint.location}</p>

                        {/* Message */}
                        <p className="text-xs text-gray-700 leading-relaxed mb-2">{footprint.message}</p>



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
          /* Guest Masonry Grid Section */
          <div>
            {/* Top Spacer */}
            <div className="h-4 bg-gray-100"></div>
            {/* Loading state */}
            {(castProfileLoading || conversationsLoading) && (
              <div className="bg-white p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-blue mx-auto"></div>
                <p className="text-gray-600 mt-2">データを読み込み中...</p>
              </div>
            )}
            
            {displayedGuests.length === 0 && activeTab === "お気に入り" && !castProfileLoading ? (
              <div className="bg-white p-8 text-center">
                <p className="text-gray-600">お気に入りのゲストがいません</p>
              </div>
            ) : (
              /* Guest Masonry Grid Section */
              <div className="bg-white px-2 pb-4 pt-2">
                <div className="grid grid-cols-2 gap-2">
                  {displayedGuests.map((guest, index) => (
                    <div
                      key={`guest-${activeTab}-${guest.id}-${index}`}
                      onClick={() => handleGuestClick(guest)}
                      className="relative mb-2 cursor-pointer group"
                    >
                      {/* Guest Image */}
                      <Image
                        src={guest.image || "/placeholder.svg?height=600&width=320"}
                        alt="Guest member"
                        width={320}
                        height={600}
                        className={`w-full h-72 object-cover rounded-lg ${guest.bgColor}`}
                      />

                      {/* Hover dark overlay - Desktop only */}
                      <div className="absolute inset-0 bg-black/0 md:group-hover:bg-black/40 transition-colors rounded-lg" />

                      {/* Caption & Meta */}
                      <div className="mt-1 px-1">
                        {/* Name, Age and Job as title */}
                        <p className="text-sm font-semibold text-gray-900 leading-tight truncate">
                          {guest.age}歳 {guest.name}
                        </p>
                        <div className="flex items-center gap-1 mb-1">
                          <span className="text-xs text-gray-500">{guest.job}</span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">{guest.location}</span>
                        </div>
                        {/* Message (limited to 2 lines) */}
                        <p className="text-xs text-gray-600 line-clamp-2 mb-1">
                          {guest.message}
                        </p>
                      </div>

                      {/* Online Status */}
                      <div className="absolute top-2 left-2">
                        <div className={`w-3 h-3 rounded-full ${guest.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      </div>

                      {/* Favourite Star */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleFavorite(guest.id)
                        }}
                        className="absolute top-2 right-2 md:hover:scale-110 transition-transform z-10"
                      >
                        <Star
                          className={`w-5 h-5 drop-shadow ${favorites.has(guest.id) ? "text-yellow-400 fill-yellow-400" : "text-white fill-white"}`}
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
            {!hasMore.home && activeTab === "オススメ" && guestData.length > 12 && (
              <>
                <div className="h-2 bg-gray-100"></div>
                <div className="bg-white p-4 text-center">
                  <p className="text-gray-600 text-sm">これ以上のゲストはいません</p>
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
        messageCount={unreadCount}
        activeButton="search"
      />

      {/* Search Modal */}
      <SearchModal 
        isOpen={showSearchModal} 
        onClose={goBack} 
        onSearch={setSearchText} 
        onFilterCountChange={handleFilterCountChange}
      />

      {/* Guest Detail Modal */}
      {selectedCast && (
        <CastDetailModal isOpen={showCastDetail} onClose={goBack} cast={selectedCast} />
      )}
    </div>
  )
}
