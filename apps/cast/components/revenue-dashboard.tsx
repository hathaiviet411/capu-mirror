"use client"

import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface RevenueDashboardProps {
  onBack: () => void
  onNavigateToWithdrawal: () => void
  onNavigateToHistory: () => void
}

export default function RevenueDashboard({
  onBack,
  onNavigateToWithdrawal,
  onNavigateToHistory,
}: RevenueDashboardProps) {
  // サンプルデータ（実際の実装では API から取得）
  const revenueData = {
    currentBalance: 125000,
    thisMonthEarnings: 45000,
    pendingSettlement: 30000,
    totalEarnings: 890000,
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ja-JP').format(price)
  }

  return (
    <div className="h-full w-full bg-gray-100 flex flex-col relative">
      {/* Header */}
      <div className="bg-main-navy-gradient px-4 py-4 h-16 flex items-center fixed top-0 left-1/2 transform -translate-x-1/2 w-full md:max-w-sm z-10 shadow-lg">
        <button onClick={onBack} className="p-1 mr-3">
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <h1 className="text-base font-medium text-white">収益ダッシュボード</h1>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto pt-[64px] bg-gray-100 content-with-safe-footer">
        {/* Current Balance Section */}
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
            <div className="text-3xl font-bold text-black mb-4">
              ¥{formatPrice(revenueData.currentBalance)}
            </div>
            <Button
              onClick={onNavigateToWithdrawal}
              className="w-full bg-main-navy-gradient hover:bg-main-blue text-white py-3 rounded-lg font-medium"
            >
              引き出し申請
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="px-4 mt-4 space-y-3">
          {/* This Month Earnings */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-900">今月獲得</p>
                  <p className="text-xs text-gray-600">2024年12月</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-black">
                  ¥{formatPrice(revenueData.thisMonthEarnings)}
                </p>
              </div>
            </div>
          </div>

          {/* Pending Settlement */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-900">未精算</p>
                  <p className="text-xs text-gray-600">処理中の報酬</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-black">
                  ¥{formatPrice(revenueData.pendingSettlement)}
                </p>
              </div>
            </div>
          </div>

          {/* Total Earnings */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-900">累計獲得</p>
                  <p className="text-xs text-gray-600">全期間</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-black">
                  ¥{formatPrice(revenueData.totalEarnings)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-4 mt-6">
          <Button
            onClick={onNavigateToHistory}
            variant="outline"
            className="w-full py-3 border-gray-300 hover:bg-gray-50"
          >
            取引履歴を見る
          </Button>
        </div>

        {/* Information Section */}
        <div className="bg-white p-4 mx-4 mt-4 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-900 mb-3">収益について</h3>
          <div className="space-y-2 text-xs text-gray-600">
            <p>• 収益は合流完了後に自動的に計上されます</p>
            <p>• 引き出し申請は1,000円以上から可能です</p>
            <p>• 手数料は引き出し金額に応じて異なります</p>
            <p>• 振込は平日営業日に実施されます</p>
          </div>
        </div>

        {/* Final Gray Spacer */}
        <div className="h-4 bg-gray-100"></div>
      </div>
    </div>
  )
} 