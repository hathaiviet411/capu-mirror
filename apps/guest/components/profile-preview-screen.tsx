"use client"

import { ArrowLeft } from "lucide-react"
import Image from "next/image"
import { useState, useEffect } from "react"

interface ProfilePreviewScreenProps {
  onBack: () => void
  formData: {
    aliasName: string
    quote: string
    simpleProfile: string
    simpleProfileTags: string[]
    selfIntroduction: string
  }
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
  images: string[]
}

export default function ProfilePreviewScreen({ onBack, formData, basicInfo, images }: ProfilePreviewScreenProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showHeader, setShowHeader] = useState(false)

  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement
      if (target.scrollTop > 300) {
        setShowHeader(true)
      } else {
        setShowHeader(false)
      }
    }

    const scrollContainer = document.getElementById("profile-preview-scroll")
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll)
      return () => scrollContainer.removeEventListener("scroll", handleScroll)
    }
  }, [])

  const calculateAge = (birthDate: string) => {
    console.log('birthDate :', birthDate);
    
    // Handle formatted Japanese date string (e.g., "2000年11月4日")
    if (birthDate.includes('年')) {
      const match = birthDate.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/)
      if (match) {
        const [, year, month, day] = match
        const birthDateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
        const today = new Date()
        const age = today.getFullYear() - birthDateObj.getFullYear()
        const monthDiff = today.getMonth() - birthDateObj.getMonth()
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
          return age - 1
        }
        return age
      }
    }
    
    // Handle raw date string from database
    const today = new Date()
    const birthDateObj = new Date(birthDate)
    const age = today.getFullYear() - birthDateObj.getFullYear()
    const monthDiff = today.getMonth() - birthDateObj.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
      return age - 1
    }

    return age
  }

  const age = calculateAge(basicInfo.birthDate)

  return (
    <div className="h-screen w-full md:max-w-sm mx-auto bg-gray-100 flex flex-col relative">
      <div
        className={`fixed top-0 left-1/2 transform -translate-x-1/2 w-full md:max-w-sm bg-gold-pink-gradient border-b shadow-lg px-4 py-4 h-16 flex items-center gap-3 transition-all duration-300 ${
          showHeader ? "z-30 translate-y-0 opacity-100" : "z-30 -translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <button onClick={onBack}>
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <span className="text-base font-medium text-white">{formData.aliasName}</span>
      </div>

      <div id="profile-preview-scroll" className="flex-1 overflow-y-auto pb-8 relative z-10">
        <div className="relative h-96 bg-gray-200">
          <Image
            src={images[currentImageIndex] || "/placeholder.svg?height=400&width=400"}
            alt="Profile preview"
            fill
            className="object-cover"
          />

          <button
            onClick={onBack}
            className="absolute top-4 left-4 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center z-10"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="bg-white p-4">
          <div className="flex gap-2 mb-4">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`w-16 h-16 rounded-lg overflow-hidden border-2 ${
                  currentImageIndex === index ? "border-gold-pink-gradient" : "border-gray-200"
                }`}
              >
                <Image
                  src={image || "/placeholder.svg"}
                  alt={`Profile photo ${index + 1}`}
                  width={64}
                  height={64}
                  className="object-cover w-full h-full"
                />
              </button>
            ))}
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-xs text-green-600">オンライン中</span>
            </div>
            <h1 className="text-base font-medium mb-1">
              {formData.aliasName} {age}歳
            </h1>
            <p className="text-sm text-gray-700">
              {basicInfo.occupation} / {formData.quote}
            </p>
          </div>
        </div>

        <div className="h-2 bg-gray-100"></div>

        {formData.simpleProfileTags && formData.simpleProfileTags.length > 0 && (
          <>
            <div className="bg-white p-4">
              <h3 className="text-sm font-medium text-black mb-3">簡単プロフィール</h3>
              <div className="flex flex-wrap gap-2">
                {formData.simpleProfileTags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-sm bg-gold-pink-gradient text-white rounded-md"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="h-2 bg-gray-100"></div>
          </>
        )}

        <div className="bg-white p-4">
          <h3 className="text-sm font-medium text-black mb-3">自己紹介</h3>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{formData.selfIntroduction}</p>
        </div>

        <div className="h-2 bg-gray-100"></div>

        <div className="bg-white p-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">身長：</span>
              <span className="text-sm font-medium">{basicInfo.height}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">居住地：</span>
              <span className="text-sm font-medium">{basicInfo.residence}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">出身地：</span>
              <span className="text-sm font-medium">{basicInfo.birthplace}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">学歴：</span>
              <span className="text-sm font-medium">{basicInfo.education}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">お仕事：</span>
              <span className="text-sm font-medium">{basicInfo.occupation}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">お酒：</span>
              <span className="text-sm font-medium">{basicInfo.drinkingLevel}</span>
            </div>

            {basicInfo.smokingLevel && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">タバコ：</span>
                <span className="text-sm font-medium">{basicInfo.smokingLevel}</span>
              </div>
            )}

            {basicInfo.cohabitant && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">同居人：</span>
                <span className="text-sm font-medium">{basicInfo.cohabitant}</span>
              </div>
            )}

            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">兄弟姉妹：</span>
              <span className="text-sm font-medium">{basicInfo.siblings}</span>
            </div>
          </div>
        </div>

        <div className="h-4 bg-gray-100"></div>
      </div>
    </div>
  )
}
