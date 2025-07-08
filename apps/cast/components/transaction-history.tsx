"use client"

import { ArrowLeft, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface TransactionHistoryProps {
  onBack: () => void
}

interface Transaction {
  id: string
  date: string
  type: "work" | "gift" | "withdrawal" | "fee"
  description: string
  amount: number
  status: "completed" | "pending" | "failed"
  guestName?: string
  sessionDuration?: string
}

export default function TransactionHistory({ onBack }: TransactionHistoryProps) {
  const [selectedMonth, setSelectedMonth] = useState("2024-12")
  
  // サンプルデータ（実際の実装では API から取得）
  const transactions: Transaction[] = [
    {
      id: "1",
      date: "2024-12-15",
      type: "work",
      description: "合流報酬",
      amount: 12000,
      status: "completed",
      guestName: "田中さん",
      sessionDuration: "60分"
    },
    {
      id: "2", 
      date: "2024-12-14",
      type: "gift",
      description: "ギフト受取",
      amount: 3000,
      status: "completed",
      guestName: "佐藤さん"
    },
    {
      id: "3",
      date: "2024-12-13",
      type: "work",
      description: "合流報酬", 
      amount: 8000,
      status: "completed",
      guestName: "鈴木さん",
      sessionDuration: "45分"
    },
    {
      id: "4",
      date: "2024-12-12",
      type: "withdrawal",
      description: "引き出し",
      amount: -25000,
      status: "completed"
    },
    {
      id: "5",
      date: "2024-12-12",
      type: "fee",
      description: "引き出し手数料",
      amount: -440,
      status: "completed"
    },
    {
      id: "6",
      date: "2024-12-10",
      type: "work",
      description: "合流報酬",
      amount: 15000,
      status: "pending",
      guestName: "高橋さん",
      sessionDuration: "90分"
    },
    {
      id: "7",
      date: "2024-12-08",
      type: "gift",
      description: "ギフト受取",
      amount: 5000,
      status: "completed",
      guestName: "山田さん"
    },
    {
      id: "8",
      date: "2024-12-05",
      type: "work",
      description: "合流報酬",
      amount: 10000,
      status: "completed",
      guestName: "渡辺さん",
      sessionDuration: "60分"
    }
  ]

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ja-JP').format(Math.abs(price))
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  const getTypeIcon = (type: Transaction["type"]) => {
    switch (type) {
      case "work":
        return (
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        )
      case "gift":
        return (
          <svg className="w-4 h-4 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
            />
          </svg>
        )
      case "withdrawal":
        return (
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            />
          </svg>
        )
      case "fee":
        return (
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
            />
          </svg>
        )
    }
  }

  const getStatusBadge = (status: Transaction["status"]) => {
    switch (status) {
      case "completed":
        return (
          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
            完了
          </span>
        )
      case "pending":
        return (
          <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
            処理中
          </span>
        )
      case "failed":
        return (
          <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
            失敗
          </span>
        )
    }
  }

  const monthlyTotal = transactions
    .filter(t => t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="h-full w-full bg-gray-100 flex flex-col relative">
      {/* Header */}
      <div className="bg-main-navy-gradient px-4 py-4 h-16 flex items-center fixed top-0 left-1/2 transform -translate-x-1/2 w-full md:max-w-sm z-10 shadow-lg">
        <button onClick={onBack} className="p-1 mr-3">
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <h1 className="text-base font-medium text-white">取引履歴</h1>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto pt-[64px] bg-gray-100 content-with-safe-footer">
        {/* Month Selector */}
        <div className="bg-white p-4 mx-4 mt-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-900">対象月</span>
            </div>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="2024-12">2024年12月</option>
              <option value="2024-11">2024年11月</option>
              <option value="2024-10">2024年10月</option>
            </select>
          </div>
        </div>

        {/* Monthly Summary */}
        <div className="bg-white p-4 mx-4 mt-4 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-900 mb-2">今月の収支</h3>
          <div className="text-2xl font-bold text-black">
            {monthlyTotal >= 0 ? '+' : '-'}¥{formatPrice(monthlyTotal)}
          </div>
        </div>

        {/* Transaction List */}
        <div className="bg-white mx-4 mt-4 rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-sm font-medium text-gray-900">取引一覧</h3>
          </div>
          
          <div className="divide-y divide-gray-100">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1">
                      {getTypeIcon(transaction.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {transaction.description}
                        </span>
                        {getStatusBadge(transaction.status)}
                      </div>
                      
                      <div className="text-xs text-gray-500 space-y-0.5">
                        <div>{formatDate(transaction.date)}</div>
                        {transaction.guestName && (
                          <div>ゲスト: {transaction.guestName}</div>
                        )}
                        {transaction.sessionDuration && (
                          <div>時間: {transaction.sessionDuration}</div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-sm font-bold ${
                      transaction.amount >= 0 ? 'text-black' : 'text-red-600'
                    }`}>
                      {transaction.amount >= 0 ? '+' : '-'}¥{formatPrice(transaction.amount)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Export Options */}
        <div className="px-4 mt-4">
          <Button
            variant="outline"
            className="w-full py-3 border-gray-300 hover:bg-gray-50"
          >
            領収書をダウンロード
          </Button>
        </div>

        {/* Information */}
        <div className="bg-white p-4 mx-4 mt-4 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-900 mb-3">取引履歴について</h3>
          <div className="space-y-2 text-xs text-gray-600">
            <p>• 合流報酬は合流完了後に反映されます</p>
            <p>• ギフトは受取時に即座に反映されます</p>
            <p>• 引き出しは申請から1-3営業日で処理されます</p>
            <p>• 領収書は確定申告などにご利用いただけます</p>
          </div>
        </div>

        {/* Final Gray Spacer */}
        <div className="h-4 bg-gray-100"></div>
      </div>
    </div>
  )
} 