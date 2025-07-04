"use client"

import { ArrowLeft } from "lucide-react"
import Image from "next/image"

interface PaymentDetailScreenProps {
  onBack: () => void
  paymentData: {
    id: number
    date: string
    castName: string
    castAge: number
    profileImage: string
    duration: number
    baseAmount: number
    extensionMinutes: number
    extensionAmount: number
    couponDiscount: number
    totalAmount: number
  }
}

export default function PaymentDetailScreen({ onBack, paymentData }: PaymentDetailScreenProps) {
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    const dayOfWeek = ["日", "月", "火", "水", "木", "金", "土"][date.getDay()]
    return `${month}月${day}日(${dayOfWeek})`
  }

  return (
    <div className="min-h-screen w-full md:max-w-sm mx-auto bg-gray-100 flex flex-col relative">
      {/* Header */}
      <div className="bg-gold-pink-gradient px-4 py-4 h-16 flex items-center gap-3 fixed top-0 left-1/2 transform -translate-x-1/2 w-full md:max-w-sm z-10 shadow-lg">
        <button onClick={onBack}>
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-base font-medium text-white">お支払い詳細</h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 mt-[64px] bg-gray-100 p-4">
        {/* Title */}
        <div className="mb-6">
          <h2 className="text-base font-medium text-black">合流ポイントの詳細</h2>
        </div>

        {/* Cast Profile */}
        <div className="bg-white rounded-lg p-4 mb-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full overflow-hidden">
              <Image
                src={paymentData.profileImage || "/placeholder.svg"}
                alt="Cast profile"
                width={48}
                height={48}
                className="object-cover w-full h-full"
              />
            </div>
            <div>
              <h3 className="text-sm font-medium text-black">
                {paymentData.castName} {paymentData.castAge}歳
              </h3>
            </div>
          </div>

          {/* Payment Breakdown */}
          <div className="space-y-4">
            {/* Base Duration */}
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-black">合流{paymentData.duration}分</span>
              <span className="text-sm font-medium text-black">{paymentData.baseAmount.toLocaleString()}P</span>
            </div>

            {/* Extension */}
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-black">延長{paymentData.extensionMinutes}分</span>
              <span className="text-sm font-medium text-black">{paymentData.extensionAmount}P</span>
            </div>

            {/* Coupon Discount */}
            {paymentData.couponDiscount > 0 && (
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gold-pink-gradient">クーポン利用</span>
                <span className="text-sm font-medium text-gold-pink-gradient">
                  割引額 {paymentData.couponDiscount.toLocaleString()}P
                </span>
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-gray-200 my-4"></div>

            {/* Total */}
            <div className="flex justify-between items-center py-2">
              <span className="text-sm font-medium text-black">合計</span>
              <span className="text-base font-bold text-black">{paymentData.totalAmount.toLocaleString()}P</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
