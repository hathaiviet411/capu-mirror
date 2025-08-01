"use client"


import Image from "next/image"
import BasicInfoScreen from "@/components/basic-info-screen"
import FieldEditScreen from "@/components/field-edit-screen"
import ProfilePreviewScreen from "@/components/profile-preview-screen"
import SimpleProfileTagModal from "@/components/simple-profile-tag-modal"

import { useState, useRef, useEffect, useMemo } from "react"
import { ArrowLeft, ChevronRight, Plus, Loader2, Save } from "lucide-react"
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
  
  const { data: userDetails, isLoading: isLoadingUser } = api.guest.getUserById.useQuery(
    { userId: session?.user?.id || "" },
    { enabled: !!session?.user?.id }
  )
  
  const [formData, setFormData] = useState({
    aliasName: "",
    quote: "",
    simpleProfile: "",
    simpleProfileTags: [] as string[],
    selfIntroduction: "",
  })

  const [basicInfo, setBasicInfo] = useState({
    height: "",
    residence: "",
    birthplace: "",
    education: "",
    occupation: "",
    drinkingLevel: "",
    smokingLevel: "",
    cohabitant: "",
    siblings: "",
    birthDate: "",
  })

  const [images, setImages] = useState<string[]>([])
  const [hasChanges, setHasChanges] = useState(false)

  // Update form data when user details are loaded
  useEffect(() => {
    if (userDetails) {
      console.log("====================================================================================");
      console.log("userDetails", userDetails);
      console.log("====================================================================================");
      
      setFormData({
        aliasName: userDetails.aliasName || "",
        quote: userDetails.quote || "",
        simpleProfile: "",
        simpleProfileTags: userDetails.userTags?.map(tag => tag.name) || [],
        selfIntroduction: userDetails.selfIntro || "",
      })

      setBasicInfo({
        height: `${userDetails.height || 0}cm` || "未選択",
        residence: userDetails.residence || "未選択",
        birthplace: userDetails.birthplace || "未選択",
        education: userDetails.education || "未選択",
        occupation: userDetails.occupation || "未選択",
        drinkingLevel: userDetails.drinkingLevel || "未選択",
        smokingLevel: userDetails.smokingLevel || "未選択",
        cohabitant: userDetails.cohabitant || "未選択",
        siblings: userDetails.siblings || "未選択",
        birthDate: userDetails.birthDate ? new Date(userDetails.birthDate).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' }) : "未選択",
      })

      if (userDetails.additionalImages) {
        setImages(userDetails.additionalImages)
      }
    }
  }, [userDetails])

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
        basicInfo={{
          height: basicInfo.height,
          residence: basicInfo.residence,
          birthplace: basicInfo.birthplace,
          education: basicInfo.education,
          occupation: basicInfo.occupation,
          drinkingLevel: basicInfo.drinkingLevel,
          smokingLevel: basicInfo.smokingLevel,
          cohabitant: basicInfo.cohabitant,
          siblings: basicInfo.siblings,
          birthDate: basicInfo.birthDate,
        }}
        images={images}
      />
    )
  }

  if (showBasicInfo) {
    return (
      <BasicInfoScreen 
        onBack={() => setShowBasicInfo(false)} 
        basicInfo={basicInfo}
        onSave={(updatedBasicInfo) => {
          setBasicInfo(updatedBasicInfo)
          setShowBasicInfo(false)
        }}
        userId={session?.user?.id || ""}
      />
    )
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
        value={formData[showFieldEdit as "aliasName"]}
        onSave={(value) => setFormData({ ...formData, [showFieldEdit]: value })}
        maxLength={config.maxLength}
        placeholder={config.placeholder}
        multiline={config.multiline}
      />
    )
  }

  if (isLoadingUser) {
    return (
      <div className="h-screen w-full md:max-w-sm mx-auto bg-gray-100 flex flex-col relative">
        <div className="bg-gold-pink-gradient px-4 py-4 h-16 flex items-center justify-between shrink-0 w-full z-10 shadow-lg">
          <div className="flex items-center gap-3">
            <button onClick={onBack}>
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-base font-medium text-white">プロフィール編集</h1>
          </div>
          <button className="text-white font-medium text-sm">
            プレビュー
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-100 pb-8">
          <div className="bg-gray-100 pt-8 pb-6 flex flex-col items-center">
            <div className="relative mb-6">
              <Skeleton className="w-48 h-48 rounded-full" />
            </div>

            <div className="flex items-center gap-2 justify-center">
              {[...Array(3)].map((_, index) => (
                <Skeleton key={index} className="w-12 h-12 rounded-full" />
              ))}
              <Skeleton className="w-12 h-12 rounded-full" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white px-4 py-4">
              <Skeleton className="h-4 w-20 mb-3" />
              <div className="flex items-center justify-between py-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="w-5 h-5 rounded" />
              </div>
            </div>

            {/* Today's Word Section */}
            <div className="bg-white px-4 py-4">
              <Skeleton className="h-4 w-24 mb-3" />
              <div className="flex items-center justify-between py-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="w-5 h-5 rounded" />
              </div>
            </div>

            {/* Simple Profile Section */}
            <div className="bg-white px-4 py-4">
              <Skeleton className="h-4 w-28 mb-3" />
              <div className="flex items-start justify-between py-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="w-5 h-5 rounded mt-1" />
              </div>
            </div>

            {/* Self Introduction Section */}
            <div className="bg-white px-4 py-4">
              <Skeleton className="h-4 w-20 mb-3" />
              <div className="flex items-center justify-between py-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="w-5 h-5 rounded" />
              </div>
            </div>

            {/* Basic Information Section */}
            <div className="bg-white px-4 py-4">
              <Skeleton className="h-4 w-20 mb-3" />
              <div className="flex items-center justify-between py-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="w-5 h-5 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
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
                  src={userDetails?.image || "/placeholder.svg?height=192&width=192"}
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
                      src={image || "/placeholder.svg?height=48&width=48"}
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
                <span className="text-sm text-black">{formData.aliasName}</span>
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
                <span className="text-sm text-black text-justify">{formData.quote}</span>
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
                <span className="text-sm text-black text-left flex-1">{formData.selfIntroduction.slice(0, 120)}...</span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Basic Information Section */}
            <div className="bg-white px-4 py-4">
              <h3 className="text-sm font-medium text-black mb-3">基本情報</h3>
              <button onClick={() => setShowBasicInfo(true)} className="w-full flex items-center justify-between py-2">
                <span className="text-sm text-black">10/10</span>
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
