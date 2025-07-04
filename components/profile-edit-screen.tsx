"use client"

import type React from "react"

import { ArrowLeft, ChevronRight, Plus } from "lucide-react"
import Image from "next/image"
import FieldEditScreen from "@/components/field-edit-screen"
import BasicInfoScreen from "@/components/basic-info-screen"
import ProfilePreviewScreen from "@/components/profile-preview-screen"
import { useState, useRef } from "react"

interface ProfileEditScreenProps {
  onBack: () => void
}

export default function ProfileEditScreen({ onBack }: ProfileEditScreenProps) {
  const [images, setImages] = useState([
    "/placeholder.svg?height=192&width=192",
    "/placeholder.svg?height=192&width=192",
    "/placeholder.svg?height=192&width=192",
  ])
  const [showFieldEdit, setShowFieldEdit] = useState<string | null>(null)
  const [showBasicInfo, setShowBasicInfo] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [formData, setFormData] = useState({
    nickname: "KK",
    todayWord: "今週・来週で飲みに行ける人探してます！",
    simpleProfile: "わいわい,しっとり,映画鑑賞,旅行,寿司",
    selfIntroduction:
      "はじめまして！よろしくお願いします。普段は都内で働いています。休日は映画を見たり、美味しいものを食べに行ったりするのが好きです。",
  })
  const [basicInfo, setBasicInfo] = useState({
    height: "176",
    residence: "東京都",
    birthplace: "未選択",
    education: "大学卒",
    income: "1000万〜1500万",
    job: "経営者・役員",
    alcohol: "ときどき飲む",
    tobacco: "非喫煙者の前では吸わない",
    siblings: "長男",
    cohabitation: "一人暮らし",
    birthDate: "1996年10月22日",
  })
  const [showImageOptions, setShowImageOptions] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && images.length < 4) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setImages([...images, result])
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle image change
  const handleImageChange = (index: number) => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (event) => {
          const result = event.target?.result as string
          const newImages = [...images]
          newImages[index] = result
          setImages(newImages)
        }
        reader.readAsDataURL(file)
      }
    }
    input.click()
    setShowImageOptions(null)
  }

  if (showPreview) {
    return (
      <ProfilePreviewScreen
        onBack={() => setShowPreview(false)}
        formData={formData}
        basicInfo={basicInfo}
        images={images}
      />
    )
  }

  if (showBasicInfo) {
    return <BasicInfoScreen onBack={() => setShowBasicInfo(false)} />
  }

  if (showFieldEdit) {
    const fieldConfig = {
      nickname: { title: "ニックネーム", maxLength: 20, placeholder: "ニックネームを入力" },
      todayWord: { title: "今日のひとこと", maxLength: 50, placeholder: "今日のひとことを入力" },
      simpleProfile: { title: "簡単プロフィール", maxLength: 100, placeholder: "趣味や好きなことを入力" },
      selfIntroduction: { title: "自己紹介", maxLength: 500, placeholder: "自己紹介を入力", multiline: true },
    }

    const config = fieldConfig[showFieldEdit as keyof typeof fieldConfig]

    return (
      <FieldEditScreen
        onBack={() => setShowFieldEdit(null)}
        title={config.title}
        value={formData[showFieldEdit as keyof typeof formData]}
        onSave={(value) => setFormData({ ...formData, [showFieldEdit]: value })}
        maxLength={config.maxLength}
        placeholder={config.placeholder}
        multiline={config.multiline || false}
      />
    )
  }

  return (
    <div className="min-h-screen w-full md:max-w-sm mx-auto bg-gray-100 flex flex-col relative">
      {/* Header */}
      <div className="bg-gold-pink-gradient px-4 py-4 h-16 flex items-center gap-3 fixed top-0 left-1/2 transform -translate-x-1/2 w-full md:max-w-sm z-10 shadow-lg">
        <button onClick={onBack}>
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-base font-medium text-white">プロフィール編集</h1>
      </div>

      {/* Main Content - Scrollable */}
              <div className="flex-1 overflow-y-auto mt-[64px] bg-gray-100 pb-8">
        {/* Profile Image Section */}
        <div className="bg-gray-100 pt-8 pb-6 flex flex-col items-center">
          {/* Main Profile Image */}
          <div className="relative mb-6">
            <div className="w-48 h-48 rounded-full bg-white overflow-hidden shadow-lg">
              <Image
                src="/placeholder.svg?height=192&width=192"
                alt="Profile"
                width={192}
                height={192}
                className="object-cover w-full h-full"
              />
            </div>
          </div>

          {/* Thumbnail and Add Button */}
          <div className="flex items-center gap-2 justify-center">
            {images.map((image, index) => (
              <div key={index} className="relative">
                <button
                  onClick={() => setShowImageOptions(showImageOptions === index ? null : index)}
                  className="w-12 h-12 rounded-full bg-white overflow-hidden shadow-md"
                >
                  <Image
                    src={image || "/placeholder.svg"}
                    alt={`Profile ${index + 1}`}
                    width={48}
                    height={48}
                    className="object-cover w-full h-full"
                  />
                </button>
                {showImageOptions === index && (
                  <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
                    <div className="bg-white rounded-t-2xl w-full md:max-w-sm p-6 space-y-4">
                      <button
                        onClick={() => handleImageChange(index)}
                        className="w-full py-4 text-lg font-medium text-black border-b border-gray-200"
                      >
                        変更する
                      </button>
                      <button
                        onClick={() => {
                          setImages(images.filter((_, i) => i !== index))
                          setShowImageOptions(null)
                        }}
                        className="w-full py-4 text-lg font-medium text-black border-b border-gray-200"
                      >
                        削除する
                      </button>
                      <button
                        onClick={() => setShowImageOptions(null)}
                        className="w-full py-4 text-lg font-medium text-gray-500"
                      >
                        キャンセル
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {images.length < 4 && (
              <>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-12 h-12 bg-gold-pink-gradient rounded-full flex items-center justify-center shadow-lg"
                >
                  <Plus className="w-6 h-6 text-white" />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </>
            )}
          </div>
        </div>

        {/* Form Sections */}
        <div className="space-y-4">
          {/* Nickname Section */}
          <div className="bg-white px-4 py-4">
            <h3 className="text-sm font-medium text-black mb-3">ニックネーム</h3>
            <button
              onClick={() => setShowFieldEdit("nickname")}
              className="w-full flex items-center justify-between py-2"
            >
              <span className="text-sm text-black">{formData.nickname}</span>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Today's Word Section */}
          <div className="bg-white px-4 py-4">
            <h3 className="text-sm font-medium text-black mb-3">今日のひとこと</h3>
            <button
              onClick={() => setShowFieldEdit("todayWord")}
              className="w-full flex items-center justify-between py-2"
            >
              <span className="text-sm text-black">{formData.todayWord}</span>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Simple Profile Section */}
          <div className="bg-white px-4 py-4">
            <h3 className="text-sm font-medium text-black mb-3">簡単プロフィール</h3>
            <button
              onClick={() => setShowFieldEdit("simpleProfile")}
              className="w-full flex items-center justify-between py-2"
            >
              <span className="text-sm text-black">{formData.simpleProfile}...</span>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Self Introduction Section */}
          <div className="bg-white px-4 py-4">
            <h3 className="text-sm font-medium text-black mb-3">自己紹介</h3>
            <button
              onClick={() => setShowFieldEdit("selfIntroduction")}
              className="w-full flex items-center justify-between py-2"
            >
              <span className="text-sm text-black text-left flex-1">{formData.selfIntroduction.slice(0, 30)}...</span>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Basic Information Section */}
          <div className="bg-white px-4 py-4">
            <h3 className="text-sm font-medium text-black mb-3">基本情報</h3>
            <button onClick={() => setShowBasicInfo(true)} className="w-full flex items-center justify-between py-2">
              <span className="text-sm text-black">8/11</span>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
