"use client"

import { Search, MessageCircle, User } from "lucide-react"

export interface FooterProps {
  onSearchClick: () => void
  onMessageClick: () => void
  onProfileClick: () => void
  messageCount?: number
  activeButton?: "search" | "message" | "profile"
}

export default function Footer({
  onSearchClick,
  onMessageClick,
  onProfileClick,
  messageCount = 0,
  activeButton = "search"
}: FooterProps) {
  return (
    <div className="bg-main-navy-gradient border-t shadow-lg px-4 h-16 flex fixed footer-safe-bottom left-1/2 transform -translate-x-1/2 w-full md:max-w-sm z-10">
      <button onClick={onSearchClick} className="flex-1 flex flex-col items-center justify-center">
        <Search
          className={`w-6 h-6 ${activeButton === "search" ? "text-accent-blue" : "text-white"}`}
        />
        <span className={`text-xs mt-1 ${activeButton === "search" ? "text-accent-blue" : "text-white"}`}>
          探す
        </span>
      </button>
      <button onClick={onMessageClick} className="flex-1 flex flex-col items-center justify-center relative">
        <MessageCircle
          className={`w-6 h-6 ${activeButton === "message" ? "text-accent-blue" : "text-white"}`}
        />
        <span className={`text-xs mt-1 ${activeButton === "message" ? "text-accent-blue" : "text-white"}`}>
          メッセージ
        </span>
        {messageCount > 0 && (
          <div className="absolute top-0 -right-[0] bg-accent-blue text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {messageCount > 99 ? "99+" : messageCount}
          </div>
        )}
      </button>
      <button onClick={onProfileClick} className="flex-1 flex flex-col items-center justify-center">
        <User
          className={`w-6 h-6 ${activeButton === "profile" ? "text-accent-blue" : "text-white"}`}
        />
        <span className={`text-xs mt-1 ${activeButton === "profile" ? "text-accent-blue" : "text-white"}`}>
          マイページ
        </span>
      </button>
    </div>
  )
} 