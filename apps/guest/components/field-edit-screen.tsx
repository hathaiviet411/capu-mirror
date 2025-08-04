"use client"

import { ArrowLeft } from "lucide-react"
import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { api } from "~/utils/api"
import { useSession } from "next-auth/react"
import { useToast } from "@/components/ui/use-toast"

interface FieldEditScreenProps {
  onBack: () => void
  title: string
  value: string
  onSave: (value: string) => void
  maxLength?: number
  placeholder?: string
  multiline?: boolean
  fieldType?: "aliasName" | "quote" | "selfIntro"
}

export default function FieldEditScreen({
  onBack,
  title,
  value,
  onSave,
  maxLength = 20,
  placeholder = "",
  multiline = false,
  fieldType = "selfIntro",
}: FieldEditScreenProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [inputValue, setInputValue] = useState(value || "")
  const [isSaving, setIsSaving] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const updateUserMutation = api.guest.updateUser.useMutation({
    onSuccess: () => {
      const successMessages = {
        aliasName: "ニックネームを更新しました",
        quote: "今日のひとことを更新しました",
        selfIntro: "自己紹介を更新しました",
      }
      
      toast({
        title: "保存完了",
        description: successMessages[fieldType] || "更新しました",
      })
      onSave(inputValue)
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

  const successMessages = useMemo(() => ({
    aliasName: "ニックネームを更新しました",
    quote: "今日のひとことを更新しました",
    selfIntro: "自己紹介を更新しました",
  }), [])

  const characterCount = useMemo(() => (inputValue || "").length, [inputValue])

  const updateData = useMemo(() => {
    const data: any = {}
    
    switch (fieldType) {
      case "aliasName":
        data.aliasName = inputValue
        break
      case "quote":
        data.quote = inputValue
        break
      case "selfIntro":
        data.selfIntro = inputValue
        break
      default:
        data.selfIntro = inputValue
    }
    
    return data
  }, [fieldType, inputValue])

  const handleBackClick = useCallback(() => {
    onBack()
  }, [onBack])

  const handleSaveClick = useCallback(() => {
    if (!session?.user?.id) return
    
    setIsSaving(true)
    
    updateUserMutation.mutate({
      userId: session.user.id,
      data: updateData,
    })
  }, [session?.user?.id, updateUserMutation, updateData])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const newValue = e.target.value.slice(0, maxLength)
    setInputValue(newValue)
    
    if (multiline && textareaRef.current) {
      adjustTextareaHeight()
    }
  }, [maxLength, multiline])

  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      const scrollHeight = textareaRef.current.scrollHeight
      const minHeight = 120
      const maxHeight = 500
      const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight)
      textareaRef.current.style.height = `${newHeight}px`
    }
  }, [])

  useEffect(() => {
    if (multiline && textareaRef.current) {
      adjustTextareaHeight()
    }
  }, [multiline, adjustTextareaHeight])

  return (
    <div className="min-h-screen w-full md:max-w-sm mx-auto bg-gray-100 flex flex-col relative">
      <div className="bg-gold-pink-gradient px-4 py-4 h-16 flex items-center justify-between fixed top-0 left-1/2 transform -translate-x-1/2 w-full md:max-w-sm z-10 shadow-lg">
        <div className="flex items-center gap-3">
          <button onClick={handleBackClick}>
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-base font-medium text-white">{title}</h1>
        </div>
        <button 
          onClick={handleSaveClick} 
          disabled={isSaving}
          className="text-sm text-white font-medium disabled:opacity-50"
        >
          {isSaving ? "保存中..." : "保存"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto mt-[64px] bg-gray-100 pb-8">
        <div className="bg-white p-4">
          <div className="flex justify-end mb-3">
            <span className="text-sm text-gray-500">
              {characterCount}/{maxLength}
            </span>
          </div>

          {multiline ? (
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleInputChange}
              placeholder={placeholder}
              className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:border-gold-pink-gradient focus:rounded-lg active:rounded-lg text-sm bg-white transition-all duration-200 overflow-hidden"
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
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-gold-pink-gradient focus:rounded-lg active:rounded-lg text-sm bg-white transition-all duration-200"
              style={{ borderRadius: '0.5rem' }}
            />
          )}
          
          <p className="text-sm text-gray-500 mt-3 text-center">
            {multiline ? '改行して詳しく入力してください' : 'わかりやすく入力してください'}
          </p>
        </div>
      </div>
    </div>
  )
}
