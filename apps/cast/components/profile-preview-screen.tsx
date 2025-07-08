"use client"

import { ArrowLeft, Heart, Star, MessageCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useState } from "react"

interface ProfilePreviewScreenProps {
  onBack: () => void
}

export default function ProfilePreviewScreen({ onBack }: ProfilePreviewScreenProps) {
  const [showModal, setShowModal] = useState(false)

  // サンプルプロフィールデータ（実際の実装では API から取得）
  const profileData = {
    name: "美咲",
    age: 28,
    job: "会社員",
    location: "東京都",
    images: [
      "https://randomuser.me/api/portraits/women/32.jpg",
      "https://randomuser.me/api/portraits/women/33.jpg",
      "https://randomuser.me/api/portraits/women/34.jpg",
    ],
    bio: "お疲れ様です！平日は忙しく働いていますが、週末は新しい出会いを求めて楽しく過ごしたいと思っています。お酒を飲みながら楽しい時間を過ごしませんか？",
    interests: ["お酒", "映画", "旅行", "カフェ巡り", "読書"],
    price: "8,000P / 30分",
    availability: "週末メイン",
    rating: 4.8,
    reviewCount: 127,
    favoriteCount: 342,
  }

  const openModal = () => setShowModal(true)
  const closeModal = () => setShowModal(false)

  return (
    <div className="h-full w-full bg-gray-100 flex flex-col relative">
      {/* Header */}
      <div className="bg-main-navy-gradient px-4 py-4 h-16 flex items-center fixed top-0 left-1/2 transform -translate-x-1/2 w-full md:max-w-sm z-10 shadow-lg">
        <button onClick={onBack} className="p-1 mr-3">
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <h1 className="text-base font-medium text-white">プロフィールプレビュー</h1>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto pt-[64px] bg-gray-100 content-with-safe-footer">
        {/* Information Banner */}
        <div className="bg-blue-50 border border-blue-200 p-4 mx-4 mt-4 rounded-lg">
          <p className="text-sm text-blue-900">
            これはゲストに表示される実際のプロフィール画面です。
          </p>
        </div>

        {/* Preview Button */}
        <div className="px-4 mt-4">
          <Button
            onClick={openModal}
            className="w-full bg-main-navy-gradient hover:bg-main-blue text-white py-3 rounded-lg font-medium"
          >
            プロフィールを確認する
          </Button>
        </div>

        {/* Profile Summary */}
        <div className="bg-white p-4 mx-4 mt-4 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-900 mb-3">現在のプロフィール情報</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">名前・年齢</span>
              <span className="text-sm text-gray-900">{profileData.name} {profileData.age}歳</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">職業</span>
              <span className="text-sm text-gray-900">{profileData.job}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">居住地</span>
              <span className="text-sm text-gray-900">{profileData.location}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">料金</span>
              <span className="text-sm text-gray-900">{profileData.price}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">写真</span>
              <span className="text-sm text-gray-900">{profileData.images.length}枚</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">趣味・興味</span>
              <span className="text-sm text-gray-900">{profileData.interests.length}個</span>
            </div>
          </div>
        </div>

        {/* Tips Section */}
        <div className="bg-white p-4 mx-4 mt-4 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-900 mb-3">プロフィールを魅力的にするコツ</h3>
          
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-main-blue rounded-full mt-1.5 flex-shrink-0"></div>
              <span>笑顔で明るい印象の写真を使用しましょう</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-main-blue rounded-full mt-1.5 flex-shrink-0"></div>
              <span>自己紹介文は具体的で親しみやすい内容にしましょう</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-main-blue rounded-full mt-1.5 flex-shrink-0"></div>
              <span>趣味や興味を多く登録して共通点を見つけやすくしましょう</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-main-blue rounded-full mt-1.5 flex-shrink-0"></div>
              <span>複数の写真を登録して魅力を伝えましょう</span>
            </div>
          </div>
        </div>

        {/* Final Gray Spacer */}
        <div className="h-4 bg-gray-100"></div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-sm h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-main-navy-gradient px-4 py-3 flex items-center justify-between">
              <h2 className="text-base font-medium text-white">プロフィール</h2>
              <button onClick={closeModal} className="p-1">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Profile Images */}
              <div className="relative h-64 bg-gray-200">
                <Image
                  src={profileData.images[0]}
                  alt="Profile"
                  fill
                  className="object-cover"
                />
                <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 rounded-full px-2 py-1">
                  <span className="text-white text-xs">1/{profileData.images.length}</span>
                </div>
              </div>

              {/* Profile Info */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {profileData.name} {profileData.age}歳
                    </h3>
                    <p className="text-sm text-gray-600">{profileData.job} • {profileData.location}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 bg-gray-100 rounded-full">
                      <Heart className="w-5 h-5 text-gray-600" />
                    </button>
                    <button className="p-2 bg-gray-100 rounded-full">
                      <Star className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm font-medium text-gray-900">{profileData.rating}</span>
                  </div>
                  <span className="text-sm text-gray-600">({profileData.reviewCount}件)</span>
                  <span className="text-sm text-gray-600">• {profileData.favoriteCount}人がお気に入り</span>
                </div>

                {/* Bio */}
                <div className="mb-4">
                  <p className="text-sm text-gray-700 leading-relaxed">{profileData.bio}</p>
                </div>

                {/* Interests */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">趣味・興味</h4>
                  <div className="flex flex-wrap gap-2">
                    {profileData.interests.map((interest, index) => (
                      <span
                        key={index}
                        className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Price & Availability */}
                <div className="bg-gray-50 p-3 rounded-lg mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">料金</span>
                    <span className="text-sm font-medium text-gray-900">{profileData.price}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">対応可能時間</span>
                    <span className="text-sm font-medium text-gray-900">{profileData.availability}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Button className="w-full bg-main-navy-gradient hover:bg-main-blue text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2">
                    <Heart className="w-4 h-4" />
                    いいね！
                  </Button>
                  <Button variant="outline" className="w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    メッセージ
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
