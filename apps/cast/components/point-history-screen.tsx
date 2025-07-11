"use client"

import { ArrowLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import PaymentDetailScreen from "@/components/payment-detail-screen"
import { useState } from "react"

interface PointHistoryScreenProps {
  onBack: () => void
}

export default function PointHistoryScreen({ onBack }: PointHistoryScreenProps) {
  const [showPaymentDetail, setShowPaymentDetail] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null)

  const pointHistory = [
    {
      id: 1,
      date: "2025年06月04日 14:07",
      type: "charge",
      title: "オートチャージ",
      amount: "+12,000P",
      icon: "👨‍💼",
      transactionData: {
        date: "2025年06月04日 14:07",
        amount: "12,000P",
        type: "charge",
      },
    },
    {
      id: 2,
      date: "2025年06月03日 20:52",
      type: "payment",
      title: "合流ポイント 決済完了",
      amount: "-9,500P",
      profileImage: "https://randomuser.me/api/portraits/men/56.jpg",
      hasArrow: true,
      paymentData: {
        id: 2,
        date: "2025-06-03T20:52:00",
        castName: "あおいくん🍓",
        castAge: 28,
        profileImage: "https://randomuser.me/api/portraits/men/56.jpg",
        duration: 90,
        baseAmount: 19500,
        extensionMinutes: 0,
        extensionAmount: 0,
        couponDiscount: 10000,
        totalAmount: 9500,
      },
    },
  ]

  const handlePaymentDetail = (transaction: any) => {
    setSelectedTransaction(transaction)
    setShowPaymentDetail(true)
  }

  if (showPaymentDetail && selectedTransaction) {
    return (
      <PaymentDetailScreen onBack={() => setShowPaymentDetail(false)} paymentData={selectedTransaction.paymentData} />
    )
  }

  return (
    <div className="min-h-screen w-full md:max-w-sm mx-auto bg-gray-100 flex flex-col relative">
      {/* Header */}
      <div className="bg-main-navy-gradient px-4 py-4 h-16 flex items-center gap-3 fixed top-0 left-1/2 transform -translate-x-1/2 w-full md:max-w-sm z-10 shadow-lg">
        <button onClick={onBack}>
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-base font-medium text-white">ポイント履歴</h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto mt-[64px] bg-gray-100 pb-8">
        {/* Current Points Section */}
        <div className="bg-white p-6 text-center mb-4">
          <h2 className="text-sm text-gray-700 mb-4">現在の所有ポイント</h2>
          <div className="text-4xl font-bold text-black mb-6">2,500P</div>
          <div className="space-y-2">
            <p className="text-xs text-gray-600">ポイントは3,000Pごとにオートチャージされます</p>
            <p className="text-xs text-gray-600">またポイントの有効期限は購入・取得から180日です</p>
          </div>
        </div>

        {/* Point History */}
        <div className="space-y-4">
          {pointHistory.map((item, index) => (
            <div key={`point-${item.id}-${index}`}>
              <div className="bg-white p-4">
                <button
                  onClick={() => {
                    if (item.type === "payment") {
                      handlePaymentDetail(item)
                    }
                  }}
                  className="w-full flex items-center gap-3"
                  disabled={item.type === "charge"}
                >
                  {/* Icon or Profile Image */}
                  <div className="w-10 h-10 flex-shrink-0">
                    {item.type === "charge" ? (
                      <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center text-lg">
                        {item.icon}
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full overflow-hidden">
                        <Image
                          src={item.profileImage || "/placeholder.svg"}
                          alt="Profile"
                          width={40}
                          height={40}
                          className="object-cover w-full h-full"
                        />
                      </div>
                    )}
                  </div>

                  {/* Transaction Details */}
                  <div className="flex-1 text-left">
                    <p className="text-xs text-gray-500 mb-1">{item.date}</p>
                    <p className="text-sm text-black">{item.title}</p>
                  </div>

                  {/* Amount and Arrow */}
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${item.type === "charge" ? "text-black" : "text-red-500"}`}>
                      {item.amount}
                    </span>
                    {item.hasArrow && <ChevronRight className="w-5 h-5 text-gray-400" />}
                  </div>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
