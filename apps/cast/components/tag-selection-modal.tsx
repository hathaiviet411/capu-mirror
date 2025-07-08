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
      title: "体型",
      tags: ["スレンダー", "筋肉質", "ガッチリ", "ぽっちゃり"],
    },
    {
      title: "顔立ち",
      tags: ["イケメン系", "優しい系", "クール系", "ワイルド系"],
    },
    {
      title: "系統",
      tags: ["爽やか", "大人っぽい", "男らしい", "中性的", "ハーフ/ハーフ顔"],
    },
    {
      title: "髪型",
      tags: ["ショート", "ミディアム", "ロング", "坊主", "その他"],
    },
    {
      title: "職歴",
      tags: [
        "学生",
        "サラリーマン",
        "営業",
        "IT関連",
        "金融",
        "公務員",
        "医師",
        "弁護士",
        "エンジニア",
        "クリエイター",
        "モデル",
        "俳優",
        "タレント",
        "アーティスト",
        "インフルエンサー",
        "教育・インストラクター",
        "美容師",
        "スポーツ関連",
        "フリーランス",
      ],
    },
    {
      title: "楽しみ方",
      tags: ["飲める人", "わいわい", "しっとり", "カラオケ", "スポーツ観戦"],
    },
    {
      title: "趣味",
      tags: ["読書", "映画鑑賞", "音楽鑑賞", "ゲーム", "アニメ", "旅行", "ドライブ", "写真撮影", "料理・グルメ", "筋トレ", "ランニング", "サイクリング", "登山", "釣り", "ゴルフ", "野球", "サッカー", "バスケ", "テニス"],
    },
    {
      title: "特技",
      tags: ["楽器演奏", "歌", "ダンス", "マジック", "プロ級料理", "お笑い", "ものまね", "書道", "絵画", "写真技術", "プログラミング", "語学", "各種スポーツ", "マッサージ", "ゲーム実況", "DIY"],
    },
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-white w-full md:max-w-sm mx-auto flex flex-col">
      {/* Header */}
      <div className="bg-main-navy-gradient px-4 py-4 flex items-center gap-3 border-b shadow-lg">
        <button onClick={handleSave}>
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
                  key={`${category.title}-${tag}`}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                    selectedTags.includes(tag)
                      ? "bg-main-navy-gradient text-white shadow-md"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
