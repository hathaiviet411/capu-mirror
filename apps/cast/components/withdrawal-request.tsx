"use client"

import { ArrowLeft, AlertCircle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"

interface WithdrawalRequestProps {
  onBack: () => void
  onNavigateToHistory?: () => void
}

export default function WithdrawalRequest({
  onBack,
  onNavigateToHistory,
}: WithdrawalRequestProps) {
  const [amount, setAmount] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // サンプルデータ（実際の実装では API から取得）
  const accountData = {
    currentBalance: 125000,
    minWithdrawal: 1000,
    hasAccount: true,
    bankName: "三菱UFJ銀行",
    accountNumber: "****1234",
  }

  const calculateFee = (amount: number) => {
    if (amount < 10000) return 220
    if (amount < 50000) return 440
    return 660
  }

  const withdrawalAmount = parseInt(amount) || 0
  const fee = calculateFee(withdrawalAmount)
  const actualAmount = withdrawalAmount - fee

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ja-JP').format(price)
  }

  const handleSubmit = async () => {
    if (!amount || withdrawalAmount < accountData.minWithdrawal || withdrawalAmount > accountData.currentBalance) {
      return
    }

    setIsSubmitting(true)
    // API 呼び出しをシミュレート
    await new Promise(resolve => setTimeout(resolve, 2000))
    setSubmitted(true)
    setIsSubmitting(false)
  }

  if (submitted) {
    return (
      <div className="h-full w-full bg-gray-100 flex flex-col relative">
        {/* Header */}
        <div className="bg-main-navy-gradient px-4 py-4 h-16 flex items-center fixed top-0 left-1/2 transform -translate-x-1/2 w-full md:max-w-sm z-10 shadow-lg">
          <button onClick={onBack} className="p-1 mr-3">
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-base font-medium text-white">引き出し申請</h1>
        </div>

        {/* Success Content */}
        <div className="flex-1 overflow-y-auto pt-[64px] bg-gray-100 content-with-safe-footer">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="bg-white p-8 mx-4 rounded-lg shadow-sm text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">申請が完了しました</h2>
              <p className="text-sm text-gray-600 mb-4">
                引き出し申請を受け付けました。<br />
                平日営業日に順次処理いたします。
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="text-sm text-gray-600 space-y-2">
                  <div className="flex justify-between">
                    <span>申請金額</span>
                    <span>¥{formatPrice(withdrawalAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>手数料</span>
                    <span>¥{formatPrice(fee)}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-bold">
                      <span>振込予定金額</span>
                      <span>¥{formatPrice(actualAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <Button
                  onClick={onBack}
                  className="w-full bg-main-navy-gradient hover:bg-main-blue text-white py-3 rounded-lg font-medium"
                >
                  完了
                </Button>
                {onNavigateToHistory && (
                  <Button
                    onClick={onNavigateToHistory}
                    variant="outline"
                    className="w-full py-3 border-gray-300 hover:bg-gray-50"
                  >
                    取引履歴を確認
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full bg-gray-100 flex flex-col relative">
      {/* Header */}
      <div className="bg-main-navy-gradient px-4 py-4 h-16 flex items-center fixed top-0 left-1/2 transform -translate-x-1/2 w-full md:max-w-sm z-10 shadow-lg">
        <button onClick={onBack} className="p-1 mr-3">
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <h1 className="text-base font-medium text-white">引き出し申請</h1>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto pt-[64px] bg-gray-100 content-with-safe-footer">
        {/* Current Balance */}
        <div className="bg-white p-6 mx-4 mt-4 rounded-lg shadow-sm">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
              <span className="text-sm text-gray-600">現在の残高</span>
            </div>
            <div className="text-3xl font-bold text-black">
              ¥{formatPrice(accountData.currentBalance)}
            </div>
          </div>
        </div>

        {/* Bank Account Info */}
        {accountData.hasAccount ? (
          <div className="bg-white p-4 mx-4 mt-4 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-900 mb-3">振込先口座</h3>
            <div>
              <p className="text-sm text-gray-900">{accountData.bankName}</p>
              <p className="text-xs text-gray-600">普通 {accountData.accountNumber}</p>
            </div>
          </div>
        ) : (
          <div className="bg-white p-4 mx-4 mt-4 rounded-lg shadow-sm">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">口座情報が未設定です</p>
                <p className="text-xs text-gray-600">サポートにお問い合わせください</p>
              </div>
            </div>
          </div>
        )}

        {/* Withdrawal Form */}
        {accountData.hasAccount && (
          <div className="bg-white p-4 mx-4 mt-4 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-900 mb-4">引き出し金額</h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="amount" className="text-sm text-gray-700">
                  金額 (¥)
                </Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="1000"
                  className="mt-1"
                  min={accountData.minWithdrawal}
                  max={accountData.currentBalance}
                />
                <p className="text-xs text-gray-500 mt-1">
                  最低引き出し金額：¥{formatPrice(accountData.minWithdrawal)}
                </p>
              </div>

              {/* Fee Calculation */}
              {withdrawalAmount >= accountData.minWithdrawal && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">手数料計算</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>引き出し申請金額</span>
                      <span>¥{formatPrice(withdrawalAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>手数料</span>
                      <span>¥{formatPrice(fee)}</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-medium text-gray-900">
                        <span>実際の振込金額</span>
                        <span>¥{formatPrice(actualAmount)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Messages */}
              {amount && withdrawalAmount < accountData.minWithdrawal && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span>最低引き出し金額は¥{formatPrice(accountData.minWithdrawal)}です</span>
                </div>
              )}

              {amount && withdrawalAmount > accountData.currentBalance && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span>残高が不足しています</span>
                </div>
              )}

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                disabled={
                  !amount ||
                  withdrawalAmount < accountData.minWithdrawal ||
                  withdrawalAmount > accountData.currentBalance ||
                  isSubmitting
                }
                className="w-full bg-main-navy-gradient hover:bg-main-blue text-white py-3 rounded-lg font-medium disabled:opacity-50"
              >
                {isSubmitting ? "申請中..." : "引き出し申請"}
              </Button>
            </div>
          </div>
        )}

        {/* Fee Information */}
        <div className="bg-white p-4 mx-4 mt-4 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-900 mb-3">手数料について</h3>
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>～¥9,999</span>
              <span>¥220</span>
            </div>
            <div className="flex justify-between">
              <span>¥10,000～¥49,999</span>
              <span>¥440</span>
            </div>
            <div className="flex justify-between">
              <span>¥50,000～</span>
              <span>¥660</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            * 振込は平日営業日に実施されます<br />
            * 手数料は引き出し金額から差し引かれます
          </p>
        </div>

        {/* Final Gray Spacer */}
        <div className="h-4 bg-gray-100"></div>
      </div>
    </div>
  )
} 