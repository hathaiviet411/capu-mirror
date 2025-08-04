"use client"

import { ArrowLeft, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { api } from "~/utils/api"
import { useSession } from "next-auth/react"
import { Skeleton } from "@/components/ui/skeleton"
import { useCallback, useMemo } from "react"

interface IdentityVerificationApprovedScreenProps {
  onBack: () => void
}

export default function IdentityVerificationApprovedScreen({ onBack }: IdentityVerificationApprovedScreenProps) {
  const { data: session } = useSession()
  
  const { data: verificationData, isLoading: isLoadingVerification } = api.user.getIdVerificationStatus.useQuery(
    undefined,
    { enabled: !!session?.user?.id }
  )

  const documentTypeMapping = useMemo(() => ({
    "DRIVERS_LICENSE": "運転免許証",
    "PASSPORT": "パスポート",
    "NATIONAL_ID": "マイナンバーカード",
    "RESIDENCE_CARD": "健康保険証"
  }), [])

  const hasDocuments = useMemo(() => 
    verificationData?.documentUrls && verificationData.documentUrls.length > 0,
    [verificationData?.documentUrls]
  )

  const documentTypeText = useMemo(() => {
    if (!verificationData?.documentType) return "不明"
    return documentTypeMapping[verificationData.documentType as keyof typeof documentTypeMapping] || "不明"
  }, [verificationData?.documentType, documentTypeMapping])

  const submittedDate = useMemo(() => {
    if (!verificationData?.submittedAt) return "不明"
    return new Date(verificationData.submittedAt).toLocaleDateString('ja-JP')
  }, [verificationData?.submittedAt])

  const reviewedDate = useMemo(() => {
    if (!verificationData?.reviewedAt) return "不明"
    return new Date(verificationData.reviewedAt).toLocaleDateString('ja-JP')
  }, [verificationData?.reviewedAt])

  const handleBackClick = useCallback(() => {
    onBack()
  }, [onBack])

  return (
    <div className="h-screen w-full md:max-w-sm mx-auto bg-gray-100 flex flex-col relative">
      <div className="bg-green-500 px-4 py-4 h-16 flex items-center gap-3 w-full z-10 shadow-lg flex-shrink-0">
        <button onClick={handleBackClick}>
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <span className="text-base font-medium text-white">本人確認完了</span>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-100 p-4">
        <div className="bg-white rounded-lg p-6 mb-4 text-center">
          <div className="mb-4">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          </div>
          <h2 className="text-lg font-medium text-black mb-2">本人確認が完了しました</h2>
          <p className="text-sm text-gray-600 mb-4">
            提出いただいた書類の確認が完了し、本人確認が承認されました。
          </p>
          <div className="bg-green-50 rounded-lg p-3">
            <p className="text-xs text-green-700">
              これで全ての機能をご利用いただけます。
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 mb-4">
          <h3 className="text-sm font-medium text-black mb-3">提出済み書類</h3>
          
          {isLoadingVerification ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="w-full h-32 rounded-lg" />
              ))}
            </div>
          ) : hasDocuments && verificationData ? (
            <div className="grid grid-cols-2 gap-2">
              {verificationData.documentUrls.map((url: string, index: number) => (
                <div key={index} className="relative">
                  <div className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                    <Image
                      src={url}
                      alt={`Document ${index + 1}`}
                      width={150}
                      height={150}
                      className="object-cover w-full h-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">提出書類の表示に失敗しました</p>
            </div>
          )}
        </div>

        {verificationData && (
          <div className="bg-white rounded-lg p-4 mb-4">
            <h3 className="text-sm font-medium text-black mb-3">書類情報</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">書類の種類:</span>
                <span className="text-black">{documentTypeText}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">提出日:</span>
                <span className="text-black">{submittedDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">承認日:</span>
                <span className="text-black">{reviewedDate}</span>
              </div>
            </div>
          </div>
        )}

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
      </div>
    </div>
  )
} 