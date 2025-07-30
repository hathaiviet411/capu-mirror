"use client"

import Image from "next/image"
import Footer from "@/components/shared/footer"
import HelpScreen from "@/components/help-screen"
import SettingsScreen from "@/components/settings-screen"
import ProfileEditScreen from "@/components/profile-edit-screen"
import JoinedCastsScreen from "@/components/joined-casts-screen"
import PaymentInfoScreen from "@/components/payment-info-screen"
import MessageListScreen from "@/components/message-list-screen"
import NotificationScreen from "@/components/notification-screen"
import PointHistoryScreen from "@/components/point-history-screen"
import NotificationIcon from "@/components/shared/notification-icon"
import IdentityVerificationScreen from "@/components/id-verification"
import IdentityVerificationCompleteScreen from "@/components/id-verify-complete"

import { api } from "~/utils/api"
import { useSession } from "next-auth/react"
import { Skeleton } from "@/components/ui/skeleton"
import { useState, useEffect, useMemo } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Settings, ChevronRight, Loader2 } from "lucide-react"

interface MyPageScreenProps {
  onBack: () => void
}

export default function MyPageScreen({ onBack }: MyPageScreenProps) {
  const { data: session, status } = useSession()
  const { toast } = useToast()

  const [showHelp, setShowHelp] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showProfileEdit, setShowProfileEdit] = useState(false)
  const [showJoinedCasts, setShowJoinedCasts] = useState(false)
  const [showPaymentInfo, setShowPaymentInfo] = useState(false)
  const [showMessageList, setShowMessageList] = useState(false)
  const [showPointHistory, setShowPointHistory] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showIdentityComplete, setShowIdentityComplete] = useState(false)
  const [showIdentityVerification, setShowIdentityVerification] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.history.pushState({ screen: 'mypage-main' }, '', window.location.href)
    }

    const handlePopState = (event: PopStateEvent) => {
      const state = event.state

      if (state) {
        switch (state.screen) {
          case 'mypage-main':
            setShowProfileEdit(false)
            setShowJoinedCasts(false)
            setShowPointHistory(false)
            setShowPaymentInfo(false)
            setShowHelp(false)
            setShowIdentityVerification(false)
            setShowIdentityComplete(false)
            setShowNotifications(false)
            setShowMessageList(false)
            setShowSettings(false)
            break
          case 'mypage-profile-edit':
            setShowProfileEdit(true)
            break
          case 'mypage-joined-casts':
            setShowJoinedCasts(true)
            break
          case 'mypage-point-history':
            setShowPointHistory(true)
            break
          case 'mypage-payment-info':
            setShowPaymentInfo(true)
            break
          case 'mypage-help':
            setShowHelp(true)
            break
          case 'mypage-identity-verification':
            setShowIdentityVerification(true)
            break
          case 'mypage-identity-complete':
            setShowIdentityComplete(true)
            break
          case 'mypage-notifications':
            setShowNotifications(true)
            break
          case 'mypage-messages':
            setShowMessageList(true)
            break
          case 'mypage-settings':
            setShowSettings(true)
            break
          default:
            // マイページから戻る場合は親のonBackを呼ぶ
            if (state.screen === 'home' || state.screen === 'mypage') {
              onBack()
            }
        }
      } else {
        // ブラウザの戻るボタンが押された場合
        onBack()
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [onBack])

  const pushToHistory = (screen: string, data?: any) => {
    if (typeof window !== 'undefined') {
      window.history.pushState({ screen, ...data }, '', window.location.href)
    }
  }

  const goBack = () => {
    if (typeof window !== 'undefined') {
      window.history.back()
    }
  }

  const backToMyPageMain = () => {
    setShowProfileEdit(false)
    setShowJoinedCasts(false)
    setShowPointHistory(false)
    setShowPaymentInfo(false)
    setShowHelp(false)
    setShowIdentityVerification(false)
    setShowIdentityComplete(false)
    setShowNotifications(false)
    setShowMessageList(false)
    setShowSettings(false)
    pushToHistory('mypage-main')
  }

  const navigateToProfileEdit = () => {
    setShowProfileEdit(true)
    pushToHistory('mypage-profile-edit')
  }

  const navigateToJoinedCasts = () => {
    setShowJoinedCasts(true)
    pushToHistory('mypage-joined-casts')
  }

  const navigateToPointHistory = () => {
    setShowPointHistory(true)
    pushToHistory('mypage-point-history')
  }

  const navigateToPaymentInfo = () => {
    setShowPaymentInfo(true)
    pushToHistory('mypage-payment-info')
  }

  const navigateToHelp = () => {
    setShowHelp(true)
    pushToHistory('mypage-help')
  }

  const navigateToIdentityVerification = () => {
    setShowIdentityVerification(true)
    pushToHistory('mypage-identity-verification')
  }

  const navigateToNotifications = () => {
    setShowNotifications(true)
    pushToHistory('mypage-notifications')
  }

  const navigateToMessages = () => {
    setShowMessageList(true)
    pushToHistory('mypage-messages')
  }

  const navigateToSettings = () => {
    setShowSettings(true)
    pushToHistory('mypage-settings')
  }

  // API queries - temporarily disabled
  // const {
  //   data: bookingsData,
  //   isLoading: isLoadingBookings,
  //   error: bookingsError,
  // } = api.booking.getUserBookings.useQuery(undefined, {
  //   enabled: !!session?.user?.id,
  //   staleTime: 1000 * 60 * 5,
  //   retry: 1,
  // })

  // Temporary mock data
  const bookingsData: any[] = []
  const isLoadingBookings = false
  const bookingsError = null

  // const {
  //   data: notificationsData,
  //   isLoading: isLoadingNotifications,
  // } = api.user.getNotifications.useQuery(
  //   {
  //     limit: 1,
  //     offset: 0,
  //     isRead: false,
  //   },
  //   {
  //     enabled: status === "authenticated",
  //     staleTime: 1000 * 60 * 2,
  //   }
  // )

  // Temporary mock data for notifications
  const notificationsData: any[] = []
  const isLoadingNotifications = false

  const userProfile = useMemo(() => {
    return {
      avatar: session?.user?.image || "/placeholder-user.jpg",
      name: session?.user?.name || "ゲスト",
      age: session?.user?.dob ?
        new Date().getFullYear() - new Date(session.user.dob).getFullYear() :
        null,
      job: "未設定",
      isVerified: false,
      verificationStatus: "PENDING" as string,
    }
  }, [session])

  const matchedCasts = useMemo(() => {
    if (!bookingsData) return []

    return bookingsData.slice(0, 7).map((booking: any) => {
      const cast = booking.cast
      const castProfile = cast.castProfile

      return {
        id: booking.id,
        name: castProfile?.displayName || cast.name || "Unknown",
        avatar: castProfile?.avatar || cast.image || "/placeholder-user.jpg",
      }
    })
  }, [bookingsData])

  const hasUnreadNotifications = (notificationsData?.length || 0) > 0

  const getVerificationStatusText = () => {
    switch (userProfile.verificationStatus) {
      case "VERIFIED":
        return "認証済み"
      case "REJECTED":
        return "認証に失敗しました"
      case "PENDING":
      default:
        return "本人確認書類を確認中"
    }
  }

  const getVerificationStatusColor = () => {
    switch (userProfile.verificationStatus) {
      case "VERIFIED":
        return "bg-green-500"
      case "REJECTED":
        return "bg-red-500"
      case "PENDING":
      default:
        return "bg-yellow-500"
    }
  }

  if (showMessageList) {
    return <MessageListScreen onBack={goBack} onNavigateToMyPage={() => setShowMessageList(false)} onNavigateToHome={onBack} />
  }

  if (showNotifications) {
    return <NotificationScreen onBack={() => setShowNotifications(false)} returnTo="mypage" />
  }

  if (showSettings) {
    return <SettingsScreen onBack={backToMyPageMain} />
  }

  if (showIdentityComplete) {
    return <IdentityVerificationCompleteScreen onBack={backToMyPageMain} />
  }

  if (showIdentityVerification) {
    return (
      <IdentityVerificationScreen
        onBack={backToMyPageMain}
        onSubmit={() => {
          setShowIdentityVerification(false)
          setShowIdentityComplete(true)
          pushToHistory('mypage-identity-complete')
        }}
      />
    )
  }

  if (showPointHistory) {
    return <PointHistoryScreen onBack={backToMyPageMain} />
  }

  if (showPaymentInfo) {
    return <PaymentInfoScreen onBack={backToMyPageMain} />
  }

  if (showHelp) {
    return <HelpScreen onBack={backToMyPageMain} />
  }

  if (showJoinedCasts) {
    return <JoinedCastsScreen onBack={backToMyPageMain} />
  }

  if (showProfileEdit) {
    return <ProfileEditScreen onBack={backToMyPageMain} />
  }

  return (
    <div className="h-full w-full bg-gray-100 flex flex-col relative">
      <div className="bg-gold-pink-gradient px-4 py-4 h-16 flex items-center justify-between fixed top-0 left-1/2 transform -translate-x-1/2 w-full md:max-w-sm z-10 shadow-lg">
        <h1 className="text-base font-medium text-white">マイページ</h1>

        <div className="flex items-center gap-3">
          {
            isLoadingNotifications ? (
              <div className="w-6 h-6 bg-white/20 rounded-full animate-pulse" />
            ) : (
              <NotificationIcon onClick={navigateToNotifications} hasNotifications={hasUnreadNotifications} />
            )
          }

          <button className="p-1 hover:bg-white/20 transition-colors rounded-full" onClick={navigateToSettings}>
            <Settings className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pt-[64px] bg-gray-100 content-with-safe-footer">
        <div className="bg-white p-8 text-center">
          {
            isLoadingBookings ? (
              <div className="flex flex-col items-center">
                <Skeleton className="w-32 h-32 rounded-full mb-4" />
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-20" />
              </div>
          ) : (
            <>
              <div className="relative inline-block mb-4">
                <button
                  onClick={navigateToProfileEdit}
                  className="w-32 h-32 rounded-full bg-gray-200 overflow-hidden mx-auto hover:opacity-90 transition-opacity"
                >
                  <Image
                    width={128}
                    height={128}
                    alt="Profile"
                    src={userProfile.avatar}
                    className="object-cover w-full h-full"
                  />
                </button>

                <button
                  onClick={navigateToProfileEdit}
                  className="absolute bottom-2 right-2 w-8 h-8 bg-gold-pink-gradient rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>

                {
                  userProfile.isVerified && (
                    <div className="absolute top-0 right-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )
                }
              </div>

              <h2 className="text-base font-medium text-black">
                {userProfile.name}{userProfile.age ? ` ${userProfile.age}歳` : ""}
              </h2>

              <p className="text-xs text-gray-600 mt-1">{userProfile.job}</p>
            </>
          )}
        </div>

        <div className="h-4 bg-gray-100"></div>

        <div className="bg-white p-4">
          <button onClick={navigateToJoinedCasts} className="w-full flex items-center justify-between mb-4 hover:bg-gray-50 transition-colors rounded-lg p-2 -m-2">
            <span className="text-sm font-medium text-black">合流したキャスト</span>

            <div className="flex items-center gap-2">
              {!isLoadingBookings && matchedCasts.length > 0 && (
                <span className="text-xs text-gray-500">{matchedCasts.length}人</span>
              )}

              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </button>

          <div className="flex items-center justify-center">
            {isLoadingBookings ? (
              <div className="flex items-center">
                {[...Array(5)].map((_, index) => (
                  <div
                    key={`skeleton-${index}`}
                    className={`relative ${index > 0 ? "-ml-2" : ""}`}
                    style={{ zIndex: 5 - index }}
                  >
                    <Skeleton className="w-12 h-12 rounded-full" />
                  </div>
                ))}
              </div>
            ) : matchedCasts.length === 0 ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full border-2 border-dotted border-gray-300 bg-white flex items-center justify-center mx-auto mb-2">
                  <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-gray-500">まだ合流したキャストがいません</p>
              </div>
            ) : (
              <div className="flex items-center">
                {matchedCasts.map((cast, index) => (
                  <div
                    key={`cast-${cast.id}-${index}`}
                    className={`relative ${index > 0 ? "-ml-2" : ""}`}
                    style={{ zIndex: matchedCasts.length - index }}
                  >
                    <div className="w-12 h-12 rounded-full border-2 border-white bg-gray-200 overflow-hidden shadow-sm">
                      <Image
                        src={cast.avatar}
                        alt={cast.name}
                        width={48}
                        height={48}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  </div>
                ))}

                {matchedCasts.length < 7 && [...Array(7 - matchedCasts.length)].map((_, index) => (
                  <div
                    key={`placeholder-${index}`}
                    className="relative -ml-2"
                    style={{ zIndex: 7 - matchedCasts.length - index }}
                  >
                    <div className="w-12 h-12 rounded-full border-2 border-dotted border-gray-300 bg-white flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="h-4 bg-gray-100"></div>

        <div className="bg-white">
          <button
            onClick={navigateToPointHistory}
            className="w-full flex items-center justify-between p-4 border-b border-gray-100"
          >
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>

              <span className="text-sm text-black">ポイント履歴・領収書</span>
            </div>

            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          <button
            onClick={navigateToPaymentInfo}
            className="w-full flex items-center justify-between p-4 border-b border-gray-100"
          >
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>

              <span className="text-sm text-black">お支払い情報</span>
            </div>

            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          <button
            onClick={navigateToIdentityVerification}
            className="w-full flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>

              <span className="text-sm text-black">本人認証</span>

              <span className={`${getVerificationStatusColor()} text-white text-xs px-2 py-1 rounded`}>
                {getVerificationStatusText()}
              </span>
            </div>

            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          <button onClick={navigateToHelp} className="w-full flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>

              <span className="text-sm text-black">ヘルプ</span>
            </div>

            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="h-4 bg-gray-100"></div>
      </div>

      <Footer
        messageCount={17}
        activeButton="profile"
        onSearchClick={onBack}
        onProfileClick={() => { }}
        onMessageClick={navigateToMessages}
      />
    </div>
  )
}
