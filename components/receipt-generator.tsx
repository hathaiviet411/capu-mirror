"use client"

import { X, ChevronDown } from "lucide-react"
import { useState } from "react"

interface ReceiptGenerationScreenProps {
  onClose: () => void
  transactionData: {
    date: string
    amount: string
    type: string
  }
}

export default function ReceiptGenerationScreen({ onClose, transactionData }: ReceiptGenerationScreenProps) {
  const [formData, setFormData] = useState({
    recipientName: "",
    description: "pato利用料",
    email: "",
  })

  const [showDescriptionDropdown, setShowDescriptionDropdown] = useState(false)

  const descriptionOptions = ["pato利用料", "ポイント購入代", "サービス利用料", "その他"]

  const handleGenerate = () => {
    // Generate receipt logic here
    console.log("Receipt generated:", formData)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-white w-full md:max-w-sm mx-auto flex flex-col">
      {/* Header */}
      <div className="bg-gold-pink-gradient px-4 py-4 h-16 flex items-center justify-between fixed top-0 left-1/2 transform -translate-x-1/2 w-full md:max-w-sm z-10 shadow-lg">
        <button onClick={onClose}>
          <X className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-base font-medium text-white">領収書を発行する</h1>
        <button onClick={handleGenerate} className="text-base font-medium text-white">
          発行
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 mt-[64px] bg-gray-100 p-4">
        <div className="space-y-6">
          {/* Recipient Name */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-black">宛名</label>
              <span className="text-xs text-blue-500">任意</span>
            </div>
            <input
              type="text"
              value={formData.recipientName}
              onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
              className="w-full p-4 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder=""
            />
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-black">但し書き</label>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowDescriptionDropdown(!showDescriptionDropdown)}
                className="w-full p-4 bg-white border border-gray-200 rounded-lg text-sm text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <span>{formData.description}</span>
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </button>

              {showDescriptionDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  {descriptionOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setFormData({ ...formData, description: option })
                        setShowDescriptionDropdown(false)
                      }}
                      className="w-full p-4 text-left text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Email Address */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-black">メールアドレス</label>
              <span className="text-xs text-blue-500">任意</span>
            </div>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full p-4 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder=""
            />
          </div>

          {/* Information Text */}
          <div className="space-y-3 pt-4">
            <p className="text-xs text-gray-600 leading-relaxed">領収書はポイント利用毎に発行ができます。</p>
            <p className="text-xs text-gray-600 leading-relaxed">
              メールアドレスを入力すると領収書のリンクが届きます。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
