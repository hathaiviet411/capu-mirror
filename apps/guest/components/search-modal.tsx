"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { X, ChevronDown } from "lucide-react"
import TagSelectionModal from "@/components/tag-selection-modal"
import AreaSelectionModal from "@/components/area-selection-modal"
import { api } from "~/utils/api"

export interface SearchFilters {
  query?: string
  areaId?: string
  tagIds?: string[]
  minRate?: number
  maxRate?: number
  ageRange?: { min?: number; max?: number }
  heightRange?: { min?: number; max?: number }
}

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
  onSearch: (searchText: string, filters: SearchFilters) => void
  onFilterCountChange?: (count: number) => void
}

export default function SearchModal({ isOpen, onClose, onSearch, onFilterCountChange }: SearchModalProps) {
  const [activeTab, setActiveTab] = useState("pato")

  const [residenceId, setResidenceId] = useState("")
  const [residenceName, setResidenceName] = useState("")
  const [birthplaceId, setBirthplaceId] = useState("")
  const [birthplaceName, setBirthplaceName] = useState("")
  const [ageRange, setAgeRange] = useState({ min: "", max: "" })
  const [heightRange, setHeightRange] = useState({ min: "", max: "" })
  const [freeWord, setFreeWord] = useState("")
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [selectedTagNames, setSelectedTagNames] = useState<string[]>([])

  const [showTagModal, setShowTagModal] = useState(false)
  const [showResidenceModal, setShowResidenceModal] = useState(false)
  const [showBirthplaceModal, setShowBirthplaceModal] = useState(false)

  // フィルター条件数を計算する関数
  const calculateFilterCount = () => {
    let count = 0
    
    if (residenceId) count++
    if (birthplaceId) count++
    if (ageRange.min || ageRange.max) count++
    if (heightRange.min || heightRange.max) count++
    if (selectedTagIds.length > 0) count++
    if (freeWord.trim()) count++
    
    return count
  }

  // フィルター条件が変更されるたびに親コンポーネントに通知
  useEffect(() => {
    const count = calculateFilterCount()
    onFilterCountChange?.(count)
  }, [residenceId, birthplaceId, ageRange, heightRange, selectedTagIds, freeWord, onFilterCountChange])

  const handleClear = () => {
    setResidenceId("")
    setResidenceName("")
    setBirthplaceId("")
    setBirthplaceName("")
    setAgeRange({ min: "", max: "" })
    setHeightRange({ min: "", max: "" })
    setFreeWord("")
    setSelectedTagIds([])
    setSelectedTagNames([])
  }

  const handleSearch = () => {
    const conditions = []
    if (residenceName) conditions.push(`居住地:${residenceName}`)
    if (birthplaceName) conditions.push(`出身地:${birthplaceName}`)
    if (ageRange.min || ageRange.max) {
      conditions.push(`年齢:${ageRange.min || "18"}-${ageRange.max || "99"}歳`)
    }
    if (heightRange.min || heightRange.max) {
      conditions.push(`身長:${heightRange.min || "150"}-${heightRange.max || "200"}cm`)
    }
    if (selectedTagNames.length > 0) {
      conditions.push(`タグ:${selectedTagNames.slice(0, 2).join(",")}${selectedTagNames.length > 2 ? "..." : ""}`)
    }
    if (freeWord) conditions.push(freeWord)

    const searchText = conditions.length > 0 ? conditions.join(" ") : "検索してみる"
    
    // Build search filters
    const filters: SearchFilters = {
      query: freeWord || undefined,
      areaId: residenceId || undefined,
      tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
      ageRange: (ageRange.min || ageRange.max) ? {
        min: ageRange.min ? parseInt(ageRange.min) : undefined,
        max: ageRange.max ? parseInt(ageRange.max) : undefined,
      } : undefined,
      heightRange: (heightRange.min || heightRange.max) ? {
        min: heightRange.min ? parseInt(heightRange.min) : undefined,
        max: heightRange.max ? parseInt(heightRange.max) : undefined,
      } : undefined,
    }
    
    onSearch(searchText, filters)
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-50 bg-white w-full md:max-w-sm mx-auto flex flex-col">
        {/* Header */}
        <div className="bg-gold-pink-gradient px-4 py-4 flex items-center gap-3 border-b shadow-lg">
          <button onClick={onClose}>
            <X className="w-5 h-5 text-white" />
          </button>
          <span className="text-base font-medium text-white">検索条件</span>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 pb-20">
          {/* Basic Profile */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-4">基本プロフィール</h3>
            <div className="space-y-4">
              <button
                onClick={() => setShowResidenceModal(true)}
                className="flex justify-between items-center py-3 border-b border-gray-100 w-full"
              >
                <span className="text-sm text-gray-600">居住地</span>
                <div className="flex items-center gap-1 text-black">
                  <span className="text-sm">{residenceName || "未選択"}</span>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </button>
              <button
                onClick={() => setShowBirthplaceModal(true)}
                className="flex justify-between items-center py-3 border-b border-gray-100 w-full"
              >
                <span className="text-sm text-gray-600">出身地</span>
                <div className="flex items-center gap-1 text-black">
                  <span className="text-sm">{birthplaceName || "未選択"}</span>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </button>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-sm text-gray-600">年齢</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="18"
                    value={ageRange.min}
                    onChange={(e) => setAgeRange({ ...ageRange, min: e.target.value })}
                    className="w-12 text-center text-sm border border-gray-300 rounded px-1 py-1 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400"
                  />
                  <span className="text-sm text-gray-600">〜</span>
                  <input
                    type="number"
                    placeholder="99"
                    value={ageRange.max}
                    onChange={(e) => setAgeRange({ ...ageRange, max: e.target.value })}
                    className="w-12 text-center text-sm border border-gray-300 rounded px-1 py-1 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400"
                  />
                  <span className="text-sm text-gray-600">歳</span>
                </div>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-sm text-gray-600">身長</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="150"
                    value={heightRange.min}
                    onChange={(e) => setHeightRange({ ...heightRange, min: e.target.value })}
                    className="w-14 text-center text-sm border border-gray-300 rounded px-1 py-1 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400"
                  />
                  <span className="text-sm text-gray-600">〜</span>
                  <input
                    type="number"
                    placeholder="200"
                    value={heightRange.max}
                    onChange={(e) => setHeightRange({ ...heightRange, max: e.target.value })}
                    className="w-14 text-center text-sm border border-gray-300 rounded px-1 py-1 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400"
                  />
                  <span className="text-sm text-gray-600">cm</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cast Tags */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">キャストタグ</h3>
            <button onClick={() => setShowTagModal(true)} className="bg-gray-50 p-4 rounded-lg w-full">
              <div className="flex justify-between items-center">
                <div className="text-left">
                  {selectedTagNames && selectedTagNames.length === 0 && (
                    <p className="text-sm text-gray-600 mb-1">
                      体型、顔立ち、系統、髪型、職歴、楽しみ方、趣味、特技などキャストの詳細タグから検索できます
                    </p>
                  )}
                  {selectedTagNames && selectedTagNames.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedTagNames.slice(0, 3).map((tag) => (
                        <span key={tag} className="px-2 py-1 text-xs bg-gold-pink-gradient text-white rounded-md">
                          {tag}
                        </span>
                      ))}
                      {selectedTagNames.length > 3 && (
                        <span className="text-xs text-gray-500">+{selectedTagNames.length - 3}個</span>
                      )}
                    </div>
                  )}
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400 ml-2" />
              </div>
            </button>
          </div>

          {/* Free Word */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">フリーワード</h3>
            <p className="text-xs text-gray-500 mb-3">※2文字以上20文字未満</p>
            <p className="text-xs text-gray-500 mb-3">
              キャストのニックネーム、プロフィール文、趣味・特技などから検索できます
            </p>
            <textarea
              placeholder="フリーワードを入力してください"
              value={freeWord}
              onChange={(e) => setFreeWord(e.target.value)}
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 resize-none"
            />
          </div>
        </div>

        {/* Fixed Bottom Button */}
        <div className="bg-white border-t p-4 space-y-2">
          <div className="flex gap-2">
            <Button
              onClick={handleClear}
              variant="outline"
              className="flex-1 h-12 text-gray-600 border-gray-300"
            >
              クリア
            </Button>
            <Button
              onClick={handleSearch}
              className="flex-[2] h-12 bg-gold-pink-gradient hover:bg-gold-pink-gradient-dark text-white text-base font-medium rounded-lg"
            >
              この条件で検索する
            </Button>
          </div>
        </div>
      </div>

      {/* Tag Selection Modal */}
      <TagSelectionModal
        isOpen={showTagModal}
        onClose={() => setShowTagModal(false)}
        onSave={(selectedTags: string[]) => {
          setSelectedTagIds(selectedTags)
          setSelectedTagNames(selectedTags)
        }}
        initialTags={selectedTagNames}
      />

      {/* Area Selection Modals */}
      <AreaSelectionModal
        isOpen={showResidenceModal}
        onClose={() => setShowResidenceModal(false)}
        onSave={(selectedArea: string) => {
          setResidenceId(selectedArea)
          setResidenceName(selectedArea)
        }}
        title="居住地を選択"
        initialArea={residenceName}
      />
      <AreaSelectionModal
        isOpen={showBirthplaceModal}
        onClose={() => setShowBirthplaceModal(false)}
        onSave={(selectedArea: string) => {
          setBirthplaceId(selectedArea)
          setBirthplaceName(selectedArea)
        }}
        title="出身地を選択"
        initialArea={birthplaceName}
      />
    </>
  )
}
