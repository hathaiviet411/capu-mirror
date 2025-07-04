"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface TagSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (selectedTags: string[]) => void
  initialTags?: string[]
}

export default function TagSelectionModal({ isOpen, onClose, onSave, initialTags = [] }: TagSelectionModalProps) {
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
      title: "スタイル",
      tags: ["スレンダー", "グラマー"],
    },
    {
      title: "顔立ち",
      tags: ["可愛い系", "綺麗系"],
    },
    {
      title: "系統",
      tags: ["ギャル", "清楚", "セクシー", "童顔", "ハーフ/ハーフ顔"],
    },
    {
      title: "髪型",
      tags: ["ロング", "ミディアム", "ショート", "その他"],
    },
    {
      title: "職歴",
      tags: [
        "学生",
        "OL",
        "事務・受付",
        "秘書",
        "アパレル",
        "保育士",
        "看護師",
        "接客",
        "CA",
        "クリエイター",
        "モデル",
        "アイドル",
        "タレント",
        "アナウンサー",
        "インフルエンサー",
        "教育・インストラクター",
        "美容師",
        "美容・エステ系",
        "フリーター",
      ],
    },
    {
      title: "楽しみ方",
      tags: ["飲める人", "わいわい", "しっとり", "カラオケ"],
    },
    {
      title: "対応スキル",
      tags: ["マッサージ", "料理", "ダンス", "歌", "楽器演奏", "語学", "ゲーム"],
    },
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-white w-full md:max-w-sm mx-auto flex flex-col">
      {/* Header */}
      <div className="bg-gold-pink-gradient px-4 py-4 flex items-center gap-3 border-b shadow-lg">
        <button onClick={onClose}>
          <X className="w-5 h-5 text-white" />
        </button>
        <span className="text-base font-medium text-white">タグ検索</span>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-20">
        {tagCategories.map((category) => (
          <div key={category.title} className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">{category.title}</h3>
            <div className="flex flex-wrap gap-2">
              {category.tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-2 text-sm rounded-lg border ${
                    selectedTags.includes(tag)
                      ? "bg-blue-500 text-white border-blue-500"
                      : "bg-white text-gray-700 border-gray-300"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        ))}
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
