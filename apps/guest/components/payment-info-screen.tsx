"use client"

import { ArrowLeft, Check, CreditCard, Trash2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import CreditCardRegistrationScreen from "@/components/card-registration"
import { useState } from "react"
import { api } from "~/utils/api"
import { useSession } from "next-auth/react"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"

interface PaymentInfoScreenProps {
  onBack: () => void
}

interface SelectedCardData {
  id: string
  cardNumber: string
  expiryMonth: string
  expiryYear: string
  securityCode: string
  cardholderName: string
}

export default function PaymentInfoScreen({ onBack }: PaymentInfoScreenProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [showCreditCardRegistration, setShowCreditCardRegistration] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [paymentMethodToDelete, setPaymentMethodToDelete] = useState<string | null>(null)
  const [selectedCardData, setSelectedCardData] = useState<SelectedCardData | null>(null)

  const { data: paymentMethods, isLoading: isLoadingPaymentMethods } = api.payment.getUserPaymentMethods.useQuery(
    undefined,
    { enabled: !!session?.user?.id }
  )

  const deletePaymentMethodMutation = api.payment.deletePaymentMethod.useMutation({
    onSuccess: () => {
      toast({
        title: "削除完了",
        description: "支払い方法を削除しました",
      })
      setShowDeleteModal(false)
      setPaymentMethodToDelete(null)
    },
    onError: (error: any) => {
      toast({
        title: "削除エラー",
        description: error.message || "支払い方法の削除に失敗しました",
        variant: "destructive",
      })
    },
  })

  const handleCardSelection = (method: any) => {
    if (method.card) {
      setSelectedCardData({
        id: method.id,
        cardNumber: `**** **** **** ${method.card.last4}`,
        expiryMonth: String(method.card.expMonth).padStart(2, "0"),
        expiryYear: String(method.card.expYear).slice(-2),
        securityCode: "***",
        cardholderName: "登録済み",
      })
    }
    setShowCreditCardRegistration(true)
  }

  const handleAddNewCard = () => {
    setSelectedCardData(null) // Clear any selected card data
    setShowCreditCardRegistration(true)
  }

  if (showCreditCardRegistration) {
    return (
      <CreditCardRegistrationScreen 
        onBack={() => {
          setShowCreditCardRegistration(false)
          setSelectedCardData(null)
        }}
        selectedCardData={selectedCardData}
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
        <h1 className="text-base font-medium text-white">お支払い情報</h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto mt-[64px] bg-gray-100 pb-8">
        {/* Payment Info Section */}
        <div className="bg-white p-4 mb-4">
          <h2 className="text-sm font-medium text-black mb-4">お支払い情報</h2>

          {/* Payment Methods */}
          {isLoadingPaymentMethods ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-5 h-5 rounded" />
                    <Skeleton className="w-32 h-4 rounded" />
                  </div>
                  <Skeleton className="w-6 h-6 rounded-full" />
                </div>
              ))}
            </div>
          ) : paymentMethods && paymentMethods.length > 0 ? (
            <div className="space-y-3 mb-4">
              {paymentMethods.map((method) => (
                <div key={method.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <button 
                    onClick={() => handleCardSelection(method)}
                    className="flex items-center gap-3 flex-1 text-left hover:bg-gray-100 rounded transition-colors p-2 -m-2"
                  >
                    <CreditCard className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-black">
                        {method.card?.brand?.toUpperCase() || "カード"} •••• {method.card?.last4}
                      </p>
                      <p className="text-xs text-gray-500">
                        有効期限: {method.card?.expMonth}/{method.card?.expYear}
                        {method.isDefault && " (デフォルト)"}
                      </p>
                    </div>
                  </button>
                  <div className="flex items-center gap-2">
                    {method.isDefault && (
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <button 
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                      onClick={(e) => {
                        e.stopPropagation() // Prevent triggering the card selection
                        setPaymentMethodToDelete(method.id)
                        setShowDeleteModal(true)
                      }}
                      disabled={method.isDefault}
                    >
                      <Trash2 className={`w-4 h-4 ${method.isDefault ? 'text-gray-300' : 'text-gray-400'}`} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 mb-2">登録済みのカードがありません</p>
              <p className="text-xs text-gray-400">カードを追加して決済を簡単に</p>
            </div>
          )}

          {/* Add Payment Button */}
          <Button
            onClick={handleAddNewCard}
            className="w-full h-12 bg-gold-pink-gradient hover:bg-gold-pink-gradient-dark text-white text-sm font-medium rounded-lg mb-4"
          >
            お支払い情報を追加する
          </Button>

          {/* Information Text */}
          <div className="space-y-3">
            <p className="text-xs text-gray-600 leading-relaxed">
              ※上記でご選択いただいているカードで決済エラーとなる場合、自動的に他に登録いただいているカードで決済が行われる仕様となっております。
            </p>
            <p className="text-xs text-gray-600 leading-relaxed">
              カード情報を削除する際は、削除したいカードを左スワイプしていただければ幸いです。
            </p>
            <p className="text-xs text-gray-600 leading-relaxed">
              ※カードに名義の記載がない場合は、ご本人様の氏名を入力してください。
            </p>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 mx-4 max-w-sm w-full shadow-xl">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">カードを削除</h3>
              <p className="text-sm text-gray-600 mb-6">
                このカードを削除しますか？この操作は取り消せません。
              </p>
              <div className="flex gap-3 w-full">
                <Button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700"
                >
                  キャンセル
                </Button>
                <Button
                  onClick={() => {
                    if (paymentMethodToDelete) {
                      deletePaymentMethodMutation.mutate({ paymentMethodId: paymentMethodToDelete })
                    }
                  }}
                  disabled={deletePaymentMethodMutation.isLoading}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                >
                  {deletePaymentMethodMutation.isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      削除中...
                    </div>
                  ) : (
                    "削除する"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
