"use client"

import { ArrowLeft, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import CreditCardRegistrationScreen from "@/components/card-registration"
import { useState } from "react"

interface PaymentInfoScreenProps {
  onBack: () => void
}

export default function PaymentInfoScreen({ onBack }: PaymentInfoScreenProps) {
  const [showCreditCardRegistration, setShowCreditCardRegistration] = useState(false)

  if (showCreditCardRegistration) {
    return <CreditCardRegistrationScreen onBack={() => setShowCreditCardRegistration(false)} />
  }

  return (
    <div className="min-h-screen w-full md:max-w-sm mx-auto bg-gray-100 flex flex-col relative">
      {/* Header */}
      <div className="bg-main-navy-gradient px-4 py-4 h-16 flex items-center gap-3 fixed top-0 left-1/2 transform -translate-x-1/2 w-full md:max-w-sm z-10 shadow-lg">
        <button onClick={onBack}>
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-base font-medium text-white">お支払い情報</h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto mt-[64px] bg-gray-100 pb-8">
        {/* Payment Info Section */}
        <div className="bg-white p-4 mb-4">
          <h2 className="text-sm font-medium text-black mb-4">お支払い情報</h2>

          {/* Card Info */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-4">
            <span className="text-sm text-black">************3118</span>
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
          </div>

          {/* Add Payment Button */}
          <Button
            onClick={() => setShowCreditCardRegistration(true)}
            className="w-full h-12 bg-main-navy-gradient hover:bg-main-blue text-white text-sm font-medium rounded-lg mb-4"
          >
            お支払い情報を追加する
          </Button>

          {/* Information Text */}
          <div className="space-y-3">
            <p className="text-xs text-gray-600 leading-relaxed">
              ※上記でご選択いただいているカードで決済エラーとなる場合、自動的に他に登録いただいているカードで決済が行われる仕様となっております。
            </p>
            <p className="text-xs text-gray-600 leading-relaxed">
              カード情報を削除する際は、削除したいカードを左スワイプしていただければ幸いです。
            </p>
            <p className="text-xs text-gray-600 leading-relaxed">
              ※カードに名義の記載がない場合は、ご本人様の氏名を入力してください。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
