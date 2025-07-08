"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Star, MessageCircle, Heart } from "lucide-react"
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
        className={`fixed top-0 left-1/2 transform -translate-x-1/2 w-full md:max-w-sm bg-gold-pink-gradient border-b shadow-lg px-4 py-4 h-16 flex items-center gap-3 transition-all duration-300 ${
          showHeader ? "z-30 translate-y-0 opacity-100" : "z-30 -translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <button onClick={onClose}>
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <span className="text-base font-medium text-white">{cast.name}</span>
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

          {/* Online Status and Profile Info */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-xs text-green-600">オンライン中</span>
            </div>
            <h1 className="text-base font-medium mb-1">
              {cast.name} {cast.age}歳
            </h1>
            <p className="text-sm text-gray-700">
              {cast.class || "会社員"} / {cast.message}
            </p>
          </div>
        </div>

        {/* Gray Spacer */}
        <div className="h-2 bg-gray-100"></div>

        {/* Simple Profile Tags Section */}
        {tags && tags.length > 0 && (
          <>
            <div className="bg-white p-4">
              <h3 className="text-sm font-medium text-black mb-3">簡単プロフィール</h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
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
            <span className="text-xl font-bold">{cast.price}</span>
          </div>
        </div>

        {/* Gray Spacer */}
        <div className="h-2 bg-gray-100"></div>

        {/* Self Introduction Section */}
        <div className="bg-white p-4">
          <h3 className="text-sm font-medium text-black mb-3">自己紹介</h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            はじめまして！{cast.name}です✨
            {"\n\n"}
            普段は仕事で忙しい毎日を送っていますが、休日はスポーツをしたり、映画を見たりしてリラックスしています。
            {"\n\n"}
            いろんな話をするのが好きで、多くの方とお会いできるのを楽しみにしています。一緒に楽しい時間を過ごしませんか？
            {"\n\n"}
            気軽にメッセージをお送りください💪
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
              <span className="text-sm font-medium">{cast.class || "会社員"}</span>
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
        {!isLiked ? (
          <Button 
            variant="outline"
            onClick={() => setIsLiked(true)}
            className="w-full h-12 border-2 border-gold-pink-gradient text-gold-pink-gradient hover:bg-gold-pink-gradient hover:text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2 bg-white"
          >
            <Heart className="w-4 h-4" />
            いいね
          </Button>
        ) : (
          <Button 
            className="w-full h-12 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2 bg-gold-pink-gradient hover:bg-accent-gold"
          >
            <MessageCircle className="w-4 h-4" />
            メッセージを送る
          </Button>
        )}
      </div>
    </div>
  )
}
