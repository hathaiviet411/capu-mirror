"use client"

import { useState, useEffect } from "react"

interface ChatOptionsModalProps {
  isOpen: boolean
  onClose: () => void
  isPinned?: boolean
  onTogglePin?: (pinned: boolean) => void
}

export default function ChatOptionsModal({ isOpen, onClose, isPinned = false, onTogglePin }: ChatOptionsModalProps) {
  const [showReportModal, setShowReportModal] = useState(false)
  const [showBlockModal, setShowBlockModal] = useState(false)

  // モーダルが閉じられた時に状態をリセット
  useEffect(() => {
    if (!isOpen) {
      setShowReportModal(false)
      setShowBlockModal(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleReport = () => {
    setShowReportModal(true)
  }

  const handleBlock = () => {
    setShowBlockModal(true)
  }

  const handleTogglePin = () => {
    const newPinnedState = !isPinned
    onTogglePin?.(newPinnedState)
    console.log(newPinnedState ? "ピン留めしました" : "ピン留めを解除しました")
    onClose()
  }

  const handleReportConfirm = () => {
    console.log("通報を送信しました")
    // モーダル全体を閉じる
    onClose()
    // 状態をリセット
    setTimeout(() => {
      setShowReportModal(false)
    }, 100)
  }

  const handleBlockConfirm = () => {
    console.log("ブロックしました")
    // モーダル全体を閉じる
    onClose()
    // 状態をリセット
    setTimeout(() => {
      setShowBlockModal(false)
    }, 100)
  }

  return (
    <>
      {/* Main Options Modal - 確認モーダルが表示されていない時のみ表示 */}
      {!showReportModal && !showBlockModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-2xl w-full md:max-w-sm animate-slide-up">
            <div className="p-6 space-y-1">
              {/* 通報する */}
              <button
                onClick={handleReport}
                className="w-full py-4 text-left text-base text-black hover:bg-gray-50 rounded-lg transition-colors"
              >
                通報する
              </button>

              {/* ブロックする */}
              <button
                onClick={handleBlock}
                className="w-full py-4 text-left text-base text-black hover:bg-gray-50 rounded-lg transition-colors"
              >
                ブロックする
              </button>

              {/* ピン留めを解除/ピン留めする */}
              <button
                onClick={handleTogglePin}
                className="w-full py-4 text-left text-base text-black hover:bg-gray-50 rounded-lg transition-colors"
              >
                {isPinned ? "ピン留めを解除" : "ピン留めする"}
              </button>

              {/* 区切り線 */}
              <div className="border-t border-gray-200 my-4"></div>

              {/* キャンセル */}
              <button
                onClick={onClose}
                className="w-full py-4 text-left text-base text-gray-500 hover:bg-gray-50 rounded-lg transition-colors"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Confirmation Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-lg w-full md:max-w-sm p-6">
            <h3 className="text-lg font-medium text-black text-center mb-4">通報しますか？</h3>
            <p className="text-sm text-gray-600 text-center mb-6 leading-relaxed">
              このユーザーを通報します。
              <br />
              不適切な行為や規約違反があった場合に通報してください。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowReportModal(false)
                }}
                className="flex-1 h-12 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleReportConfirm}
                className="flex-1 h-12 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                通報する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block Confirmation Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-lg w-full md:max-w-sm p-6">
            <h3 className="text-lg font-medium text-black text-center mb-4">ブロックしますか？</h3>
            <p className="text-sm text-gray-600 text-center mb-6 leading-relaxed">
              このユーザーをブロックします。
              <br />
              ブロック後は、お互いにメッセージの送受信ができなくなります。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowBlockModal(false)
                }}
                className="flex-1 h-12 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleBlockConfirm}
                className="flex-1 h-12 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                ブロックする
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
