"use client"

import { X, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface ScheduleProposalModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (scheduleData: any) => void
}

export default function ScheduleProposalModal({ isOpen, onClose, onSubmit }: ScheduleProposalModalProps) {
  const [selectedDate, setSelectedDate] = useState("07月02日(水) 18:50")
  const [castCount, setCastCount] = useState("1名")
  const [duration, setDuration] = useState("2時間")
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showCastPicker, setShowCastPicker] = useState(false)
  const [showDurationPicker, setShowDurationPicker] = useState(false)

  if (!isOpen) return null

  // 料金計算
  const baseRate = 6500 // キャストP/30分
  const castNumber = Number.parseInt(castCount.replace("名", ""))
  const hours = Number.parseInt(duration.replace("時間", ""))
  const baseAmount = baseRate * castNumber * hours
  const couponDiscount = 10000
  const totalAmount = baseAmount - couponDiscount

  const handleSubmit = () => {
    const scheduleData = {
      date: selectedDate,
      castCount,
      duration,
      totalAmount,
    }
    onSubmit(scheduleData)
    onClose()
  }

  const dateOptions = [
    "07月02日(水) 18:50",
    "07月02日(水) 19:00",
    "07月02日(水) 19:30",
    "07月02日(水) 20:00",
    "07月03日(木) 18:50",
    "07月03日(木) 19:00",
    "07月03日(木) 19:30",
    "07月03日(木) 20:00",
  ]

  const castOptions = ["1名", "2名", "3名", "4名"]
  const durationOptions = ["1時間", "2時間", "3時間", "4時間", "5時間", "6時間"]

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full md:max-w-sm max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gold-pink-gradient px-4 py-4 flex items-center gap-3 border-b shadow-lg">
          <button onClick={onClose}>
            <X className="w-5 h-5 text-white" />
          </button>
          <span className="text-base font-medium text-white">日程と人数を提案</span>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Date Selection */}
          <div>
            <div className="relative">
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="w-full p-4 border border-gray-300 rounded-lg flex items-center justify-between bg-white"
              >
                <span className="text-base text-black">{selectedDate}</span>
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </button>

              {showDatePicker && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                  {dateOptions.map((date) => (
                    <button
                      key={date}
                      onClick={() => {
                        setSelectedDate(date)
                        setShowDatePicker(false)
                      }}
                      className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      {date}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Cast Count and Duration */}
          <div className="grid grid-cols-2 gap-4">
            {/* Cast Count */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">キャスト人数</label>
              <div className="relative">
                <button
                  onClick={() => setShowCastPicker(!showCastPicker)}
                  className="w-full p-3 border border-gray-300 rounded-lg flex items-center justify-between bg-white"
                >
                  <span className="text-base text-black">{castCount}</span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {showCastPicker && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                    {castOptions.map((count) => (
                      <button
                        key={count}
                        onClick={() => {
                          setCastCount(count)
                          setShowCastPicker(false)
                        }}
                        className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">時間</label>
              <div className="relative">
                <button
                  onClick={() => setShowDurationPicker(!showDurationPicker)}
                  className="w-full p-3 border border-gray-300 rounded-lg flex items-center justify-between bg-white"
                >
                  <span className="text-base text-black">{duration}</span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {showDurationPicker && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-32 overflow-y-auto">
                    {durationOptions.map((dur) => (
                      <button
                        key={dur}
                        onClick={() => {
                          setDuration(dur)
                          setShowDurationPicker(false)
                        }}
                        className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        {dur}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="border-t pt-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-black">
                  {baseRate.toLocaleString()} (キャストP/30分) × {castCount} × {duration}
                </span>
                <span className="text-sm font-medium text-black">{baseAmount.toLocaleString()}P</span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-red-500">ワンモアクーポン</span>
                  <button className="text-xs text-gray-500 underline">変更する</button>
                </div>
                <span className="text-sm font-medium text-red-500">-{couponDiscount.toLocaleString()}P</span>
              </div>

              <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-base font-medium text-black">合計 (1P = 1.2円)</span>
                  <span className="text-lg font-bold text-black">{totalAmount.toLocaleString()}P</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-600 mt-4 text-center">※延長15分につき4,225p発生します</p>
          </div>

          {/* Notice */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-center text-black font-medium">実際に合流するまでポイントは消費されません</p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="p-4 border-t">
          <Button
            onClick={handleSubmit}
            className="w-full h-12 bg-gold-pink-gradient hover:bg-gold-pink-gradient-dark text-white text-base font-medium rounded-lg"
          >
            日程と人数を提案する
          </Button>
        </div>
      </div>
    </div>
  )
}
