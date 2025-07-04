"use client"

import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface CreditCardRegistrationScreenProps {
  onBack: () => void
}

export default function CreditCardRegistrationScreen({ onBack }: CreditCardRegistrationScreenProps) {
  const [formData, setFormData] = useState({
    cardNumber: "",
    expiryMonth: "",
    expiryYear: "",
    securityCode: "",
    cardholderName: "",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
  }

  const handleSave = () => {
    // Save credit card logic here
    console.log("Credit card saved:", formData)
    onBack()
  }

  return (
    <div className="min-h-screen w-full md:max-w-sm mx-auto bg-gray-100 flex flex-col relative">
      {/* Header */}
      <div className="bg-gold-pink-gradient px-4 py-4 h-16 flex items-center gap-3 border-b shadow-lg">
        <button onClick={onBack}>
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-base font-medium text-white">クレジットカード登録</h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 mt-[64px] bg-gray-100 p-4">
        <div className="bg-white rounded-lg p-4 space-y-6">
          {/* Card Number */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">カード番号</label>
            <input
              type="text"
              placeholder="1234 5678 9012 3456"
              value={formData.cardNumber}
              onChange={(e) => handleInputChange("cardNumber", e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-pink"
              maxLength={19}
            />
          </div>

          {/* Expiry Date */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">有効期限</label>
            <div className="flex gap-3">
              <select
                value={formData.expiryMonth}
                onChange={(e) => handleInputChange("expiryMonth", e.target.value)}
                className="flex-1 p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-pink"
              >
                <option value="">月</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={String(i + 1).padStart(2, "0")}>
                    {String(i + 1).padStart(2, "0")}
                  </option>
                ))}
              </select>
              <select
                value={formData.expiryYear}
                onChange={(e) => handleInputChange("expiryYear", e.target.value)}
                className="flex-1 p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-pink"
              >
                <option value="">年</option>
                {Array.from({ length: 10 }, (_, i) => {
                  const year = new Date().getFullYear() + i
                  return (
                    <option key={year} value={String(year).slice(-2)}>
                      {String(year).slice(-2)}
                    </option>
                  )
                })}
              </select>
            </div>
          </div>

          {/* Security Code */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">セキュリティコード</label>
            <input
              type="text"
              placeholder="123"
              value={formData.securityCode}
              onChange={(e) => handleInputChange("securityCode", e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-pink"
              maxLength={4}
            />
            <p className="text-xs text-gray-500 mt-1">カード裏面の3桁または4桁の番号</p>
          </div>

          {/* Cardholder Name */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">カード名義人</label>
            <input
              type="text"
              placeholder="TARO YAMADA"
              value={formData.cardholderName}
              onChange={(e) => handleInputChange("cardholderName", e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-pink"
            />
            <p className="text-xs text-gray-500 mt-1">カードに記載されている通りに入力してください</p>
          </div>

          {/* Security Notice */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start gap-2">
              <svg
                className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <div>
                <p className="text-xs text-blue-800 font-medium mb-1">安全な決済</p>
                <p className="text-xs text-blue-700 leading-relaxed">
                  お客様のカード情報は暗号化されて安全に保護されます。当社ではカード情報を保存せず、決済代行会社を通じて安全に処理されます。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-6">
          <Button
            onClick={handleSave}
            className="w-full h-12 bg-gold-pink-gradient hover:bg-gold-pink-gradient-dark text-white text-sm font-medium rounded-lg"
          >
            カードを登録する
          </Button>
        </div>
      </div>
    </div>
  )
}
