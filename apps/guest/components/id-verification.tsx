"use client"

import type React from "react"

import { ArrowLeft, Upload, X, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useRef } from "react"
import Image from "next/image"

interface IdentityVerificationScreenProps {
  onBack: () => void
  onSubmit: () => void
}

export default function IdentityVerificationScreen({ onBack, onSubmit }: IdentityVerificationScreenProps) {
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [documentType, setDocumentType] = useState("運転免許証")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showDocumentTypeModal, setShowDocumentTypeModal] = useState(false)

  const documentTypes = ["運転免許証", "パスポート", "マイナンバーカード", "健康保険証", "住民基本台帳カード"]

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          const result = e.target?.result as string
          setUploadedImages((prev) => [...prev, result])
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    if (uploadedImages.length > 0) {
      onSubmit()
    }
  }

  return (
    <div className="h-screen w-full md:max-w-sm mx-auto bg-gray-100 flex flex-col relative">
      {/* Header */}
      <div className="bg-gold-pink-gradient px-4 py-4 h-16 flex items-center gap-3 w-full z-10 shadow-lg flex-shrink-0">
        <button onClick={onBack}>
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <span className="text-base font-medium text-white">本人確認書類の撮影</span>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto bg-gray-100 p-4">
        {/* Instructions */}
        <div className="bg-white rounded-lg p-4 mb-4">
          <h2 className="text-sm font-medium text-black mb-3">本人確認書類をアップロード</h2>
          <div className="space-y-2 text-xs text-gray-600 leading-relaxed">
            <p>• 有効期限内の本人確認書類をアップロードしてください</p>
            <p>• 書類全体が鮮明に写っている画像をご用意ください</p>
            <p>• 表面・裏面両方が必要な場合があります</p>
          </div>
        </div>

        {/* Document Type Selection */}
        <div className="bg-white rounded-lg mb-4">
          <h3 className="text-sm font-medium text-black p-4 pb-2">書類の種類</h3>
          <button
            onClick={() => setShowDocumentTypeModal(true)}
            className="w-full flex items-center justify-between p-4 border-b border-gray-100"
          >
            <span className="text-sm text-black">{documentType}</span>
            <div className="flex items-center gap-2">
              <ChevronDown className="w-5 h-5 text-gray-400" />
            </div>
          </button>
        </div>

        {/* Upload Area */}
        <div className="bg-white rounded-lg p-4 mb-4">
          <h3 className="text-sm font-medium text-black mb-3">画像をアップロード</h3>

          {/* Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center hover:border-gold-pink-gradient transition-colors"
          >
            <Upload className="w-8 h-8 text-gray-400 mb-2" />
            <span className="text-sm text-gray-600">タップして画像を選択</span>
            <span className="text-xs text-gray-500 mt-1">JPG, PNG形式（最大5MB）</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Uploaded Images */}
          {uploadedImages.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-black mb-2">アップロード済み画像</h4>
              <div className="grid grid-cols-2 gap-2">
                {uploadedImages.map((image, index) => (
                  <div key={index} className="relative">
                    <div className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                      <Image
                        src={image || "/placeholder.svg"}
                        alt={`Document ${index + 1}`}
                        width={150}
                        height={150}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Privacy Notice */}
        <div className="bg-blue-50 rounded-lg p-4 mb-4">
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
              <p className="text-xs text-blue-800 font-medium mb-1">個人情報の取り扱いについて</p>
              <p className="text-xs text-blue-700 leading-relaxed">
                提出いただいた本人確認書類は、本人確認の目的のみに使用し、それ以外の目的では使用いたしません。
                また、確認完了後は適切に管理・削除いたします。
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pb-4">
          <Button
            onClick={handleSubmit}
            disabled={uploadedImages.length === 0}
            className="w-full h-12 bg-gold-pink-gradient hover:bg-gold-pink-gradient-dark disabled:bg-gray-300 text-white text-sm font-medium rounded-lg"
          >
            本人確認書類を提出する
          </Button>
        </div>
      </div>

      {/* Document Type Selection Modal */}
      {showDocumentTypeModal && (
        <div className="fixed inset-0 z-50 bg-white w-full md:max-w-sm mx-auto flex flex-col">
          {/* Header */}
          <div className="bg-gold-pink-gradient px-4 py-4 h-16 flex items-center gap-3 border-b shadow-lg flex-shrink-0">
            <button onClick={() => setShowDocumentTypeModal(false)}>
              <X className="w-5 h-5 text-white" />
            </button>
            <span className="text-base font-medium text-white">書類の種類を選択</span>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {documentTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setDocumentType(type)
                    setShowDocumentTypeModal(false)
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg ${
                    documentType === type
                      ? "bg-gold-pink-gradient text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>


        </div>
      )}
    </div>
  )
}
