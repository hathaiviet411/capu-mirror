"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X, ChevronDown } from "lucide-react"
import TagSelectionModal from "@/components/tag-selection-modal"
import AreaSelectionModal from "@/components/area-selection-modal"

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
  onSearch: (searchText: string) => void
  onFilterCountChange?: (count: number) => void
}

export default function SearchModal({ isOpen, onClose, onSearch, onFilterCountChange }: SearchModalProps) {
  const [activeTab, setActiveTab] = useState("pato")

  const [residence, setResidence] = useState("")
  const [birthplace, setBirthplace] = useState("")
  const [ageRange, setAgeRange] = useState({ min: "", max: "" })
  const [heightRange, setHeightRange] = useState({ min: "", max: "" })
  const [freeWord, setFreeWord] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const [showTagModal, setShowTagModal] = useState(false)
  const [showResidenceModal, setShowResidenceModal] = useState(false)
  const [showBirthplaceModal, setShowBirthplaceModal] = useState(false)

  // フィルター条件数を計算する関数
  const calculateFilterCount = () => {
    let count = 0
    
    if (residence) count++
    if (birthplace) count++
    if (ageRange.min || ageRange.max) count++
    if (heightRange.min || heightRange.max) count++
    if (selectedTags.length > 0) count++
    if (freeWord.trim()) count++
    
    return count
  }

  // フィルター条件が変更されるたびに親コンポーネントに通知
  useEffect(() => {
    const count = calculateFilterCount()
    onFilterCountChange?.(count)
  }, [residence, birthplace, ageRange, heightRange, selectedTags, freeWord, onFilterCountChange])

  const handleClear = () => {
    setResidence("")
    setBirthplace("")
    setAgeRange({ min: "", max: "" })
    setHeightRange({ min: "", max: "" })
    setFreeWord("")
    setSelectedTags([])
  }

  const handleSearch = () => {
    const conditions = []
    if (residence) conditions.push(`居住地:${residence}`)
    if (birthplace) conditions.push(`出身地:${birthplace}`)
    if (ageRange.min || ageRange.max) {
      conditions.push(`年齢:${ageRange.min || "18"}-${ageRange.max || "99"}歳`)
    }
    if (heightRange.min || heightRange.max) {
      conditions.push(`身長:${heightRange.min || "140"}-${heightRange.max || "200"}cm`)
    }
    if (selectedTags.length > 0) {
      conditions.push(`タグ:${selectedTags.slice(0, 2).join(",")}${selectedTags.length > 2 ? "..." : ""}`)
    }
    if (freeWord) conditions.push(freeWord)

    const searchText = conditions.length > 0 ? conditions.join(" ") : "検索してみる"
    onSearch(searchText)
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-50 bg-white w-full md:max-w-sm mx-auto flex flex-col">
        {/* Header */}
        <div className="bg-main-navy-gradient px-4 py-4 flex items-center gap-3 border-b shadow-lg">
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
                  <span className="text-sm">{residence || "未選択"}</span>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </button>
              <button
                onClick={() => setShowBirthplaceModal(true)}
                className="flex justify-between items-center py-3 border-b border-gray-100 w-full"
              >
                <span className="text-sm text-gray-600">出身地</span>
                <div className="flex items-center gap-1 text-black">
                  <span className="text-sm">{birthplace || "未選択"}</span>
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
                    className="w-12 text-center text-sm border border-gray-300 rounded px-1 py-1 focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-accent-blue"
                  />
                  <span className="text-sm text-gray-600">〜</span>
                  <input
                    type="number"
                    placeholder="99"
                    value={ageRange.max}
                    onChange={(e) => setAgeRange({ ...ageRange, max: e.target.value })}
                    className="w-12 text-center text-sm border border-gray-300 rounded px-1 py-1 focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-accent-blue"
                  />
                  <span className="text-sm text-gray-600">歳</span>
                </div>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-sm text-gray-600">身長</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="140"
                    value={heightRange.min}
                    onChange={(e) => setHeightRange({ ...heightRange, min: e.target.value })}
                    className="w-12 text-center text-sm border border-gray-300 rounded px-1 py-1 focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-accent-blue"
                  />
                  <span className="text-sm text-gray-600">〜</span>
                  <input
                    type="number"
                    placeholder="200"
                    value={heightRange.max}
                    onChange={(e) => setHeightRange({ ...heightRange, max: e.target.value })}
                    className="w-12 text-center text-sm border border-gray-300 rounded px-1 py-1 focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-accent-blue"
                  />
                  <span className="text-sm text-gray-600">cm</span>
                </div>
              </div>
            </div>
          </div>

          {/* Guest Tags */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">ゲストタグ</h3>
            <button onClick={() => setShowTagModal(true)} className="bg-gray-50 p-4 rounded-lg w-full">
              <div className="flex justify-between items-center">
                <div className="text-left">
                  {selectedTags.length === 0 && (
                    <p className="text-sm text-gray-600 mb-1">
                      体型、顔立ち、系統、髪型、性格、趣味、特技などゲストの詳細タグから検索できます
                    </p>
                  )}
                  {selectedTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedTags.slice(0, 3).map((tag) => (
                        <span key={tag} className="bg-main-blue/10 text-main-blue text-xs px-2 py-1 rounded">
                          {tag}
                        </span>
                      ))}
                      {selectedTags.length > 3 && (
                        <span className="text-xs text-gray-500">+{selectedTags.length - 3}個</span>
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
              ゲストの名前、プロフィール文、趣味・特技などから検索できます
            </p>
            <textarea
              placeholder="フリーワードを入力してください"
              value={freeWord}
              onChange={(e) => setFreeWord(e.target.value)}
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-accent-blue resize-none"
            />
          </div>
        </div>

        {/* Fixed Bottom Button */}
        <div className="bg-white border-t p-4">
          <Button
            onClick={handleSearch}
            className="w-full h-12 bg-main-navy-gradient hover:bg-main-navy-gradient text-white text-base font-medium rounded-lg"
          >
            この条件で検索する
          </Button>
        </div>
      </div>

      {/* Tag Selection Modal */}
      <TagSelectionModal
        isOpen={showTagModal}
        onClose={() => setShowTagModal(false)}
        onSave={setSelectedTags}
        initialTags={selectedTags}
      />

      {/* Area Selection Modals */}
      <AreaSelectionModal
        isOpen={showResidenceModal}
        onClose={() => setShowResidenceModal(false)}
        onSave={setResidence}
        title="居住地を選択"
        initialArea={residence}
      />
      <AreaSelectionModal
        isOpen={showBirthplaceModal}
        onClose={() => setShowBirthplaceModal(false)}
        onSave={setBirthplace}
        title="出身地を選択"
        initialArea={birthplace}
      />
    </>
  )
}
