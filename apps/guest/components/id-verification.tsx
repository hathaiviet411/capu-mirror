"use client"

import type React from "react"

import { ArrowLeft, Upload, X, ChevronDown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { api } from "~/utils/api"
import { useToast } from "@/components/ui/use-toast"
import { useSession } from "next-auth/react"

interface IdentityVerificationScreenProps {
  onBack: () => void
  onSubmit: () => void
}

// Document type mapping from Japanese to database enum
const documentTypeMapping = {
  "運転免許証": "DRIVERS_LICENSE",
  "パスポート": "PASSPORT", 
  "マイナンバーカード": "NATIONAL_ID",
  "健康保険証": "RESIDENCE_CARD",
  "住民基本台帳カード": "RESIDENCE_CARD"
} as const

type DocumentTypeKey = keyof typeof documentTypeMapping

export default function IdentityVerificationScreen({ onBack, onSubmit }: IdentityVerificationScreenProps) {
  const { data: session } = useSession()
  const [uploadedFiles, setUploadedFiles] = useState<Array<{
    id: string
    file: File
    preview: string
    uploadUrl?: string
    isUploading: boolean
    uploadError?: string
  }>>([])
  const [documentType, setDocumentType] = useState<DocumentTypeKey>("運転免許証")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showDocumentTypeModal, setShowDocumentTypeModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const documentTypes: DocumentTypeKey[] = ["運転免許証", "パスポート", "マイナンバーカード", "健康保険証", "住民基本台帳カード"]

  // Reverse mapping from database enum to Japanese
  const reverseDocumentTypeMapping = {
    "DRIVERS_LICENSE": "運転免許証",
    "PASSPORT": "パスポート",
    "NATIONAL_ID": "マイナンバーカード", 
    "RESIDENCE_CARD": "健康保険証"
  } as const

  // File upload mutations
  const submitVerificationMutation = api.user.submitIdVerification.useMutation()
  const resubmitVerificationMutation = api.user.resubmitIdVerification.useMutation()
  
  // Get existing verification data
  const { data: existingVerification, isLoading: isLoadingVerification } = api.user.getIdVerificationStatus.useQuery(
    undefined,
    { enabled: !!session?.user?.id }
  )

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    // Prevent upload if form is disabled
    if (isFormDisabled) {
      event.preventDefault()
      return
    }

    const files = event.target.files
    if (!files) return

    const newFiles = Array.from(files).slice(0, 3 - uploadedFiles.length) // Limit to 3 total files
    
    for (const file of newFiles) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "エラー",
          description: `${file.name} は画像ファイルではありません`,
          variant: "destructive",
        })
        continue
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "エラー", 
          description: `${file.name} は5MB以下である必要があります`,
          variant: "destructive",
        })
        continue
      }

      const fileId = Math.random().toString(36).substring(7)
      const preview = URL.createObjectURL(file)
      
      const newFile = {
        id: fileId,
        file,
        preview,
        isUploading: false,
      }

      setUploadedFiles(prev => [...prev, newFile])
      
      // Upload file to storage
      await uploadFileToStorage(newFile)
    }

    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const uploadFileToStorage = async (fileData: typeof uploadedFiles[0]) => {
    try {
      setUploadedFiles(prev => 
        prev.map(f => 
          f.id === fileData.id 
            ? { ...f, isUploading: true, uploadError: undefined }
            : f
        )
      )

      // For development/testing, we'll use base64 data URLs instead of R2 storage
      // This avoids the need for R2 configuration during development
      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === fileData.id 
              ? { ...f, uploadUrl: dataUrl, isUploading: false }
              : f
          )
        )
      }
      reader.readAsDataURL(fileData.file)

    } catch (error) {
      console.error("File upload error:", error)
      setUploadedFiles(prev => 
        prev.map(f => 
          f.id === fileData.id 
            ? { ...f, isUploading: false, uploadError: "アップロードに失敗しました" }
            : f
        )
      )
      
      toast({
        title: "アップロードエラー",
        description: `${fileData.file.name} のアップロードに失敗しました`,
        variant: "destructive",
      })
    }
  }

  const removeFile = (fileId: string) => {
    // Prevent removal if form is disabled
    if (isFormDisabled) {
      return
    }

    setUploadedFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId)
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview)
      }
      return prev.filter(f => f.id !== fileId)
    })
  }

  const handleSubmit = async () => {
    if (uploadedFiles.length === 0) {
      toast({
        title: "エラー",
        description: "画像を1枚以上アップロードしてください",
        variant: "destructive",
      })
      return
    }

    // Check if all files are uploaded
    const unuploadedFiles = uploadedFiles.filter(f => !f.uploadUrl)
    if (unuploadedFiles.length > 0) {
      toast({
        title: "エラー",
        description: "すべてのファイルのアップロードが完了するまでお待ちください",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const documentUrls = uploadedFiles
        .filter(f => f.uploadUrl)
        .map(f => f.uploadUrl!) // We already checked above that all files have uploadUrl

      await submitVerificationMutation.mutateAsync({
        documentType: documentTypeMapping[documentType],
        documentUrls,
        extractedData: {
          // You can add extracted data here if needed
        },
      })

      toast({
        title: "提出完了",
        description: "本人確認書類を提出しました。審査完了までお待ちください。",
      })

      onSubmit()
    } catch (error: any) {
      console.error("Verification submission error:", error)
      toast({
        title: "提出エラー",
        description: error.message || "本人確認書類の提出に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Load existing verification data
  useEffect(() => {
    if (existingVerification && !isLoadingVerification) {
      // Set document type
      if (existingVerification.documentType) {
        const japaneseType = reverseDocumentTypeMapping[existingVerification.documentType as keyof typeof reverseDocumentTypeMapping]
        if (japaneseType) {
          setDocumentType(japaneseType)
        }
      }

      // Load existing document URLs as previews
      if (existingVerification.documentUrls && existingVerification.documentUrls.length > 0) {
        const existingFiles = existingVerification.documentUrls.map((url: string, index: number) => ({
          id: `existing-${index}`,
          file: new File([], `document-${index + 1}.jpg`), // Dummy file for existing data
          preview: url,
          uploadUrl: url,
          isUploading: false,
        }))
        setUploadedFiles(existingFiles)
      }
    }
  }, [existingVerification, isLoadingVerification])

  const canUploadMore = uploadedFiles.length < 3

  // Check if verification is under review
  const isUnderReview = existingVerification?.status === "UNDER_REVIEW"
  const isApproved = existingVerification?.status === "APPROVED"
  const isRejected = existingVerification?.status === "REJECTED"
  const isExpired = existingVerification?.status === "EXPIRED"

  // Determine if form should be disabled
  const isFormDisabled = isUnderReview || isApproved

  // Helper functions for status display
  const getStatusText = (status: string) => {
    switch (status) {
      case "PENDING":
        return "本人確認書類が未提出"
      case "UNDER_REVIEW":
        return "本人確認書類を確認中"
      case "APPROVED":
        return "本人確認書類が承認されました"
      case "REJECTED":
        return "本人確認書類が拒否されました"
      case "EXPIRED":
        return "本人確認書類が期限切れです"
      default:
        return "本人確認書類が未提出"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-red-500"
      case "UNDER_REVIEW":
        return "bg-yellow-500"
      case "APPROVED":
        return "bg-green-500"
      case "REJECTED":
        return "bg-red-500"
      case "EXPIRED":
        return "bg-orange-500"
      default:
        return "bg-red-500"
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
          
          {/* Status Information */}
          {existingVerification && (
            <div className="mb-3 p-3 rounded-lg bg-gray-50">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(existingVerification.status)}`}></div>
                <span className="text-sm font-medium text-gray-700">{getStatusText(existingVerification.status)}</span>
              </div>
              {existingVerification.status === "UNDER_REVIEW" && (
                <p className="text-xs text-gray-600">審査中です。結果をお待ちください。</p>
              )}
              {existingVerification.status === "APPROVED" && (
                <p className="text-xs text-green-600">本人確認が完了しました。</p>
              )}
              {existingVerification.status === "REJECTED" && existingVerification.failureReason && (
                <p className="text-xs text-red-600">却下理由: {existingVerification.failureReason}</p>
              )}
            </div>
          )}
          
          <div className="space-y-2 text-xs text-gray-600 leading-relaxed">
            <p>• 有効期限内の本人確認書類をアップロードしてください</p>
            <p>• 書類全体が鮮明に写っている画像をご用意ください</p>
            <p>• 表面・裏面両方が必要な場合があります</p>
            <p>• 最大3枚までアップロード可能です</p>
          </div>
        </div>

        {/* Document Type Selection */}
        <div className="bg-white rounded-lg mb-4">
          <h3 className="text-sm font-medium text-black p-4 pb-2">書類の種類</h3>
          <button
            onClick={() => !isFormDisabled && setShowDocumentTypeModal(true)}
            disabled={isFormDisabled}
            className={`w-full flex items-center justify-between p-4 border-b border-gray-100 ${
              isFormDisabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <span className={`text-sm ${isFormDisabled ? 'text-gray-500' : 'text-black'}`}>{documentType}</span>
            <div className="flex items-center gap-2">
              <ChevronDown className={`w-5 h-5 ${isFormDisabled ? 'text-gray-300' : 'text-gray-400'}`} />
            </div>
          </button>
        </div>

        {/* Upload Area */}
        <div className="bg-white rounded-lg p-4 mb-4">
          <h3 className="text-sm font-medium text-black mb-3">画像をアップロード</h3>

          {/* Upload Button */}
          {canUploadMore && !isFormDisabled && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center hover:border-gold-pink-gradient transition-colors"
            >
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-600">タップして画像を選択</span>
              <span className="text-xs text-gray-500 mt-1">JPG, PNG形式（最大5MB）</span>
              <span className="text-xs text-gray-500">残り: {3 - uploadedFiles.length}枚</span>
            </button>
          )}

          {isFormDisabled && (
            <div className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center bg-gray-50">
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-500">アップロードは無効です</span>
              <span className="text-xs text-gray-400 mt-1">審査中または承認済みのため編集できません</span>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            disabled={isFormDisabled}
            className="hidden"
          />

          {/* Uploaded Images */}
          {uploadedFiles.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-black mb-2">アップロード済み画像 ({uploadedFiles.length}/3)</h4>
              <div className="grid grid-cols-2 gap-2">
                {uploadedFiles.map((fileData) => (
                  <div key={fileData.id} className="relative">
                    <div className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                      <Image
                        src={fileData.preview}
                        alt={`Document ${fileData.id}`}
                        width={150}
                        height={150}
                        className="object-cover w-full h-full"
                      />
                      {fileData.isUploading && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <Loader2 className="w-6 h-6 text-white animate-spin" />
                        </div>
                      )}
                      {fileData.uploadError && (
                        <div className="absolute inset-0 bg-red-500 bg-opacity-75 flex items-center justify-center">
                          <span className="text-xs text-white text-center px-2">エラー</span>
                        </div>
                      )}
                    </div>
                    {!isFormDisabled && (
                      <button
                        onClick={() => removeFile(fileData.id)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    )}
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
            disabled={uploadedFiles.length === 0 || isSubmitting || submitVerificationMutation.isLoading || isFormDisabled}
            className="w-full h-12 bg-gold-pink-gradient hover:bg-gold-pink-gradient-dark disabled:bg-gray-300 text-white text-sm font-medium rounded-lg"
          >
            {isSubmitting || submitVerificationMutation.isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                提出中...
              </div>
            ) : isFormDisabled ? (
              "編集できません"
            ) : (
              "本人確認書類を提出する"
            )}
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
