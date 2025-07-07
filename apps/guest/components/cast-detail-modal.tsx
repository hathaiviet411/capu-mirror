"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Star } from "lucide-react"
import Image from "next/image"

interface CastDetailModalProps {
  isOpen: boolean
  onClose: () => void
  cast: {
    id: number
    age: number
    name: string
    message: string
    price: string
    bgColor: string
    image?: string
    class?: string
    tags?: string[]
    images?: string[]
  }
}

export default function CastDetailModal({ isOpen, onClose, cast }: CastDetailModalProps) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const [showHeader, setShowHeader] = useState(false)

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

  if (!isOpen) return null

  const images = cast.images || [
    cast.image || "https://randomuser.me/api/portraits/men/32.jpg",
    `https://randomuser.me/api/portraits/men/${Math.floor(Math.random() * 50) + 20}.jpg`,
    `https://randomuser.me/api/portraits/men/${Math.floor(Math.random() * 50) + 50}.jpg`,
    `https://randomuser.me/api/portraits/men/${Math.floor(Math.random() * 30) + 70}.jpg`,
  ]

  const tags = cast.tags || ["爽やか系", "スポーツ好き", "会話上手"]

  return (
    <div className="fixed inset-0 z-50 bg-gray-100 w-full md:max-w-sm mx-auto flex flex-col">
      {/* Header - appears on scroll */}
      <div
        className={`fixed top-0 left-1/2 transform -translate-x-1/2 w-full md:max-w-sm bg-white border-b shadow-sm px-4 py-3 flex items-center gap-3 transition-all duration-300 ${
          showHeader ? "z-30 translate-y-0 opacity-100" : "z-30 -translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <button onClick={onClose}>
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <span className="text-base font-medium">{cast.name}</span>
      </div>

      {/* Scrollable Content */}
      <div id="cast-detail-scroll" className="flex-1 overflow-y-auto pb-20 relative z-10">
        {/* Main Image */}
        <div className="relative h-96 bg-gray-200">
          <Image
            src={images[currentImageIndex] || "/placeholder.svg"}
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
              onClick={() => setIsFavorite(!isFavorite)}
              className="w-12 h-12 bg-white rounded-full flex flex-col items-center justify-center shadow-lg"
            >
              <Star className={`w-7 h-7 ${isFavorite ? "text-yellow-400 fill-yellow-400" : "text-gray-400"}`} />
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
                  src={image || "/placeholder.svg"}
                  alt={`Cast photo ${index + 1}`}
                  width={64}
                  height={64}
                  className="object-cover w-full h-full"
                />
              </button>
            ))}
          </div>

          {/* Profile Info */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-base font-medium">
                {cast.name} 🔗 {cast.age}歳
              </h1>
              <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">プレミアム</span>
            </div>
            <p className="text-sm text-gray-700 mb-4">/ 仲良くしてください💪</p>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-white text-gray-700 text-xs px-3 py-2 rounded-full border border-gray-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Gray Spacer */}
        <div className="h-2 bg-gray-100"></div>

        {/* Pricing Section */}
        <div className="bg-white p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">30分あたりのポイント</span>
            <span className="text-xl font-bold">6,800P</span>
          </div>
        </div>

        {/* Gray Spacer */}
        <div className="h-2 bg-gray-100"></div>

        {/* Self Introduction Section */}
        <div className="bg-white p-4">
          <h3 className="text-base font-medium text-gray-700 mb-3">自己紹介</h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            はじめまして！{cast.name}です✨
            <br />
            <br />
            普段は仕事で忙しい毎日を送っていますが、休日はスポーツをしたり、映画を見たりしてリラックスしています。
            <br />
            <br />
            いろんな話をするのが好きで、多くの方とお会いできるのを楽しみにしています。一緒に楽しい時間を過ごしませんか？
            <br />
            <br />
            気軽にメッセージをお送りください💪
          </p>
        </div>

        {/* Gray Spacer */}
        <div className="h-2 bg-gray-100"></div>

        {/* Profile Details */}
        <div className="bg-white p-4">
          <h3 className="text-base font-medium text-gray-700 mb-3">プロフィール詳細</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">身長</span>
              <span className="text-sm font-medium">175cm</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">体型</span>
              <span className="text-sm font-medium">普通</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">趣味</span>
              <span className="text-sm font-medium">スポーツ、映画鑑賞</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">特技</span>
              <span className="text-sm font-medium">サッカー、ギター</span>
            </div>
          </div>
        </div>

        {/* Final Gray Spacer */}
        <div className="h-4 bg-gray-100"></div>
      </div>

      {/* Fixed Action Button */}
      <div className="bg-white border-t p-4">
        {isLiked ? (
          <Button
            className="w-full h-12 bg-gold-pink-gradient hover:bg-gold-pink-gradient-dark text-white text-base font-medium rounded-lg flex items-center justify-center gap-2"
            onClick={() => {
              // メッセージ送信の処理をここに追加
              console.log("メッセージを送る")
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            メッセージを送る
          </Button>
        ) : (
          <Button
            className="w-full h-12 bg-white border-2 border-gold-pink-gradient text-gold-pink-gradient hover:bg-gold-pink-gradient hover:text-white text-base font-medium rounded-lg"
            onClick={() => setIsLiked(true)}
          >
            <span className="mr-2">🧡</span>
            いいね
          </Button>
        )}
      </div>
    </div>
  )
}
