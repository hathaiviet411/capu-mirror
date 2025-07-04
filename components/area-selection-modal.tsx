"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface AreaSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (selectedArea: string) => void
  title: string
  initialArea?: string
}

export default function AreaSelectionModal({
  isOpen,
  onClose,
  onSave,
  title,
  initialArea = "",
}: AreaSelectionModalProps) {
  const [selectedArea, setSelectedArea] = useState(initialArea)

  const handleSave = () => {
    onSave(selectedArea)
    onClose()
  }

  const areas = [
    "北海道",
    "青森県",
    "岩手県",
    "宮城県",
    "秋田県",
    "山形県",
    "福島県",
    "茨城県",
    "栃木県",
    "群馬県",
    "埼玉県",
    "千葉県",
    "東京都",
    "神奈川県",
    "新潟県",
    "富山県",
    "石川県",
    "福井県",
    "山梨県",
    "長野県",
    "岐阜県",
    "静岡県",
    "愛知県",
    "三重県",
    "滋賀県",
    "京都府",
    "大阪府",
    "兵庫県",
    "奈良県",
    "和歌山県",
    "鳥取県",
    "島根県",
    "岡山県",
    "広島県",
    "山口県",
    "徳島県",
    "香川県",
    "愛媛県",
    "高知県",
    "福岡県",
    "佐賀県",
    "長崎県",
    "熊本県",
    "大分県",
    "宮崎県",
    "鹿児島県",
    "沖縄県",
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-white w-full md:max-w-sm mx-auto flex flex-col">
      {/* Header */}
      <div className="bg-gold-pink-gradient px-4 py-4 flex items-center gap-3 border-b shadow-lg">
        <button onClick={onClose}>
          <X className="w-5 h-5 text-white" />
        </button>
        <span className="text-base font-medium text-white">{title}</span>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-20">
        <div className="space-y-2">
          {areas.map((area) => (
            <button
              key={area}
              onClick={() => setSelectedArea(area)}
              className={`w-full text-left px-4 py-3 rounded-lg border ${
                selectedArea === area
                  ? "bg-blue-500 text-white border-blue-500"
                  : "bg-white text-gray-700 border-gray-300"
              }`}
            >
              {area}
            </button>
          ))}
        </div>
      </div>

      {/* Fixed Bottom Button */}
      <div className="bg-white border-t p-4">
        <Button
          onClick={handleSave}
          className="w-full h-12 bg-gold-pink-gradient hover:bg-gold-pink-gradient-dark text-white text-base font-medium rounded-lg"
        >
          保存して戻る
        </Button>
      </div>
    </div>
  )
}
