"use client"

import Image from "next/image"
import BasicInfoScreen from "@/components/basic-info-screen"
import FieldEditScreen from "@/components/field-edit-screen"
import ProfilePreviewScreen from "@/components/profile-preview-screen"
import SimpleProfileTagModal from "@/components/simple-profile-tag-modal"
import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { ArrowLeft, ChevronRight, Plus } from "lucide-react"
import { api } from "~/utils/api"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { useSession } from "next-auth/react"
import { generateR2Url } from "~/utils/fileUpload"

interface ProfileEditScreenProps {
  onBack: () => void
}

export default function ProfileEditScreen({ onBack }: ProfileEditScreenProps) {
  const { data: session } = useSession()
  const { toast } = useToast()

  const { data: userDetails, isLoading: isLoadingUser } = api.guest.getUserById.useQuery(
    { userId: session?.user?.id || "" },
    { enabled: !!session?.user?.id }
  )

  const getUploadUrlMutation = api.file.getUploadUrl.useMutation()
  const confirmUploadMutation = api.file.confirmUpload.useMutation()

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
  const [showBasicInfo, setShowBasicInfo] = useState(false)
  const [showFieldEdit, setShowFieldEdit] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [showSimpleProfileTagModal, setShowSimpleProfileTagModal] = useState(false)
  const [showImageOptions, setShowImageOptions] = useState<number | null>(null)
  const [isMainImageLoading, setIsMainImageLoading] = useState(false)
  const [loadingImageIndex, setLoadingImageIndex] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mainImageInputRef = useRef<HTMLInputElement>(null)

  const utils = api.useUtils()

  const updateUserMutation = api.guest.updateUser.useMutation({
    onSuccess: () => {
      toast({
        title: "保存完了",
        description: "画像を更新しました",
      })
      setIsMainImageLoading(false)
      setLoadingImageIndex(null)
      utils.guest.getUserById.invalidate({ userId: session?.user?.id || "" })
    },
    onError: (error) => {
      toast({
        title: "エラー",
        description: error.message,
        variant: "destructive",
      })
      setIsMainImageLoading(false)
      setLoadingImageIndex(null)
    },
  })

  const formattedBirthDate = useMemo(() => {
    if (!userDetails?.birthDate) return "未選択"
    return new Date(userDetails.birthDate).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })
  }, [userDetails?.birthDate])

  const fieldConfig = useMemo(() => ({
    aliasName: { title: "ニックネーム", maxLength: 20, placeholder: "ニックネームを入力", multiline: false },
    quote: { title: "今日のひとこと", maxLength: 50, placeholder: "今日のひとことを入力", multiline: true },
    selfIntroduction: { title: "自己紹介", maxLength: 500, placeholder: "自己紹介を入力", multiline: true },
  }), [])

  useEffect(() => {
    if (userDetails) {
      setFormData({
        aliasName: userDetails.aliasName || "",
        quote: userDetails.quote || "",
        simpleProfile: "",
        simpleProfileTags: userDetails.userTags?.map(tag => tag.name).filter((name): name is string => name !== null && name !== undefined) || [],
        selfIntroduction: userDetails.selfIntro || "",
      })

      setBasicInfo({
        height: userDetails.height || "未選択",
        residence: userDetails.residence || "未選択",
        birthplace: userDetails.birthplace || "未選択",
        education: userDetails.education || "未選択",
        occupation: userDetails.occupation || "未選択",
        drinkingLevel: userDetails.drinkingLevel || "未選択",
        smokingLevel: userDetails.smokingLevel || "未選択",
        cohabitant: userDetails.cohabitant || "未選択",
        siblings: userDetails.siblings || "未選択",
        birthDate: formattedBirthDate,
      })

      if (userDetails.additionalImages) {
        setImages(userDetails.additionalImages)
      } else {
        setImages([])
      }
    }
  }, [userDetails, formattedBirthDate])

  const uploadFileToR2 = useCallback(async (file: File): Promise<string> => {
    try {
      // Get upload URL
      const uploadUrlResult = await getUploadUrlMutation.mutateAsync({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        category: "PROFILE",
        isPublic: true,
      })

      // Upload file to R2
      const uploadResponse = await fetch(uploadUrlResult.uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      })

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`)
      }

      // Confirm upload
      await confirmUploadMutation.mutateAsync({
        fileId: uploadUrlResult.fileId,
        fileKey: uploadUrlResult.fileKey,
      })

      // Return the public URL
      return generateR2Url(uploadUrlResult.fileKey)
    } catch (error) {
      console.error("File upload failed:", error)
      throw new Error("ファイルのアップロードに失敗しました")
    }
  }, [getUploadUrlMutation, confirmUploadMutation])

  const handleMainImageChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && session?.user?.id) {
      setIsMainImageLoading(true)
      uploadFileToR2(file)
        .then((url: string) => {
          updateUserMutation.mutate({
            userId: session.user.id,
            data: {
              image: url,
            },
          })
        })
        .catch((error: Error) => {
          toast({
            title: "エラー",
            description: error.message,
            variant: "destructive",
          })
        })
        .finally(() => {
          setIsMainImageLoading(false)
        })
    }
  }, [session?.user?.id, updateUserMutation, toast, uploadFileToR2])

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && session?.user?.id) {
      if (images.length >= 5) {
        toast({
          title: "エラー",
          description: "追加画像は最大5枚までです",
          variant: "destructive",
        })
        return
      }
      
      setLoadingImageIndex(images.length)
      uploadFileToR2(file)
        .then((url: string) => {
          const newImages = [...images, url]
          updateUserMutation.mutate({
            userId: session.user.id,
            data: {
              additionalImages: newImages,
            },
          })
        })
        .catch((error: Error) => {
          toast({
            title: "エラー",
            description: error.message,
            variant: "destructive",
          })
        })
        .finally(() => {
          setLoadingImageIndex(null)
        })
    }
  }, [images, session?.user?.id, toast, updateUserMutation, uploadFileToR2])

  const handleImageChange = useCallback((index: number) => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file && session?.user?.id) {
        setLoadingImageIndex(index)
        uploadFileToR2(file)
          .then((url: string) => {
            const newImages = [...images]
            if (index < newImages.length) {
              newImages[index] = url
            } else {
              newImages.push(url)
            }
            const filteredImages = newImages.filter(img => img !== undefined && img !== null)
            updateUserMutation.mutate({
              userId: session.user.id,
              data: {
                additionalImages: filteredImages,
              },
            })
          })
          .catch((error: Error) => {
            toast({
              title: "エラー",
              description: error.message,
              variant: "destructive",
            })
          })
          .finally(() => {
            setLoadingImageIndex(null)
          })
      }
    }
    input.click()
    setShowImageOptions(null)
  }, [images, session?.user?.id, updateUserMutation, toast, uploadFileToR2])

  const handleSimpleProfileTagsSave = useCallback((selectedTags: string[]) => {
    setFormData({ ...formData, simpleProfileTags: selectedTags })
  }, [formData])

  const handlePreviewClick = useCallback(() => {
    setShowPreview(true)
  }, [])

  const handleBackFromPreview = useCallback(() => {
    setShowPreview(false)
  }, [])

  const handleBackFromBasicInfo = useCallback(() => {
    setShowBasicInfo(false)
  }, [])

  const handleBasicInfoSave = useCallback((updatedBasicInfo: typeof basicInfo) => {
    setBasicInfo(updatedBasicInfo)
    setShowBasicInfo(false)
  }, [])

  const handleBackFromFieldEdit = useCallback(() => {
    setShowFieldEdit(null)
  }, [])

  const handleFieldEditSave = useCallback((value: string) => {
    setFormData({ ...formData, [showFieldEdit!]: value })
  }, [formData, showFieldEdit])

  const handleFieldEditClick = useCallback((field: string) => {
    setShowFieldEdit(field)
  }, [])

  const handleBasicInfoClick = useCallback(() => {
    setShowBasicInfo(true)
  }, [])

  const handleSimpleProfileTagModalOpen = useCallback(() => {
    setShowSimpleProfileTagModal(true)
  }, [])

  const handleSimpleProfileTagModalClose = useCallback(() => {
    setShowSimpleProfileTagModal(false)
  }, [])

  const handleImageOptionsToggle = useCallback((index: number) => {
    setShowImageOptions(showImageOptions === index ? null : index)
  }, [showImageOptions])

  const handleMainImageOptionsToggle = useCallback(() => {
    setShowImageOptions(showImageOptions === -1 ? null : -1)
  }, [showImageOptions])

  const handleMainImageClick = useCallback(() => {
    mainImageInputRef.current?.click()
    setShowImageOptions(null)
  }, [])

  const handleAddImageClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleImageDelete = useCallback((index: number) => {
    if (session?.user?.id) {
      const newImages = images.filter((_, i) => i !== index)
      updateUserMutation.mutate({
        userId: session.user.id,
        data: {
          additionalImages: newImages,
        },
      })
    }
    setShowImageOptions(null)
  }, [images, session?.user?.id, updateUserMutation])

  const handleImageOptionsClose = useCallback(() => {
    setShowImageOptions(null)
  }, [])

  const handleImageClick = useCallback((index: number) => {
    setCurrentImageIndex(index)
  }, [])

  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  if (showPreview) {
    return (
      <ProfilePreviewScreen
        onBack={handleBackFromPreview}
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
        onBack={handleBackFromBasicInfo}
        basicInfo={basicInfo}
        onSave={handleBasicInfoSave}
        userId={session?.user?.id || ""}
      />
    )
  }

  if (showFieldEdit) {
    const config = fieldConfig[showFieldEdit as keyof typeof fieldConfig]

    return (
      <FieldEditScreen
        onBack={handleBackFromFieldEdit}
        title={config.title}
        value={formData[showFieldEdit as keyof typeof formData] as string}
        onSave={handleFieldEditSave}
        maxLength={config.maxLength}
        placeholder={config.placeholder}
        multiline={config.multiline}
        fieldType={showFieldEdit as "aliasName" | "quote" | "selfIntro"}
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

            <div className="bg-white px-4 py-4">
              <Skeleton className="h-4 w-24 mb-3" />
              <div className="flex items-center justify-between py-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="w-5 h-5 rounded" />
              </div>
            </div>

            <div className="bg-white px-4 py-4">
              <Skeleton className="h-4 w-28 mb-3" />
              <div className="flex items-start justify-between py-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="w-5 h-5 rounded mt-1" />
              </div>
            </div>

            <div className="bg-white px-4 py-4">
              <Skeleton className="h-4 w-20 mb-3" />
              <div className="flex items-center justify-between py-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="w-5 h-5 rounded" />
              </div>
            </div>

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
        <div className="bg-gold-pink-gradient px-4 py-4 h-16 flex items-center justify-between shrink-0 w-full z-10 shadow-lg">
          <div className="flex items-center gap-3">
            <button onClick={onBack}>
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-base font-medium text-white">プロフィール編集</h1>
          </div>
          <button
            onClick={handlePreviewClick}
            className="text-white font-medium text-sm"
          >
            プレビュー
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-100 pb-8">
          <div className="bg-gray-100 pt-8 pb-6 flex flex-col items-center">
            <div className="relative mb-6">
              <div className="w-48 h-48 rounded-full bg-white overflow-hidden shadow-lg relative group">
                <Image
                  src={userDetails?.image || "/placeholder.svg?height=192&width=192"}
                  alt="Profile"
                  width={192}
                  height={192}
                  className={`object-cover w-full h-full ${isMainImageLoading ? 'opacity-50' : ''}`}
                />

                {isMainImageLoading ? (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <button
                    onClick={handleMainImageOptionsToggle}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                )}
              </div>

              <input 
                ref={mainImageInputRef} 
                type="file" 
                accept="image/*" 
                onChange={handleMainImageChange} 
                className="hidden" 
              />
            </div>

            <div className="flex items-center gap-2 justify-center">
              {images.map((image, index) => (
                <div key={index} className="relative">
                  <button
                    onClick={() => handleImageOptionsToggle(index)}
                    disabled={loadingImageIndex === index}
                    className={`w-12 h-12 rounded-full bg-white overflow-hidden shadow-md relative group ${loadingImageIndex === index ? 'opacity-50' : ''}`}
                  >
                    <Image
                      src={image || "/placeholder.svg?height=48&width=48"}
                      alt={`Profile ${index + 1}`}
                      width={48}
                      height={48}
                      className="object-cover w-full h-full"
                    />
                    {loadingImageIndex === index ? (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </div>
                    )}
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
                          onClick={() => handleImageDelete(index)}
                          className="w-full py-4 text-lg font-medium text-black border-b border-gray-200"
                        >
                          削除する
                        </button>
                        <button
                          onClick={handleImageOptionsClose}
                          className="w-full py-4 text-lg font-medium text-gray-500"
                        >
                          キャンセル
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {showImageOptions === -1 && (
                <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
                  <div className="bg-white rounded-t-2xl w-full md:max-w-sm p-6 space-y-4">
                    <button
                      onClick={handleMainImageClick}
                      disabled={isMainImageLoading}
                      className={`w-full py-4 text-lg font-medium text-black border-b border-gray-200 ${isMainImageLoading ? 'opacity-50' : ''}`}
                    >
                      変更する
                    </button>
                    <button
                      onClick={handleImageOptionsClose}
                      className="w-full py-4 text-lg font-medium text-gray-500"
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              )}

              {images.length < 5 && (
                <>
                  <button
                    onClick={handleAddImageClick}
                    disabled={isMainImageLoading || loadingImageIndex !== null}
                    className={`w-12 h-12 bg-gold-pink-gradient rounded-full flex items-center justify-center shadow-lg ${(isMainImageLoading || loadingImageIndex !== null) ? 'opacity-50' : ''}`}
                  >
                    <Plus className="w-6 h-6 text-white" />
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white px-4 py-4">
              <h3 className="text-sm font-medium text-black mb-3">ニックネーム</h3>
              <button
                onClick={() => handleFieldEditClick("aliasName")}
                className="w-full flex items-center justify-between py-2"
              >
                <span className="text-sm text-black">{formData.aliasName}</span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="bg-white px-4 py-4">
              <h3 className="text-sm font-medium text-black mb-3">今日のひとこと</h3>
              <button
                onClick={() => handleFieldEditClick("quote")}
                className="w-full flex items-center justify-between py-2"
              >
                <span className="text-sm text-black text-justify">{formData.quote}</span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="bg-white px-4 py-4">
              <h3 className="text-sm font-medium text-black mb-3">簡単プロフィール</h3>
              <button
                onClick={handleSimpleProfileTagModalOpen}
                className="w-full flex items-start justify-between py-2"
              >
                <div className="flex-1 text-left">
                  {
                    formData.simpleProfileTags.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {
                          formData.simpleProfileTags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 text-xs bg-gold-pink-gradient text-white rounded-md"
                            >
                              {tag}
                            </span>
                          ))
                        }
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">タグを選択してください</span>
                    )
                  }
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 mt-1" />
              </button>
            </div>

            <div className="bg-white px-4 py-4">
              <h3 className="text-sm font-medium text-black mb-3">自己紹介</h3>
              <button
                onClick={() => handleFieldEditClick("selfIntroduction")}
                className="w-full flex items-center justify-between py-2"
              >
                <span className="text-sm text-black text-left flex-1">
                  {
                    formData.selfIntroduction.length > 120 ? (
                      formData.selfIntroduction.slice(0, 120) + "..."
                    ) : (
                      formData.selfIntroduction
                    )
                  }
                </span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="bg-white px-4 py-4">
              <h3 className="text-sm font-medium text-black mb-3">基本情報</h3>
              <button onClick={handleBasicInfoClick} className="w-full flex items-center justify-between py-2">
                <span className="text-sm text-black">10/10</span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <SimpleProfileTagModal
        isOpen={showSimpleProfileTagModal}
        onClose={handleSimpleProfileTagModalClose}
        onSave={handleSimpleProfileTagsSave}
        initialTags={formData.simpleProfileTags}
      />
    </>
  )
}
