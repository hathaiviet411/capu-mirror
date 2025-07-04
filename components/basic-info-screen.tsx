"use client"

import { ArrowLeft, ChevronDown, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface BasicInfoScreenProps {
  onBack: () => void
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
      {/* Header */}
      <div className="bg-gold-pink-gradient px-4 py-4 h-16 flex items-center gap-3 border-b shadow-lg">
        <button onClick={onClose}>
          <X className="w-5 h-5 text-white" />
        </button>
        <span className="text-base font-medium text-white">基本情報</span>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-20">
        <div className="space-y-2">
          {options.map((option) => (
            <button
              key={option}
              onClick={() => {
                onSelect(option)
                onClose()
              }}
              className={`w-full text-left px-4 py-3 rounded-lg border ${
                selectedValue === option
                  ? "bg-blue-500 text-white border-blue-500"
                  : "bg-white text-gray-700 border-gray-300"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {/* Fixed Bottom Button */}
      <div className="bg-white border-t p-4">
        <Button
          onClick={onClose}
          className="w-full h-12 bg-gold-pink-gradient hover:bg-gold-pink-gradient-dark text-white text-base font-medium rounded-lg"
        >
          保存して戻る
        </Button>
      </div>
    </div>
  )
}

export default function BasicInfoScreen({ onBack }: BasicInfoScreenProps) {
  const [basicInfo, setBasicInfo] = useState({
    height: "162",
    residence: "東京都",
    birthplace: "未選択",
    education: "大学卒",
    income: "400万〜600万",
    job: "会社員",
    alcohol: "ときどき飲む",
    tobacco: "吸わない",
    siblings: "長女",
    cohabitation: "一人暮らし",
    birthDate: "1996年10月22日",
  })

  const [activeModal, setActiveModal] = useState<string | null>(null)

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
      "未選択",
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
    education: ["中学卒", "高校卒", "専門学校卒", "短大卒", "大学卒", "大学院卒"],
    income: [
      "200万未満",
      "200万〜400万",
      "400万〜600万",
      "600万〜800万",
      "800万〜1000万",
      "1000万〜1500万",
      "1500万〜2000万",
      "2000万〜3000万",
      "3000万以上",
    ],
    job: ["学生", "会社員", "公務員", "経営者・役員", "自営業", "自由業", "専門職", "パート・アルバイト", "その他"],
    alcohol: ["飲まない", "ときどき飲む", "よく飲む"],
    tobacco: ["吸わない", "ときどき吸う", "よく吸う", "非喫煙者の前では吸わない"],
    siblings: ["一人っ子", "長男", "次男", "三男以降", "長女", "次女", "三女以降"],
    cohabitation: ["一人暮らし", "家族と同居", "友人・知人と同居", "恋人と同居", "その他"],
  }

  const handleSave = () => {
    // Save logic here
    onBack()
  }

  const handleFieldSelect = (field: string, value: string) => {
    setBasicInfo({ ...basicInfo, [field]: value })
  }

  return (
    <>
      <div className="min-h-screen w-full md:max-w-sm mx-auto bg-gray-100 flex flex-col relative">
        {/* Header */}
        <div className="bg-gold-pink-gradient px-4 py-4 h-16 flex items-center justify-between fixed top-0 left-1/2 transform -translate-x-1/2 w-full md:max-w-sm z-10 shadow-lg">
          <div className="flex items-center gap-3">
            <button onClick={onBack}>
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-lg font-medium text-white">基本情報</h1>
          </div>
          <button onClick={handleSave} className="text-sm text-white font-medium">
            保存
          </button>
        </div>

        {/* Main Content - Scrollable */}
        <div className="flex-1 overflow-y-auto mt-[64px] bg-gray-100 pb-8">
          <div className="bg-white">
            {/* Height */}
            <button
              onClick={() => setActiveModal("height")}
              className="w-full flex items-center justify-between p-4 border-b border-gray-100"
            >
              <span className="text-sm text-black">身長</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-black">{basicInfo.height}</span>
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </div>
            </button>

            {/* Residence */}
            <button
              onClick={() => setActiveModal("residence")}
              className="w-full flex items-center justify-between p-4 border-b border-gray-100"
            >
              <span className="text-sm text-black">居住地</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-black">{basicInfo.residence}</span>
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </div>
            </button>

            {/* Birthplace */}
            <button
              onClick={() => setActiveModal("birthplace")}
              className="w-full flex items-center justify-between p-4 border-b border-gray-100"
            >
              <span className="text-sm text-black">出身地</span>
              <div className="flex items-center gap-2">
                <span className={`text-sm ${basicInfo.birthplace === "未選択" ? "text-gray-500" : "text-black"}`}>
                  {basicInfo.birthplace}
                </span>
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </div>
            </button>

            {/* Education */}
            <button
              onClick={() => setActiveModal("education")}
              className="w-full flex items-center justify-between p-4 border-b border-gray-100"
            >
              <span className="text-sm text-black">学歴</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-black">{basicInfo.education}</span>
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </div>
            </button>

            {/* Income */}
            <button
              onClick={() => setActiveModal("income")}
              className="w-full flex items-center justify-between p-4 border-b border-gray-100"
            >
              <span className="text-sm text-black">年収</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-black">{basicInfo.income}</span>
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </div>
            </button>

            {/* Job */}
            <button
              onClick={() => setActiveModal("job")}
              className="w-full flex items-center justify-between p-4 border-b border-gray-100"
            >
              <span className="text-sm text-black">お仕事</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-black">{basicInfo.job}</span>
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </div>
            </button>

            {/* Alcohol */}
            <button
              onClick={() => setActiveModal("alcohol")}
              className="w-full flex items-center justify-between p-4 border-b border-gray-100"
            >
              <span className="text-sm text-black">お酒</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-black">{basicInfo.alcohol}</span>
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </div>
            </button>

            {/* Tobacco */}
            <button
              onClick={() => setActiveModal("tobacco")}
              className="w-full flex items-center justify-between p-4 border-b border-gray-100"
            >
              <span className="text-sm text-black">タバコ</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-black">{basicInfo.tobacco}</span>
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </div>
            </button>

            {/* Siblings */}
            <button
              onClick={() => setActiveModal("siblings")}
              className="w-full flex items-center justify-between p-4 border-b border-gray-100"
            >
              <span className="text-sm text-black">兄弟姉妹</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-black">{basicInfo.siblings}</span>
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </div>
            </button>

            {/* Cohabitation */}
            <button
              onClick={() => setActiveModal("cohabitation")}
              className="w-full flex items-center justify-between p-4 border-b border-gray-100"
            >
              <span className="text-sm text-black">同居人</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-black">{basicInfo.cohabitation}</span>
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </div>
            </button>

            {/* Birth Date */}
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

      {/* Selection Modals */}
      {Object.entries(fieldOptions).map(([field, options]) => (
        <SelectionModal
          key={field}
          isOpen={activeModal === field}
          onClose={() => setActiveModal(null)}
          title={
            field === "height"
              ? "身長"
              : field === "residence"
                ? "居住地"
                : field === "birthplace"
                  ? "出身地"
                  : field === "education"
                    ? "学歴"
                    : field === "income"
                      ? "年収"
                      : field === "job"
                        ? "お仕事"
                        : field === "alcohol"
                          ? "お酒"
                          : field === "tobacco"
                            ? "タバコ"
                            : field === "siblings"
                              ? "兄弟姉妹"
                              : field === "cohabitation"
                                ? "同居人"
                                : ""
          }
          options={options}
          selectedValue={basicInfo[field as keyof typeof basicInfo]}
          onSelect={(value) => handleFieldSelect(field, value)}
        />
      ))}
    </>
  )
}
