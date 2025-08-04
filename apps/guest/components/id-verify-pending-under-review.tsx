"use client"

import { ArrowLeft } from "lucide-react"
import { useCallback, useMemo } from "react"
import { api } from "~/utils/api"
import { useSession } from "next-auth/react"

interface IdentityVerificationPendingUnderReviewScreenProps {
  onBack: () => void
}

export default function IdentityVerificationPendingUnderReviewScreen({ onBack }: IdentityVerificationPendingUnderReviewScreenProps) {
  const { data: session } = useSession()
  
  const { data: verificationData, isLoading: isLoadingVerification } = api.user.getIdVerificationStatus.useQuery(
    undefined,
    { enabled: !!session?.user?.id }
  )

  const isPending = useMemo(() => verificationData?.status === "PENDING", [verificationData?.status])
  const isUnderReview = useMemo(() => verificationData?.status === "UNDER_REVIEW", [verificationData?.status])

  const getStatusText = useCallback(() => {
    if (isPending) {
      return {
        title: "提出完了",
        subtitle: "本人確認書類を提出しました",
        description: "審査開始までお待ちください",
        status: "提出済み"
      }
    } else if (isUnderReview) {
      return {
        title: "ご提示ありがとうございます",
        subtitle: "ただいま本人確認中です",
        description: "順次、確認作業を行っております。本人確認完了後公式LINEアカウントよりお知らせいたします。",
        status: "審査中"
      }
    }
    return {
      title: "処理中",
      subtitle: "本人確認書類を処理中です",
      description: "しばらくお待ちください",
      status: "処理中"
    }
  }, [isPending, isUnderReview])

  const statusInfo = useMemo(() => getStatusText(), [getStatusText])

  const handleBackClick = useCallback(() => {
    onBack()
  }, [onBack])

  return (
    <div className="min-h-screen w-full md:max-w-sm mx-auto bg-gray-100 flex flex-col relative">
      <div className="bg-yellow-500 px-4 py-4 h-16 flex items-center gap-3 fixed top-0 left-1/2 transform -translate-x-1/2 w-full md:max-w-sm z-10 shadow-lg">
        <button onClick={handleBackClick}>
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-base font-medium text-white">{statusInfo.status}</h1>
      </div>

      <div className="flex-1 overflow-y-auto mt-[64px] bg-gray-100 flex flex-col items-center justify-center p-4">
        <div className="mb-8">
          <svg className="w-24 h-24 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
            <circle cx="16" cy="8" r="3" stroke="currentColor" strokeWidth={1.5} fill="none" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.5 7l1 1 2-2" />
          </svg>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-lg font-medium text-black mb-2">{statusInfo.title}</h2>
          <h3 className="text-lg font-medium text-black mb-6">{statusInfo.subtitle}</h3>

          <div className="space-y-2 text-sm text-gray-600">
            {isPending ? (
              <>
                <p>本人確認書類を提出しました。</p>
                <p>審査開始までしばらくお待ちください。</p>
                <p>審査開始後は公式LINEアカウントより</p>
                <p>お知らせいたします。</p>
              </>
            ) : isUnderReview ? (
              <>
                <p>順次、確認作業を行っております。</p>
                <p>本人確認完了後公式LINEアカウントより</p>
                <p>お知らせいたします。</p>
              </>
            ) : (
              <>
                <p>処理中です。しばらくお待ちください。</p>
              </>
            )}
          </div>
        </div>

        <div className="w-full md:max-w-sm border-2 border-yellow-500 rounded-lg p-4 relative">
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gray-100 px-2">
            <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>

          <div className="pt-4">
            <h4 className="text-sm font-medium text-black text-center mb-4">お客様情報は厳重に管理しています</h4>
            <p className="text-xs text-gray-600 leading-relaxed text-center">
              提出いただいた証明書の画像は本人確認のみに使用し、それ以外の目的で使用しません。また、証明書を含むお客様からお預かりした個人情報は退会後、一定期間保管させていただいたのちに削除しています。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
