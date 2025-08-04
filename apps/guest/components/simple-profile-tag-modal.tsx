"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { X } from "lucide-react"
import { useSession } from "next-auth/react"
import { api } from "~/utils/api"

interface SimpleProfileTagModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (selectedTags: string[]) => void
  initialTags?: string[]
}

export default function SimpleProfileTagModal({ isOpen, onClose, onSave, initialTags = [] }: SimpleProfileTagModalProps) {
  const { data: session } = useSession()
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])
  const [selectedTagNames, setSelectedTagNames] = useState<string[]>(initialTags)

  const { data: userDetails, isLoading: isLoadingUser } = api.guest.getUserById.useQuery(
    { userId: session?.user?.id || "" },
    { enabled: !!session?.user?.id && isOpen }
  )

  const { data: tagCategories = [], isLoading: isLoadingTags } = api.guest.getListTag.useQuery()

  const tagMappings = useMemo(() => {
    const tagNameToIdMap = new Map<number, string>()
    const tagNameToIdReverseMap = new Map<string, number>()
    
    tagCategories.forEach(category => {
      category.tags.forEach(tag => {
        tagNameToIdMap.set(tag.id, tag.name)
        tagNameToIdReverseMap.set(tag.name, tag.id)
      })
    })

    return { tagNameToIdMap, tagNameToIdReverseMap }
  }, [tagCategories])

  const isLoading = useMemo(() => isLoadingTags || isLoadingUser, [isLoadingTags, isLoadingUser])

  const updateUserMutation = api.guest.updateUser.useMutation({
    onSuccess: () => {
      onSave(selectedTagNames)
      onClose()
    },
    onError: (error) => {
      console.error('Failed to update user tags:', error)
    }
  })

  useEffect(() => {
    if (userDetails?.userTags && tagCategories.length > 0) {
      const userTagIds = userDetails.userTags.map(tag => tag.tag_id).filter((id): id is number => id !== null)
      const userTagNames = userDetails.userTags.map(tag => tag.name).filter((name): name is string => name !== null)
      
      setSelectedTagIds(userTagIds)
      setSelectedTagNames(userTagNames)
    } else if (initialTags.length > 0 && tagCategories.length > 0) {
      const initialTagIds = initialTags
        .map(tagName => tagMappings.tagNameToIdReverseMap.get(tagName))
        .filter((id): id is number => id !== undefined)
      setSelectedTagIds(initialTagIds)
      setSelectedTagNames(initialTags)
    }
  }, [userDetails, tagCategories, initialTags, tagMappings.tagNameToIdReverseMap])

  const toggleTag = useCallback((tagId: number, tagName: string) => {
    setSelectedTagIds((prev) => {
      const newIds = prev.includes(tagId) 
        ? prev.filter((id) => id !== tagId) 
        : [...prev, tagId]
      return newIds
    })
    
    setSelectedTagNames((prev) => {
      const newNames = prev.includes(tagName) 
        ? prev.filter((name) => name !== tagName) 
        : [...prev, tagName]
      return newNames
    })
  }, [])

  const handleSave = useCallback(() => {
    if (!session?.user?.id) {
      console.error('No user session found')
      return
    }

    updateUserMutation.mutate({
      userId: session.user.id,
      data: {
        tags: selectedTagIds
      }
    })
  }, [session?.user?.id, selectedTagIds, updateUserMutation])

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  const handleTagClick = useCallback((tagId: number, tagName: string) => {
    toggleTag(tagId, tagName)
  }, [toggleTag])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-white w-full md:max-w-sm mx-auto flex flex-col">
      <div className="bg-gold-pink-gradient px-4 py-4 h-16 flex items-center justify-between border-b shadow-lg">
        <div className="flex items-center gap-3">
          <button onClick={handleClose}>
            <X className="w-5 h-5 text-white" />
          </button>
          <span className="text-base font-medium text-white">簡単プロフィール</span>
        </div>
        <button 
          onClick={handleSave}
          disabled={updateUserMutation.isLoading}
          className="text-sm text-white font-medium disabled:opacity-50"
        >
          {updateUserMutation.isLoading ? "保存中..." : "保存"}
        </button>
      </div>

      {selectedTagNames.length > 0 && (
        <div className="p-4 bg-gray-50 border-b">
          <p className="text-xs text-gray-600 mb-2">選択中 ({selectedTagNames.length}個)</p>
          <div className="flex flex-wrap gap-1">
            {selectedTagNames.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 text-xs bg-gold-pink-gradient text-white rounded-md"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 pb-20">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-gray-500">読み込み中...</div>
          </div>
        ) : (
          tagCategories.map((category, index) => (
            <div key={category.type || `category-${index}`} className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3">{category.title}</h3>
              <div className="flex flex-wrap gap-2">
                {category.tags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => handleTagClick(tag.id, tag.name)}
                    className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                      selectedTagNames.includes(tag.name)
                        ? "bg-gold-pink-gradient text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
} 