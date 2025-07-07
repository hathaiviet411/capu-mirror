"use client"

import { ArrowLeft } from "lucide-react"
import Image from "next/image"
import CastDetailModal from "@/components/cast-detail-modal"
import { useState } from "react"

interface JoinedCastsScreenProps {
  onBack: () => void
}

export default function JoinedCastsScreen({ onBack }: JoinedCastsScreenProps) {
  const [showCastDetail, setShowCastDetail] = useState(false)
  const [selectedCast, setSelectedCast] = useState<any>(null)

  const joinedCasts = [
    {
      id: 1,
      date: "2025年06月03日",
      name: "だいちくん🍓",
      age: 28,
      bgColor: "from-blue-200 to-blue-300",
      message: "楽しい時間をありがとうございました✨",
      price: "15,000P / 30分",
      image: "https://randomuser.me/api/portraits/men/12.jpg",
    },
    {
      id: 2,
      date: "2025年05月28日",
      name: "ゆうきくん🌟",
      age: 25,
      bgColor: "from-green-200 to-green-300",
      message: "また一緒にお話ししましょう💪",
      price: "12,000P / 30分",
      image: "https://randomuser.me/api/portraits/men/34.jpg",
    },
    {
      id: 3,
      date: "2025年05月20日",
      name: "しょうたくん🎯",
      age: 27,
      bgColor: "from-orange-200 to-orange-300",
      message: "素敵な時間でした⚽",
      price: "18,000P / 30分",
      image: "https://randomuser.me/api/portraits/men/58.jpg",
    },
  ]

  const handleCastClick = (cast: any) => {
    setSelectedCast(cast)
    setShowCastDetail(true)
  }

  return (
    <>
      <div className="min-h-screen w-full md:max-w-sm mx-auto bg-gray-100 flex flex-col relative">
        {/* Header */}
        <div className="bg-main-navy-gradient px-4 py-4 h-16 flex items-center gap-3 fixed top-0 left-1/2 transform -translate-x-1/2 w-full md:max-w-sm z-10 shadow-lg">
          <button onClick={onBack}>
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-lg font-medium text-white">合流したキャスト</h1>
        </div>

        {/* Main Content - Scrollable */}
        <div className="flex-1 overflow-y-auto mt-[64px] bg-gray-100 pb-8">
          {joinedCasts.map((cast, index) => (
            <div key={cast.id} className="mb-4">
              {/* Date Header - Outside white component */}
              <div className="bg-gray-100 px-4 py-2">
                <span className="text-xs text-gray-600">{cast.date}</span>
              </div>

              {/* Cast Item */}
              <div className="bg-white px-4 py-4">
                <button onClick={() => handleCastClick(cast)} className="w-full flex items-center gap-3">
                  {/* Profile Image */}
                  <div
                    className={`w-16 h-16 rounded-full bg-gradient-to-br ${cast.bgColor} overflow-hidden flex-shrink-0`}
                  >
                    <Image
                      src={cast.image || "/placeholder.svg?height=64&width=64"}
                      alt="Cast profile"
                      width={64}
                      height={64}
                      className="object-cover w-full h-full"
                    />
                  </div>

                  {/* Cast Info */}
                  <div className="flex-1 text-left">
                    <h3 className="text-sm font-medium text-black">
                      {cast.name} {cast.age}歳
                    </h3>
                  </div>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cast Detail Modal */}
      {selectedCast && (
        <CastDetailModal isOpen={showCastDetail} onClose={() => setShowCastDetail(false)} cast={selectedCast} />
      )}
    </>
  )
}
