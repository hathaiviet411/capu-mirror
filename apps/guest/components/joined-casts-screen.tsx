"use client"

import { ArrowLeft } from "lucide-react"
import Image from "next/image"
import CastDetailModal from "@/components/cast-detail-modal"
import { useState, useMemo } from "react"
import { api } from "~/utils/api"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { useSession } from "next-auth/react"

interface JoinedCastsScreenProps {
  onBack: () => void
}

export default function JoinedCastsScreen({ onBack }: JoinedCastsScreenProps) {
  const { toast } = useToast()
  const { data: session } = useSession()
  const [showCastDetail, setShowCastDetail] = useState(false)
  const [selectedCast, setSelectedCast] = useState<any>(null)

  // API queries
  const {
    data: bookingsData,
    isLoading: isLoadingBookings,
    error: bookingsError,
    refetch: refetchBookings,
  } = api.booking.getUserBookings.useQuery(undefined, {
    enabled: !!session?.user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  })

  // Process bookings data
  const joinedCasts = useMemo(() => {
    if (!bookingsData) return []

    return bookingsData.map((booking: any) => {
      const cast = booking.cast
      const castProfile = cast.castProfile
      
      // Format date
      const bookingDate = new Date(booking.scheduledDateTime)
      const formattedDate = bookingDate.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).replace(/\//g, '年').replace(/年$/, '日')

      return {
        id: booking.id,
        date: formattedDate,
        displayName: castProfile?.displayName || cast.name || "Unknown",
        avatar: castProfile?.avatar || cast.image || "/placeholder-user.jpg",
        bio: castProfile?.bio || "楽しい時間をありがとうございました✨",
        hourlyRate: castProfile?.hourlyRate || 0,
        tags: castProfile?.tags || [],
        isVerified: castProfile?.isVerified || false,
        reviews: castProfile?.reviews || [],
        _count: castProfile?._count || {},
        booking,
        cast,
        castProfile,
        // Legacy support for CastDetailModal
        name: castProfile?.displayName || cast.name,
        age: 25, // TODO: Calculate age from birth date
        image: castProfile?.avatar || cast.image,
        price: castProfile?.hourlyRate ? `${castProfile.hourlyRate.toLocaleString()}P / 30分` : "料金未設定",
        message: castProfile?.bio || "楽しい時間をありがとうございました✨",
        bgColor: "from-pink-200 to-pink-300",
      }
    })
  }, [bookingsData])

  const handleCastClick = (cast: any) => {
    setSelectedCast(cast)
    setShowCastDetail(true)
  }

  return (
    <>
      <div className="min-h-screen w-full md:max-w-sm mx-auto bg-gray-100 flex flex-col relative">
        {/* Header */}
        <div className="bg-gold-pink-gradient px-4 py-4 h-16 flex items-center gap-3 fixed top-0 left-1/2 transform -translate-x-1/2 w-full md:max-w-sm z-10 shadow-lg">
          <button onClick={onBack}>
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-lg font-medium text-white">合流したキャスト</h1>
        </div>

        {/* Main Content - Scrollable */}
        <div className="flex-1 overflow-y-auto mt-[64px] bg-gray-100 pb-8">
          {/* Loading state */}
          {isLoadingBookings && (
            <>
              {[...Array(5)].map((_, index) => (
                <div key={`skeleton-${index}`} className="mb-4">
                  <div className="bg-gray-100 px-4 py-2">
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <div className="bg-white px-4 py-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-16 h-16 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Error state */}
          {bookingsError && (
            <div className="p-8 text-center">
              <p className="text-red-500 mb-4">合流履歴の読み込みに失敗しました</p>
              <button 
                onClick={() => refetchBookings()}
                className="text-blue-500 underline"
              >
                再試行
              </button>
            </div>
          )}

          {/* Empty state */}
          {!isLoadingBookings && !bookingsError && joinedCasts.length === 0 && (
            <div className="p-8 text-center">
              <div className="mb-4">
                <svg className="w-16 h-16 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <p className="text-gray-600 mb-2">まだ合流したキャストがいません</p>
              <p className="text-sm text-gray-500">キャストと合流すると、ここに履歴が表示されます</p>
            </div>
          )}

          {/* Cast list */}
          {!isLoadingBookings && !bookingsError && joinedCasts.map((cast, index) => (
            <div key={`joined-cast-${cast.id}-${index}`} className="mb-4">
              {/* Date Header - Outside white component */}
              <div className="bg-gray-100 px-4 py-2">
                <span className="text-xs text-gray-600">{cast.date}</span>
              </div>

              {/* Cast Item */}
              <div className="bg-white px-4 py-4">
                <button onClick={() => handleCastClick(cast)} className="w-full flex items-center gap-3 hover:bg-gray-50 transition-colors rounded-lg p-2 -m-2">
                  {/* Profile Image */}
                  <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 bg-gray-200">
                    <Image
                      src={cast.avatar || "/placeholder-user.jpg"}
                      alt="Cast profile"
                      width={64}
                      height={64}
                      className="object-cover w-full h-full"
                    />
                  </div>

                  {/* Cast Info */}
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-medium text-black">
                        {cast.displayName}
                      </h3>
                      {cast.isVerified && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">認証済み</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {cast.bio}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">
                        {cast.hourlyRate ? `${cast.hourlyRate.toLocaleString()}P / 30分` : "料金未設定"}
                      </span>
                      <span className="text-xs text-green-600 font-medium">合流済み</span>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cast Detail Modal */}
      {selectedCast && (
        <CastDetailModal 
          isOpen={showCastDetail} 
          onClose={() => setShowCastDetail(false)} 
          cast={selectedCast} 
        />
      )}
    </>
  )
}
