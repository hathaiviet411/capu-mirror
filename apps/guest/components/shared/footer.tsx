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
    <div className="bg-white border-t shadow-lg px-4 h-16 flex fixed footer-safe-bottom left-1/2 transform -translate-x-1/2 w-full md:max-w-sm z-10">
      {/* Gradient definition for icon strokes */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="footer-icon-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#D4B96E" />
            <stop offset="100%" stopColor="#FF5FA2" />
          </linearGradient>
        </defs>
      </svg>
      <button onClick={onSearchClick} className="flex-1 flex flex-col items-center justify-center">
        <Search
          className="w-6 h-6 text-gray-600"
          style={activeButton === "search" ? { stroke: "url(#footer-icon-gradient)" } : {}}
        />
        <span className={`text-xs mt-1 ${activeButton === "search" ? "text-gold-pink-gradient" : "text-gray-600"}`}>
          探す
        </span>
      </button>
      <button onClick={onMessageClick} className="flex-1 flex flex-col items-center justify-center relative">
        <MessageCircle
          className="w-6 h-6 text-gray-600"
          style={activeButton === "message" ? { stroke: "url(#footer-icon-gradient)" } : {}}
        />
        <span className={`text-xs mt-1 ${activeButton === "message" ? "text-gold-pink-gradient" : "text-gray-600"}`}>
          メッセージ
        </span>
        {messageCount > 0 && (
          <div className="absolute top-0 -right-[0] bg-gold-pink-gradient text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {messageCount > 99 ? "99+" : messageCount}
          </div>
        )}
      </button>
      <button onClick={onProfileClick} className="flex-1 flex flex-col items-center justify-center">
        <User
          className="w-6 h-6 text-gray-600"
          style={activeButton === "profile" ? { stroke: "url(#footer-icon-gradient)" } : {}}
        />
        <span className={`text-xs mt-1 ${activeButton === "profile" ? "text-gold-pink-gradient" : "text-gray-600"}`}>
          マイページ
        </span>
      </button>
    </div>
  )
} 