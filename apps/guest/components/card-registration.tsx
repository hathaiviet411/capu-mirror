"use client"

import { ArrowLeft, Check, CreditCard, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { api } from "~/utils/api"
import { useToast } from "@/components/ui/use-toast"
import { useSession } from "next-auth/react"

interface CreditCardRegistrationScreenProps {
  onBack: () => void
  selectedCardData?: {
    id: string
    cardNumber: string
    expiryMonth: string
    expiryYear: string
    securityCode: string
    cardholderName: string
  } | null
}

export default function CreditCardRegistrationScreen({ onBack, selectedCardData }: CreditCardRegistrationScreenProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  
  const [formData, setFormData] = useState({
    cardNumber: "",
    expiryMonth: "",
    expiryYear: "",
    securityCode: "",
    cardholderName: "",
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [isCardNumberFocused, setIsCardNumberFocused] = useState(false)

  // Get existing payment methods
  const { data: existingPaymentMethods, isLoading: isLoadingPaymentMethods } = api.payment.getUserPaymentMethods.useQuery(
    undefined,
    { enabled: !!session?.user?.id }
  )

  // API mutation for saving payment method
  const savePaymentMethodMutation = api.payment.savePaymentMethod.useMutation({
    onSuccess: () => {
      setShowSuccessPopup(true)
      setTimeout(() => {
        setShowSuccessPopup(false)
        onBack()
      }, 2000)
    },
    onError: (error) => {
      toast({
        title: "登録エラー",
        description: error.message || "カードの登録に失敗しました",
        variant: "destructive",
      })
    },
  })

  const formatCardNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, "")
    // Add spaces every 4 digits
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim()
  }

  const maskCardNumber = (cardNumber: string) => {
    const digits = cardNumber.replace(/\D/g, "")
    if (digits.length < 8) return cardNumber
    
    const first4 = digits.slice(0, 4)
    const last4 = digits.slice(-4)
    return `${first4} **** **** ${last4}`
  }

  const validateCardNumber = (cardNumber: string) => {
    const digits = cardNumber.replace(/\D/g, "")
    if (digits.length < 13 || digits.length > 19) {
      return "カード番号は13桁から19桁で入力してください"
    }
    return ""
  }

  const validateExpiryDate = (month: string, year: string) => {
    if (!month || !year) {
      return "有効期限を選択してください"
    }
    
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth() + 1
    
    const cardYear = parseInt("20" + year)
    const cardMonth = parseInt(month)
    
    if (cardYear < currentYear || (cardYear === currentYear && cardMonth < currentMonth)) {
      return "有効期限が切れています"
    }
    
    return ""
  }

  const validateSecurityCode = (code: string) => {
    if (code.length < 3 || code.length > 4) {
      return "セキュリティコードは3桁または4桁で入力してください"
    }
    return ""
  }

  const validateCardholderName = (name: string) => {
    if (name.trim().length < 2) {
      return "カード名義人は2文字以上で入力してください"
    }
    return ""
  }

  const handleInputChange = (field: string, value: string) => {
    let processedValue = value
    
    // Format card number with spaces
    if (field === "cardNumber") {
      processedValue = formatCardNumber(value)
    }
    
    setFormData({ ...formData, [field]: processedValue })
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    // Validate card number
    const cardNumberError = validateCardNumber(formData.cardNumber)
    if (cardNumberError) newErrors.cardNumber = cardNumberError
    
    // Validate expiry date
    const expiryError = validateExpiryDate(formData.expiryMonth, formData.expiryYear)
    if (expiryError) newErrors.expiry = expiryError
    
    // Validate security code
    const securityCodeError = validateSecurityCode(formData.securityCode)
    if (securityCodeError) newErrors.securityCode = securityCodeError
    
    // Validate cardholder name
    const nameError = validateCardholderName(formData.cardholderName)
    if (nameError) newErrors.cardholderName = nameError
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) {
      toast({
        title: "入力エラー",
        description: "入力内容を確認してください",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      await savePaymentMethodMutation.mutateAsync({
        cardNumber: formData.cardNumber.replace(/\s/g, ""),
        expiryMonth: formData.expiryMonth,
        expiryYear: formData.expiryYear,
        securityCode: formData.securityCode,
        cardholderName: formData.cardholderName,
      })
    } catch (error) {
      console.error("Payment method save error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getCardType = (cardNumber: string) => {
    const digits = cardNumber.replace(/\D/g, "")
    if (digits.startsWith("4")) return "Visa"
    if (digits.startsWith("5")) return "Mastercard"
    if (digits.startsWith("34") || digits.startsWith("37")) return "American Express"
    if (digits.startsWith("6")) return "Discover"
    return ""
  }

  const cardType = getCardType(formData.cardNumber)

  // Load existing payment method data
  useEffect(() => {
    if (selectedCardData) {
      // Use selected card data from payment info screen (editing existing card)
      setFormData({
        cardNumber: selectedCardData.cardNumber,
        expiryMonth: selectedCardData.expiryMonth,
        expiryYear: selectedCardData.expiryYear,
        securityCode: selectedCardData.securityCode,
        cardholderName: selectedCardData.cardholderName,
      })
    } else {
      // Clear form for new card registration
      setFormData({
        cardNumber: "",
        expiryMonth: "",
        expiryYear: "",
        securityCode: "",
        cardholderName: "",
      })
    }
  }, [selectedCardData])

  return (
    <div className="min-h-screen w-full md:max-w-sm mx-auto bg-gray-100 flex flex-col relative">
      {/* Header */}
      <div className="bg-gold-pink-gradient px-4 py-4 h-16 flex items-center gap-3 border-b shadow-lg">
        <button onClick={onBack}>
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-base font-medium text-white">
          {selectedCardData ? "カード情報編集" : "クレジットカード登録"}
          {existingPaymentMethods && existingPaymentMethods.length > 0 && !selectedCardData && (
            <span className="text-xs font-normal ml-2">
              ({existingPaymentMethods.length}枚登録済み)
            </span>
          )}
        </h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 mt-4 bg-gray-100 p-4">
        {/* Existing Payment Methods */}
        {existingPaymentMethods && existingPaymentMethods.length > 0 && (
          <div className="bg-white rounded-lg p-4 mb-4">
            <h3 className="text-sm font-medium text-black mb-3">登録済みのカード</h3>
            <div className="space-y-3">
              {existingPaymentMethods.map((method) => (
                <div key={method.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {method.card?.brand?.toUpperCase() || "カード"} •••• {method.card?.last4}
                      </p>
                      <p className="text-xs text-gray-500">
                        有効期限: {method.card?.expMonth}/{method.card?.expYear}
                        {method.isDefault && " (デフォルト)"}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {method.isDefault ? "デフォルト" : "追加カード"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg p-4 space-y-6">
          {/* Card Number */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">カード番号</label>
            <div className="relative">
              <input
                type="text"
                placeholder="1234 5678 9012 3456"
                value={isCardNumberFocused ? formData.cardNumber : maskCardNumber(formData.cardNumber)}
                onChange={(e) => handleInputChange("cardNumber", e.target.value)}
                onFocus={() => setIsCardNumberFocused(true)}
                onBlur={() => setIsCardNumberFocused(false)}
                className={`w-full p-3 pr-12 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 ${
                  errors.cardNumber ? "border-red-500" : "border-gray-300"
                }`}
                maxLength={19}
              />
              {cardType && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <CreditCard className="w-5 h-5 text-gray-400" />
                </div>
              )}
            </div>
            {errors.cardNumber && (
              <div className="flex items-center gap-1 mt-1">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-xs text-red-500">{errors.cardNumber}</span>
              </div>
            )}
            {cardType && (
              <p className="text-xs text-gray-500 mt-1">{cardType}カード</p>
            )}
          </div>

          {/* Expiry Date */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">有効期限</label>
            <div className="flex gap-3">
              <select
                value={formData.expiryMonth}
                onChange={(e) => handleInputChange("expiryMonth", e.target.value)}
                className={`flex-1 p-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 ${
                  errors.expiry ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">月</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={String(i + 1).padStart(2, "0")}>
                    {String(i + 1).padStart(2, "0")}
                  </option>
                ))}
              </select>
              <select
                value={formData.expiryYear}
                onChange={(e) => handleInputChange("expiryYear", e.target.value)}
                className={`flex-1 p-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 ${
                  errors.expiry ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">年</option>
                {Array.from({ length: 10 }, (_, i) => {
                  const year = new Date().getFullYear() + i
                  return (
                    <option key={year} value={String(year).slice(-2)}>
                      {String(year).slice(-2)}
                    </option>
                  )
                })}
              </select>
            </div>
            {errors.expiry && (
              <div className="flex items-center gap-1 mt-1">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-xs text-red-500">{errors.expiry}</span>
              </div>
            )}
          </div>

          {/* Security Code */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">セキュリティコード</label>
            <input
              type="text"
              placeholder="123"
              value={formData.securityCode}
              onChange={(e) => handleInputChange("securityCode", e.target.value)}
              className={`w-full p-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 ${
                errors.securityCode ? "border-red-500" : "border-gray-300"
              }`}
              maxLength={4}
            />
            {errors.securityCode && (
              <div className="flex items-center gap-1 mt-1">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-xs text-red-500">{errors.securityCode}</span>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">カード裏面の3桁または4桁の番号</p>
          </div>

          {/* Cardholder Name */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">カード名義人</label>
            <input
              type="text"
              placeholder="TARO YAMADA"
              value={formData.cardholderName}
              onChange={(e) => handleInputChange("cardholderName", e.target.value)}
              className={`w-full p-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 ${
                errors.cardholderName ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.cardholderName && (
              <div className="flex items-center gap-1 mt-1">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-xs text-red-500">{errors.cardholderName}</span>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">カードに記載されている通りに入力してください</p>
          </div>

          {/* Security Notice */}
          <div className="bg-blue-50 p-4 rounded-lg">
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
                <p className="text-xs text-blue-800 font-medium mb-1">安全な決済</p>
                <p className="text-xs text-blue-700 leading-relaxed">
                  お客様のカード情報は暗号化されて安全に保護されます。当社ではカード情報を保存せず、決済代行会社を通じて安全に処理されます。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-6">
          <Button
            onClick={handleSave}
            disabled={isSubmitting || savePaymentMethodMutation.isLoading}
            className="w-full h-12 bg-gold-pink-gradient hover:bg-gold-pink-gradient-dark disabled:bg-gray-300 text-white text-sm font-medium rounded-lg"
          >
            {isSubmitting || savePaymentMethodMutation.isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                登録中...
              </div>
            ) : (
              "カードを登録する"
            )}
          </Button>
        </div>
      </div>

      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 mx-4 max-w-sm w-full shadow-xl">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">登録完了</h3>
              <p className="text-sm text-gray-600">
                クレジットカードの登録が完了しました。
              </p>
              <p className="text-sm text-gray-600 mt-2">
                お支払い時にご利用いただけます。
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
