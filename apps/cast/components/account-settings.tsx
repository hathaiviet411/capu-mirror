"use client"

import { ArrowLeft, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"

interface AccountSettingsProps {
  onBack: () => void
}

export default function AccountSettings({ onBack }: AccountSettingsProps) {
  const [accountData, setAccountData] = useState({
    bankName: "",
    branchName: "",
    accountType: "",
    accountNumber: "",
    accountHolderName: "",
    accountHolderKana: "",
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const banks = [
    "三菱UFJ銀行",
    "三井住友銀行",
    "みずほ銀行",
    "りそな銀行",
    "埼玉りそな銀行",
    "ゆうちょ銀行",
    "その他",
  ]

  const accountTypes = [
    { value: "ordinary", label: "普通" },
    { value: "current", label: "当座" },
  ]

  const handleInputChange = (field: string, value: string) => {
    setAccountData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const validateForm = () => {
    return (
      accountData.bankName &&
      accountData.branchName &&
      accountData.accountType &&
      accountData.accountNumber &&
      accountData.accountHolderName &&
      accountData.accountHolderKana
    )
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

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
          <h1 className="text-base font-medium text-white">口座設定</h1>
        </div>

        {/* Success Content */}
        <div className="flex-1 overflow-y-auto pt-[64px] bg-gray-100 content-with-safe-footer">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="bg-white p-8 mx-4 rounded-lg shadow-sm text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">設定が完了しました</h2>
              <p className="text-sm text-gray-600 mb-6">
                銀行口座の設定が完了しました。<br />
                引き出し申請が可能になりました。
              </p>
              <Button
                onClick={onBack}
                className="w-full bg-main-navy-gradient hover:bg-main-blue text-white py-3 rounded-lg font-medium"
              >
                完了
              </Button>
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
        <h1 className="text-base font-medium text-white">口座設定</h1>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto pt-[64px] bg-gray-100 content-with-safe-footer">
        {/* Information Banner */}
        <div className="bg-blue-50 border border-blue-200 p-4 mx-4 mt-4 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-blue-900">銀行口座情報の設定</p>
              <p className="text-xs text-blue-700 mt-1">
                Stripe Treasury と連携して安全に管理されます
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white p-4 mx-4 mt-4 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-900 mb-4">口座情報</h3>
          
          <div className="space-y-4">
            {/* Bank Name */}
            <div>
              <Label htmlFor="bankName" className="text-sm text-gray-700">
                銀行名 <span className="text-red-500">*</span>
              </Label>
              <Select
                value={accountData.bankName}
                onValueChange={(value) => handleInputChange("bankName", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="銀行を選択してください" />
                </SelectTrigger>
                <SelectContent>
                  {banks.map((bank) => (
                    <SelectItem key={bank} value={bank}>
                      {bank}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Branch Name */}
            <div>
              <Label htmlFor="branchName" className="text-sm text-gray-700">
                支店名 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="branchName"
                value={accountData.branchName}
                onChange={(e) => handleInputChange("branchName", e.target.value)}
                placeholder="例：新宿支店"
                className="mt-1"
              />
            </div>

            {/* Account Type */}
            <div>
              <Label htmlFor="accountType" className="text-sm text-gray-700">
                口座種別 <span className="text-red-500">*</span>
              </Label>
              <Select
                value={accountData.accountType}
                onValueChange={(value) => handleInputChange("accountType", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="口座種別を選択してください" />
                </SelectTrigger>
                <SelectContent>
                  {accountTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Account Number */}
            <div>
              <Label htmlFor="accountNumber" className="text-sm text-gray-700">
                口座番号 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="accountNumber"
                value={accountData.accountNumber}
                onChange={(e) => handleInputChange("accountNumber", e.target.value)}
                placeholder="例：1234567"
                className="mt-1"
                maxLength={8}
              />
            </div>

            {/* Account Holder Name */}
            <div>
              <Label htmlFor="accountHolderName" className="text-sm text-gray-700">
                口座名義（漢字） <span className="text-red-500">*</span>
              </Label>
              <Input
                id="accountHolderName"
                value={accountData.accountHolderName}
                onChange={(e) => handleInputChange("accountHolderName", e.target.value)}
                placeholder="例：山田太郎"
                className="mt-1"
              />
            </div>

            {/* Account Holder Kana */}
            <div>
              <Label htmlFor="accountHolderKana" className="text-sm text-gray-700">
                口座名義（カナ） <span className="text-red-500">*</span>
              </Label>
              <Input
                id="accountHolderKana"
                value={accountData.accountHolderKana}
                onChange={(e) => handleInputChange("accountHolderKana", e.target.value.toUpperCase())}
                placeholder="例：ヤマダタロウ"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                全角カタカナで入力してください
              </p>
            </div>
          </div>
        </div>

        {/* Security Information */}
        <div className="bg-white p-4 mx-4 mt-4 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-900 mb-3">セキュリティについて</h3>
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>全ての情報はSSL暗号化により保護されます</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>口座情報はStripe Treasury により安全に管理されます</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>本人確認完了後にのみ引き出しが可能です</span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="px-4 mt-6">
          <Button
            onClick={handleSubmit}
            disabled={!validateForm() || isSubmitting}
            className="w-full bg-main-navy-gradient hover:bg-main-blue text-white py-3 rounded-lg font-medium disabled:opacity-50"
          >
            {isSubmitting ? "設定中..." : "口座情報を保存"}
          </Button>
        </div>

        {/* Warning */}
        <div className="bg-yellow-50 border border-yellow-200 p-4 mx-4 mt-4 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-900">注意事項</p>
              <div className="text-xs text-yellow-700 mt-1 space-y-1">
                <p>• 口座名義は本人確認書類と一致している必要があります</p>
                <p>• 設定後の変更は運営にお問い合わせください</p>
                <p>• 他人名義の口座は使用できません</p>
              </div>
            </div>
          </div>
        </div>

        {/* Final Gray Spacer */}
        <div className="h-4 bg-gray-100"></div>
      </div>
    </div>
  )
} 