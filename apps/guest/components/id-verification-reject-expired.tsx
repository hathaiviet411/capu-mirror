"use client"

import { ArrowLeft, AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { api } from "~/utils/api"
import { useSession } from "next-auth/react"
import { Skeleton } from "@/components/ui/skeleton"

interface IdentityVerificationRejectExpiredScreenProps {
  onBack: () => void
  onResubmit: () => void
}

export default function IdentityVerificationRejectExpiredScreen({ onBack, onResubmit }: IdentityVerificationRejectExpiredScreenProps) {
  const { data: session } = useSession()
  
  const { data: verificationData, isLoading: isLoadingVerification } = api.user.getIdVerificationStatus.useQuery(
    undefined,
    { enabled: !!session?.user?.id }
  )

  const isRejected = verificationData?.status === "REJECTED"
  const isExpired = verificationData?.status === "EXPIRED"

  return (
    <div className="h-screen w-full md:max-w-sm mx-auto bg-gray-100 flex flex-col relative">
      {/* Header */}
      <div className="bg-red-500 px-4 py-4 h-16 flex items-center gap-3 w-full z-10 shadow-lg flex-shrink-0">
        <button onClick={onBack}>
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <span className="text-base font-medium text-white">
          {isRejected ? "本人確認書類が拒否されました" : "本人確認書類が期限切れです"}
        </span>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto bg-gray-100 p-4">
        {/* Error Message */}
        <div className="bg-white rounded-lg p-6 mb-4 text-center">
          <div className="mb-4">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
          </div>
          <h2 className="text-lg font-medium text-black mb-2">
            {isRejected ? "本人確認書類が拒否されました" : "本人確認書類が期限切れです"}
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            {isRejected 
              ? "提出いただいた書類の確認が完了しましたが、本人確認が拒否されました。"
              : "提出いただいた書類の有効期限が切れています。"
            }
          </p>
          <div className="bg-red-50 rounded-lg p-3">
            <p className="text-xs text-red-700">
              {isRejected 
                ? "下記の理由を確認の上、再度書類をご提出ください。"
                : "有効な書類を再度ご提出ください。"
              }
            </p>
          </div>
        </div>

        {/* Rejection Reason */}
        {isRejected && verificationData?.failureReason && (
          <div className="bg-white rounded-lg p-4 mb-4">
            <h3 className="text-sm font-medium text-black mb-3">却下理由</h3>
            <div className="bg-red-50 rounded-lg p-3">
              <p className="text-sm text-red-700 leading-relaxed">
                {verificationData.failureReason}
              </p>
            </div>
          </div>
        )}

        {/* Submitted Documents */}
        <div className="bg-white rounded-lg p-4 mb-4">
          <h3 className="text-sm font-medium text-black mb-3">提出済み書類</h3>
          
          {isLoadingVerification ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="w-full h-32 rounded-lg" />
              ))}
            </div>
          ) : verificationData?.documentUrls && verificationData.documentUrls.length > 0 ? (
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

        {/* Document Information */}
        {verificationData && (
          <div className="bg-white rounded-lg p-4 mb-4">
            <h3 className="text-sm font-medium text-black mb-3">書類情報</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">書類の種類:</span>
                <span className="text-black">
                  {verificationData.documentType === "DRIVERS_LICENSE" && "運転免許証"}
                  {verificationData.documentType === "PASSPORT" && "パスポート"}
                  {verificationData.documentType === "NATIONAL_ID" && "マイナンバーカード"}
                  {verificationData.documentType === "RESIDENCE_CARD" && "健康保険証"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">提出日:</span>
                <span className="text-black">
                  {verificationData.submittedAt ? 
                    new Date(verificationData.submittedAt).toLocaleDateString('ja-JP') : 
                    "不明"
                  }
                </span>
              </div>
              {verificationData.reviewedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">審査日:</span>
                  <span className="text-black">
                    {new Date(verificationData.reviewedAt).toLocaleDateString('ja-JP')}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-white rounded-lg p-4 mb-4">
          <h3 className="text-sm font-medium text-black mb-3">再提出について</h3>
          <div className="space-y-2 text-xs text-gray-600 leading-relaxed">
            <p>• 有効期限内の本人確認書類をアップロードしてください</p>
            <p>• 書類全体が鮮明に写っている画像をご用意ください</p>
            <p>• 表面・裏面両方が必要な場合があります</p>
            <p>• 最大3枚までアップロード可能です</p>
            {isRejected && (
              <p className="text-red-600 font-medium">• 上記の却下理由を確認の上、適切な書類をご提出ください</p>
            )}
            {isExpired && (
              <p className="text-red-600 font-medium">• 有効期限内の書類をご提出ください</p>
            )}
          </div>
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

        {/* Resubmit Button */}
        <div className="pb-4">
          <Button
            onClick={onResubmit}
            className="w-full h-12 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            書類を再提出する
          </Button>
        </div>
      </div>
    </div>
  )
} 