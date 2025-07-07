"use client"

import { Settings, ChevronRight } from "lucide-react"
import Image from "next/image"
import ProfileEditScreen from "@/components/profile-edit-screen"
import JoinedCastsScreen from "@/components/joined-casts-screen"
import PointHistoryScreen from "@/components/point-history-screen"
import PaymentInfoScreen from "@/components/payment-info-screen"
import HelpScreen from "@/components/help-screen"
import IdentityVerificationScreen from "@/components/id-verification"
import IdentityVerificationCompleteScreen from "@/components/id-verify-complete"
import { useState, useEffect } from "react"
import NotificationScreen from "@/components/notification-screen"
import NotificationIcon from "@/components/shared/notification-icon"
import Footer from "@/components/shared/footer"
import MessageListScreen from "@/components/message-list-screen"
import SettingsScreen from "@/components/settings-screen"

interface MyPageScreenProps {
  onBack: () => void
}

export default function MyPageScreen({ onBack }: MyPageScreenProps) {
  const matchedCasts = Array.from({ length: 7 }, (_, index) => ({
    id: index + 1,
    name: `Cast ${index + 1}`,
  }))

  const [showProfileEdit, setShowProfileEdit] = useState(false)
  const [showJoinedCasts, setShowJoinedCasts] = useState(false)
  const [showPointHistory, setShowPointHistory] = useState(false)
  const [showPaymentInfo, setShowPaymentInfo] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [showIdentityVerification, setShowIdentityVerification] = useState(false)
  const [showIdentityComplete, setShowIdentityComplete] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showMessageList, setShowMessageList] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // ブラウザ履歴を使った画面遷移管理
  useEffect(() => {
    // MyPage状態をブラウザ履歴に追加
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

  // 各画面からマイページのメイン画面に戻る関数
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
    // マイページのメイン画面の状態をブラウザ履歴にプッシュ
    pushToHistory('mypage-main')
  }

  // 各画面への遷移関数
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

  // User profile data (would come from state/API in real app)
  const userProfile = {
    name: "田中 美咲",
    age: 28, // Calculated from birth date 1996年10月22日
    job: "会社員",
  }

  // Show different screens based on state
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
      {/* Header */}
      <div className="bg-gold-pink-gradient px-4 py-4 h-16 flex items-center justify-between fixed top-0 left-1/2 transform -translate-x-1/2 w-full md:max-w-sm z-10 shadow-lg">
        <h1 className="text-base font-medium text-white">マイページ</h1>
        <div className="flex items-center gap-3">
          <NotificationIcon onClick={navigateToNotifications} hasNotifications={true} />
          <button className="p-1" onClick={navigateToSettings}>
            <Settings className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto pt-[64px] bg-gray-100 content-with-safe-footer">
        {/* Profile Section */}
        <div className="bg-white p-8 text-center">
          <div className="relative inline-block mb-4">
            {/* Profile Image */}
            <button
              onClick={navigateToProfileEdit}
              className="w-32 h-32 rounded-full bg-gray-200 overflow-hidden mx-auto"
            >
              <Image
                src="https://randomuser.me/api/portraits/women/32.jpg"
                alt="Profile"
                width={128}
                height={128}
                className="object-cover w-full h-full"
              />
            </button>
            {/* Edit Icon - overlapping the profile image */}
            <button
              onClick={navigateToProfileEdit}
              className="absolute bottom-2 right-2 w-8 h-8 bg-gold-pink-gradient rounded-full flex items-center justify-center shadow-lg"
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
          </div>
          <h2 className="text-base font-medium text-black">
            {userProfile.name} {userProfile.age}歳
          </h2>
          <p className="text-xs text-gray-600 mt-1">{userProfile.job}</p>
        </div>

        {/* Gray Spacer */}
        <div className="h-4 bg-gray-100"></div>

        {/* Matched Casts Section */}
        <div className="bg-white p-4">
          <button onClick={navigateToJoinedCasts} className="w-full flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-black">合流したキャスト</span>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          {/* Cast Avatars */}
          <div className="flex items-center justify-center">
            <div className="flex items-center">
              {matchedCasts.map((cast, index) => (
                <div
                  key={cast.id}
                  className={`relative ${index > 0 ? "-ml-2" : ""}`}
                  style={{ zIndex: matchedCasts.length - index }}
                >
                  <div className="w-12 h-12 rounded-full border-2 border-dotted border-gray-300 bg-white flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-amber-800 flex items-center justify-center">
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
          </div>
        </div>

        {/* Gray Spacer */}
        <div className="h-4 bg-gray-100"></div>

        {/* Menu Section */}
        <div className="bg-white">
          {/* Point History & Receipts */}
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

          {/* Payment Information */}
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

          {/* Identity Verification */}
          <button
            onClick={navigateToIdentityVerification}
            className="w-full flex items-center justify-between p-4 border-b border-gray-100"
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
              <span className="bg-gold-pink-gradient text-white text-xs px-2 py-1 rounded">本人確認書類を確認中</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          {/* Help */}
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

        {/* Final Gray Spacer */}
        <div className="h-4 bg-gray-100"></div>
      </div>

      {/* Bottom Navigation - Fixed */}
      <Footer
        onSearchClick={onBack}
        onMessageClick={navigateToMessages}
        onProfileClick={() => {}}
        messageCount={17}
        activeButton="profile"
      />
    </div>
  )
}
