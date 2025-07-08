"use client"

import { useState } from "react"
import { X } from "lucide-react"

interface SimpleProfileTagModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (selectedTags: string[]) => void
  initialTags?: string[]
}

export default function SimpleProfileTagModal({ isOpen, onClose, onSave, initialTags = [] }: SimpleProfileTagModalProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>(initialTags)

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  const handleSave = () => {
    onSave(selectedTags)
    onClose()
  }

  const tagCategories = [
    {
      title: "性格",
      tags: ["明るい", "優しい", "面白い", "真面目", "穏やか", "積極的", "思いやりがある", "ポジティブ", "聞き上手", "話し上手"],
    },
    {
      title: "趣味",
      tags: ["映画鑑賞", "音楽鑑賞", "読書", "ゲーム", "アニメ", "旅行", "ドライブ", "写真撮影", "料理", "グルメ巡り", "カフェ巡り", "ショッピング"],
    },
    {
      title: "スポーツ・運動",
      tags: ["筋トレ", "ランニング", "サイクリング", "登山", "釣り", "ゴルフ", "野球", "サッカー", "バスケ", "テニス", "ヨガ", "ダンス"],
    },
    {
      title: "創作・芸術",
      tags: ["楽器演奏", "歌", "絵画", "書道", "写真", "DIY", "ハンドメイド", "デザイン", "プログラミング", "ブログ執筆"],
    },
    {
      title: "ライフスタイル",
      tags: ["夜型", "朝型", "インドア派", "アウトドア派", "家族思い", "ペット好き", "健康志向", "おしゃれ好き", "節約上手", "新しいもの好き"],
    },
    {
      title: "コミュニケーション",
      tags: ["聞き上手", "話し上手", "共感力がある", "相談に乗るのが得意", "励ますのが得意", "ユーモアがある", "落ち着いている", "エネルギッシュ"],
    },
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-white w-full md:max-w-sm mx-auto flex flex-col">
      {/* Header */}
      <div className="bg-main-navy-gradient px-4 py-4 h-16 flex items-center justify-between border-b shadow-lg">
        <div className="flex items-center gap-3">
          <button onClick={onClose}>
            <X className="w-5 h-5 text-white" />
          </button>
          <span className="text-base font-medium text-white">簡単プロフィール</span>
        </div>
        <button 
          onClick={handleSave}
          className="text-sm text-white font-medium"
        >
          保存
        </button>
      </div>

      {/* Selected Tags Summary */}
      {selectedTags.length > 0 && (
        <div className="p-4 bg-gray-50 border-b">
          <p className="text-xs text-gray-600 mb-2">選択中 ({selectedTags.length}個)</p>
          <div className="flex flex-wrap gap-1">
            {selectedTags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 text-xs bg-main-navy-gradient text-white rounded-md"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-20">
        {tagCategories.map((category) => (
          <div key={category.title} className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">{category.title}</h3>
            <div className="flex flex-wrap gap-2">
              {category.tags.map((tag) => (
                <button
                  key={`${category.title}-${tag}`}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                    selectedTags.includes(tag)
                      ? "bg-main-navy-gradient text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 