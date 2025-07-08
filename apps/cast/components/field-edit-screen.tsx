"use client"

import { ArrowLeft } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"

interface FieldEditScreenProps {
  onBack: () => void
  title: string
  value: string
  onSave: (value: string) => void
  maxLength?: number
  placeholder?: string
  multiline?: boolean
}

export default function FieldEditScreen({
  onBack,
  title,
  value,
  onSave,
  maxLength = 20,
  placeholder = "",
  multiline = false,
}: FieldEditScreenProps) {
  const [inputValue, setInputValue] = useState(value)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSave = () => {
    onSave(inputValue)
    onBack()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const newValue = e.target.value.slice(0, maxLength)
    setInputValue(newValue)
    
    if (multiline && textareaRef.current) {
      adjustTextareaHeight()
    }
  }

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      const scrollHeight = textareaRef.current.scrollHeight
      const minHeight = 120 // 最小高さ（約3行分）
      const maxHeight = 300 // 最大高さ制限
      const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight)
      textareaRef.current.style.height = `${newHeight}px`
    }
  }

  useEffect(() => {
    if (multiline && textareaRef.current) {
      adjustTextareaHeight()
    }
  }, [multiline])

  return (
    <div className="min-h-screen w-full md:max-w-sm mx-auto bg-gray-100 flex flex-col relative">
      {/* Header */}
      <div className="bg-main-navy-gradient px-4 py-4 h-16 flex items-center justify-between fixed top-0 left-1/2 transform -translate-x-1/2 w-full md:max-w-sm z-10 shadow-lg">
        <div className="flex items-center gap-3">
          <button onClick={onBack}>
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-base font-medium text-white">{title}</h1>
        </div>
        <button onClick={handleSave} className="text-sm text-white font-medium">
          保存
        </button>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto mt-[64px] bg-gray-100 pb-8">
        <div className="bg-white p-4">
          {/* Character Counter */}
          <div className="flex justify-end mb-3">
            <span className="text-sm text-gray-500">
              {inputValue.length}/{maxLength}
            </span>
          </div>

          {/* Input Field */}
          {multiline ? (
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleInputChange}
              placeholder={placeholder}
              className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:border-accent-blue focus:rounded-lg active:rounded-lg text-sm bg-white transition-all duration-200 overflow-hidden"
              style={{ 
                borderRadius: '0.5rem',
                minHeight: '120px'
              }}
            />
          ) : (
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              placeholder={placeholder}
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-accent-blue focus:rounded-lg active:rounded-lg text-sm bg-white transition-all duration-200"
              style={{ borderRadius: '0.5rem' }}
            />
          )}
          
          {/* Helper text */}
          <p className="text-sm text-gray-500 mt-3 text-center">
            {multiline ? '改行して詳しく入力してください' : 'わかりやすく入力してください'}
          </p>
        </div>
      </div>
    </div>
  )
}
