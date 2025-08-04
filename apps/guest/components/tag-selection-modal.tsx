"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { api } from "~/utils/api"

interface TagSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (selectedTags: string[]) => void
  initialTags?: string[]
}

interface TagCategory {
  type: string
  title: string
  tags: { id: number; name: string }[]
}

export default function TagSelectionModal({ isOpen, onClose, onSave, initialTags = [] }: TagSelectionModalProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>(initialTags)

  // Fetch tags from API
  const { data: tagCategories, isLoading, error } = api.guest.getListTag.useQuery()

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  const handleSave = () => {
    onSave(selectedTags)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-white w-full md:max-w-sm mx-auto flex flex-col">
      {/* Header */}
      <div className="bg-gold-pink-gradient px-4 py-4 flex items-center justify-between border-b shadow-lg">
        <div className="flex items-center gap-3">
          <button onClick={onClose}>
            <X className="w-5 h-5 text-white" />
          </button>
          <span className="text-base font-medium text-white">タグ検索</span>
        </div>
        <button 
          onClick={handleSave}
          className="text-sm text-white font-medium"
        >
          保存
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-20">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">読み込み中...</div>
          </div>
        )}
        
        {error && (
          <div className="flex items-center justify-center py-8">
            <div className="text-red-500">エラーが発生しました</div>
          </div>
        )}
        
        {tagCategories && tagCategories.map((category: TagCategory) => (
          <div key={category.type} className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">{category.title}</h3>
            <div className="flex flex-wrap gap-2">
              {category.tags.map((tag) => (
                <button
                  key={`${category.type}-${tag.id}`}
                  onClick={() => toggleTag(tag.name)}
                  className={`px-3 py-2 text-sm rounded-lg ${
                    selectedTags.includes(tag.name)
                      ? "bg-gold-pink-gradient text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
