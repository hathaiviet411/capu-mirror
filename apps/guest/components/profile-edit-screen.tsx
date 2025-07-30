"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { ArrowLeft, ChevronRight, Plus, Loader2, Save } from "lucide-react"
import Image from "next/image"
import BasicInfoScreen from "@/components/basic-info-screen"
import FieldEditScreen from "@/components/field-edit-screen"
import ProfilePreviewScreen from "@/components/profile-preview-screen"
import SimpleProfileTagModal from "@/components/simple-profile-tag-modal"
import { api } from "~/utils/api"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { useSession } from "next-auth/react"

interface ProfileEditScreenProps {
  onBack: () => void
}

export default function ProfileEditScreen({ onBack }: ProfileEditScreenProps) {
  const { data: session, status } = useSession()
  const { toast } = useToast()
  
  const [formData, setFormData] = useState({
    nickname: "",
    todayWord: "",
    simpleProfile: "",
    simpleProfileTags: [] as string[],
    selfIntroduction: "",
  })

  const [basicInfo, setBasicInfo] = useState({
    height: "158cm",
    residence: "東京都",
    birthplace: "未選択",
    education: "大学卒",
    job: "会社員",
    alcohol: "ときどき飲む",
    smoking: "吸わない",
    roommates: "一人暮らし",
    siblings: "長女",
    birthDate: "1996年4月12日",
  })

  const [images, setImages] = useState<string[]>([])
  const [hasChanges, setHasChanges] = useState(false)

  const [showBasicInfo, setShowBasicInfo] = useState(false)
  const [showFieldEdit, setShowFieldEdit] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [showSimpleProfileTagModal, setShowSimpleProfileTagModal] = useState(false)
  const [showImageOptions, setShowImageOptions] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setImages([...images, result])
      }
      reader.readAsDataURL(file)
    }
  }

  const handleImageChange = (index: number) => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const result = e.target?.result as string
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

  const handleSimpleProfileTagsSave = (selectedTags: string[]) => {
    setFormData({ ...formData, simpleProfileTags: selectedTags })
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
      nickname: { title: "ニックネーム", maxLength: 20, placeholder: "ニックネームを入力", multiline: false },
      todayWord: { title: "今日のひとこと", maxLength: 50, placeholder: "今日のひとことを入力", multiline: false },
      selfIntroduction: { title: "自己紹介", maxLength: 500, placeholder: "自己紹介を入力", multiline: true },
    }

    const config = fieldConfig[showFieldEdit as keyof typeof fieldConfig]

    return (
      <FieldEditScreen
        onBack={() => setShowFieldEdit(null)}
        title={config.title}
        value={formData[showFieldEdit as "nickname" | "todayWord" | "selfIntroduction"]}
        onSave={(value) => setFormData({ ...formData, [showFieldEdit]: value })}
        maxLength={config.maxLength}
        placeholder={config.placeholder}
        multiline={config.multiline}
      />
    )
  }

  return (
    <>
      <div className="h-screen w-full md:max-w-sm mx-auto bg-gray-100 flex flex-col relative">
        {/* Header */}
        <div className="bg-gold-pink-gradient px-4 py-4 h-16 flex items-center justify-between shrink-0 w-full z-10 shadow-lg">
          <div className="flex items-center gap-3">
            <button onClick={onBack}>
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-base font-medium text-white">プロフィール編集</h1>
          </div>
          <button 
            onClick={() => setShowPreview(true)}
            className="text-white font-medium text-sm"
          >
            プレビュー
          </button>
        </div>

        {/* Main Content - Scrollable */}
        <div className="flex-1 overflow-y-auto bg-gray-100 pb-8">
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
                onClick={() => setShowSimpleProfileTagModal(true)}
                className="w-full flex items-start justify-between py-2"
              >
                <div className="flex-1 text-left">
                  {formData.simpleProfileTags.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {formData.simpleProfileTags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 text-xs bg-gold-pink-gradient text-white rounded-md"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">タグを選択してください</span>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 mt-1" />
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
                <span className="text-sm text-black">10/11</span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Simple Profile Tag Modal */}
      <SimpleProfileTagModal
        isOpen={showSimpleProfileTagModal}
        onClose={() => setShowSimpleProfileTagModal(false)}
        onSave={handleSimpleProfileTagsSave}
        initialTags={formData.simpleProfileTags}
      />
    </>
  )
}
