"use client"

import { ArrowLeft, ChevronDown, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { api } from "~/utils/api"
import { useToast } from "@/components/ui/use-toast"

interface BasicInfoScreenProps {
  onBack: () => void
  basicInfo: {
    height: string
    residence: string
    birthplace: string
    education: string
    occupation: string
    drinkingLevel: string
    smokingLevel: string
    cohabitant: string
    siblings: string
    birthDate: string
  }
  onSave: (basicInfo: BasicInfoScreenProps['basicInfo']) => void
  userId: string
}

interface SelectionModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  options: string[]
  selectedValue: string
  onSelect: (value: string) => void
}

function SelectionModal({ isOpen, onClose, title, options, selectedValue, onSelect }: SelectionModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-white w-full md:max-w-sm mx-auto flex flex-col">
      <div className="bg-gold-pink-gradient px-4 py-4 h-16 flex items-center gap-3 border-b shadow-lg">
        <button onClick={onClose}>
          <X className="w-5 h-5 text-white" />
        </button>

        <span className="text-base font-medium text-white">{title}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-20">
        <div className="space-y-2">
          {
            options.map((option) => (
              <button
                key={option}
                onClick={() => {
                  onSelect(option)
                  onClose()
                }}
                className={`
                  w-full text-left px-4 py-3 rounded-lg
                  ${selectedValue === option ? "bg-gold-pink-gradient text-white" : "bg-gray-100 text-gray-600"}
                `}
              >
                {option}
              </button>
            ))
          }
        </div>
      </div>


    </div>
  )
}

export default function BasicInfoScreen({ onBack, basicInfo: initialBasicInfo, onSave, userId }: BasicInfoScreenProps) {
  const { toast } = useToast()
  const [basicInfo, setBasicInfo] = useState(initialBasicInfo)
  const [isSaving, setIsSaving] = useState(false)

  const [activeModal, setActiveModal] = useState<string | null>(null)

  const updateUserMutation = api.guest.updateUser.useMutation({
    onSuccess: () => {
      toast({
        title: "保存しました",
        description: "基本情報を更新しました",
        duration: 2000,
      })
      onSave(basicInfo)
      onBack()
    },
    onError: (error) => {
      toast({
        title: "エラー",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const fieldOptions = {
    height: Array.from({ length: 51 }, (_, i) => `${150 + i}`),
    residence: [
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
    ],
    birthplace: [
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
      "海外",
    ],
    education: ["中学卒", "高校卒", "専門学校卒", "短大卒", "大学卒", "大学院卒"],
    occupation: ["学生", "会社員", "公務員", "経営者・役員", "自営業", "自由業", "専門職", "パート・アルバイト", "その他"],
    drinkingLevel: ["飲まない", "ときどき飲む", "よく飲む"],
    smokingLevel: ["吸わない", "ときどき吸う", "よく吸う"],
    cohabitant: ["一人暮らし", "家族と同居", "友人・知人と同居", "恋人と同居", "その他"],
    siblings: ["一人っ子", "長女", "次女", "三女以降"],
  }

  const handleSave = () => {
    setIsSaving(true)
    
    const updateData = {
      height: basicInfo.height,
      residence: basicInfo.residence,
      education: basicInfo.education,
      occupation: basicInfo.occupation,
      drinkingLevel: basicInfo.drinkingLevel,
      siblings: basicInfo.siblings,
      birthplace: basicInfo.birthplace,
      cohabitant: basicInfo.cohabitant,
      smokingLevel: basicInfo.smokingLevel,
    }

    updateUserMutation.mutate({
      userId: userId,
      data: updateData
    })
  }

  const handleFieldSelect = (field: string, value: string) => {
    setBasicInfo({ ...basicInfo, [field]: value })
  }

  const getFieldTitle = (field: string): string => {
    const fieldTitles: Record<string, string> = {
      height: "身長",
      residence: "居住地", 
      birthplace: "出身地",
      education: "学歴",
      occupation: "お仕事",
      drinkingLevel: "お酒",
      smokingLevel: "タバコ",
      cohabitant: "同居人",
      siblings: "兄弟姉妹",
    }
    
    return fieldTitles[field] || ""
  }

  return (
    <>
      <div className="min-h-screen w-full md:max-w-sm mx-auto bg-gray-100 flex flex-col relative">
        <div className="bg-gold-pink-gradient px-4 py-4 h-16 flex items-center justify-between fixed top-0 left-1/2 transform -translate-x-1/2 w-full md:max-w-sm z-10 shadow-lg">
          <div className="flex items-center gap-3">
            <button onClick={onBack}>
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-base font-medium text-white">基本情報</h1>
          </div>
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="text-sm text-white font-medium disabled:opacity-50"
          >
            {isSaving ? "保存中..." : "保存"}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto mt-[64px] bg-gray-100 pb-8">
          <div className="bg-white">
            <button
              onClick={() => setActiveModal("height")}
              className="w-full flex items-center justify-between p-4 border-b border-gray-100"
            >
              <span className="text-sm text-black">身長</span>
              <div className="flex items-center gap-2">
                {
                  !basicInfo.height ? (
                    <>
                      <span className="text-sm text-gray-300">未選択</span>
                      <ChevronDown className="w-5 h-5 text-gray-300" />
                    </>
                  ) : (
                    <>
                      <span className="text-sm text-black">{basicInfo.height}</span>
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    </>
                  )
                }
              </div>
            </button>

            <button
              onClick={() => setActiveModal("residence")}
              className="w-full flex items-center justify-between p-4 border-b border-gray-100"
            >
              <span className="text-sm text-black">居住地</span>
              <div className="flex items-center gap-2">
                {
                  !basicInfo.residence ? (
                    <>
                      <span className="text-sm text-gray-300">未選択</span>
                      <ChevronDown className="w-5 h-5 text-gray-300" />
                    </>
                  ) : (
                    <>
                      <span className="text-sm text-black">{basicInfo.residence}</span>
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    </>
                  )
                }
              </div>
            </button>

            <button
              onClick={() => setActiveModal("birthplace")}
              className="w-full flex items-center justify-between p-4 border-b border-gray-100"
            >
              <span className="text-sm text-black">出身地</span>
              <div className="flex items-center gap-2">
                {
                  !basicInfo.birthplace ? (
                    <>
                      <span className="text-sm text-gray-300">未選択</span>
                      <ChevronDown className="w-5 h-5 text-gray-300" />
                    </>
                  ) : (
                    <>
                      <span className="text-sm text-black">{basicInfo.birthplace}</span>
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    </>
                  )
                }
              </div>
            </button>

            <button
              onClick={() => setActiveModal("education")}
              className="w-full flex items-center justify-between p-4 border-b border-gray-100"
            >
              <span className="text-sm text-black">学歴</span>
              <div className="flex items-center gap-2">
                {
                  !basicInfo.education ? (
                    <>
                      <span className="text-sm text-gray-300">未選択</span>
                      <ChevronDown className="w-5 h-5 text-gray-300" />
                    </>
                  ) : (
                    <>
                      <span className="text-sm text-black">{basicInfo.education}</span>
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    </>
                  )
                }
              </div>
            </button>

            <button
              onClick={() => setActiveModal("occupation")}
              className="w-full flex items-center justify-between p-4 border-b border-gray-100"
            >
              <span className="text-sm text-black">お仕事</span>
              <div className="flex items-center gap-2">
                {
                  !basicInfo.occupation ? (
                    <>
                      <span className="text-sm text-gray-300">未選択</span>
                      <ChevronDown className="w-5 h-5 text-gray-300" />
                    </>
                  ) : (
                    <>
                      <span className="text-sm text-black">{basicInfo.occupation}</span>
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    </>
                  )
                }
              </div>
            </button>

            <button
              onClick={() => setActiveModal("drinkingLevel")}
              className="w-full flex items-center justify-between p-4 border-b border-gray-100"
            >
              <span className="text-sm text-black">お酒</span>
              <div className="flex items-center gap-2">
                {
                  !basicInfo.drinkingLevel ? (
                    <>
                      <span className="text-sm text-gray-300">未選択</span>
                      <ChevronDown className="w-5 h-5 text-gray-300" />
                    </>
                  ) : (
                    <>
                      <span className="text-sm text-black">{basicInfo.drinkingLevel}</span>
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    </>
                  )
                }
              </div>
            </button>

            <button
              onClick={() => setActiveModal("smokingLevel")}
              className="w-full flex items-center justify-between p-4 border-b border-gray-100"
            >
              <span className="text-sm text-black">タバコ</span>
              <div className="flex items-center gap-2">
                {
                  !basicInfo.smokingLevel ? (
                    <>
                      <span className="text-sm text-gray-300">未選択</span>
                      <ChevronDown className="w-5 h-5 text-gray-300" />
                    </>
                  ) : (
                    <>  
                      <span className="text-sm text-black">{basicInfo.smokingLevel}</span>
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    </>
                  )
                }
              </div>
            </button>

            <button
              onClick={() => setActiveModal("cohabitant")}
              className="w-full flex items-center justify-between p-4 border-b border-gray-100"
            >
              <span className="text-sm text-black">同居人</span>
              <div className="flex items-center gap-2">
                {
                  !basicInfo.cohabitant ? (
                    <>
                      <span className="text-sm text-gray-300">未選択</span>
                      <ChevronDown className="w-5 h-5 text-gray-300" />
                    </>
                  ) : (
                    <>
                      <span className="text-sm text-black">{basicInfo.cohabitant}</span>
                      <ChevronDown className="w-5 h-5 text-black" />
                    </>
                  )
                }
              </div>
            </button>

            <button
              onClick={() => setActiveModal("siblings")}
              className="w-full flex items-center justify-between p-4 border-b border-gray-100"
            >
              <span className="text-sm text-black">兄弟姉妹</span>
              <div className="flex items-center gap-2">
                {
                  !basicInfo.siblings ? (
                    <>
                      <span className="text-sm text-gray-300">未選択</span>
                      <ChevronDown className="w-5 h-5 text-gray-300" />
                    </>
                  ) : (
                    <>
                      <span className="text-sm text-black">{basicInfo.siblings}</span>
                      <ChevronDown className="w-5 h-5 text-black" />
                    </>
                  )
                }
              </div>
            </button>

            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-black">生年月日</span>
                <span className="text-sm text-gold-pink-gradient">{basicInfo.birthDate}</span>
              </div>

              <div className="text-xs text-gray-500 leading-relaxed">
                <p>生年月日を登録すると、プロフィールに年齢が表示されます。</p>
                <p>変更希望の場合はコンシェルジュチャットまでお問い合わせください。</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {
        Object.entries(fieldOptions).map(([field, options]) => (
          <SelectionModal
            key={field}
            isOpen={activeModal === field}
            onClose={() => setActiveModal(null)}
            title={getFieldTitle(field)}
            options={options}
            selectedValue={basicInfo[field as keyof typeof basicInfo]}
            onSelect={(value) => handleFieldSelect(field, value)}
          />
        ))
      }
    </>
  )
}
