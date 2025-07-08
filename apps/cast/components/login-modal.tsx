"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"
import { useState } from "react"

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onLogin: () => void
}

export default function LoginModal({ isOpen, onClose, onLogin }: LoginModalProps) {
  const [loginId, setLoginId] = useState("")
  const [password, setPassword] = useState("")
  
  console.log("LoginModal isOpen:", isOpen)
  if (!isOpen) return null

  const handleLogin = () => {
    // ここで実際の認証処理を行う
    console.log("Login attempt with:", { loginId, password })
    onLogin()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col w-full md:max-w-sm mx-auto">
      {/* Background Gradient - Navy gradient */}
      <div className="absolute inset-0 z-0">
        <div className="w-full h-full bg-main-navy-gradient"></div>
      </div>
      
      <div className="relative z-10 flex-1 flex items-center justify-center px-6">
        <div className="w-full px-4">
          <h2 className="text-white text-center mb-6 text-xl font-bold">
            ログイン
          </h2>


          {/* Login Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="loginId" className="text-white text-sm font-medium">
                ログインID
              </Label>
              <Input
                id="loginId"
                type="text"
                placeholder="ログインIDを入力"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                className="w-full h-12 bg-white/10 border-white/20 text-white placeholder:text-white/60 rounded-lg focus:border-accent-blue focus:ring-accent-blue"
              />
            </div>
            
            <div className="space-y-2 mb-16">
              <Label htmlFor="password" className="text-white text-sm font-medium">
                パスワード
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="パスワードを入力"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 bg-white/10 border-white/20 text-white placeholder:text-white/60 rounded-lg focus:border-accent-blue focus:ring-accent-blue"
              />
            </div>

            {/* 明示的な余白 */}
            <div className="h-12"></div>

            <Button
              onClick={handleLogin}
              disabled={!loginId || !password}
              className="w-full h-14 bg-main-navy-gradient hover:bg-main-blue text-white text-base font-semibold rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ログイン
            </Button>
            
            <div className="text-center mt-4">
              <a href="#" className="text-white text-sm hover:text-white">
                ログインID・パスワードを忘れた場合は<br/>キャスト用公式LINEよりお問い合わせください
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Close Button */}
      <div className="relative z-10 pb-8 flex justify-center">
        <Button
          onClick={onClose}
          variant="ghost"
          className="text-white hover:bg-white/10 flex flex-col items-center gap-1 h-auto py-3"
        >
          <X className="w-6 h-6" />
          <span className="text-xs">閉じる</span>
        </Button>
      </div>
    </div>
  )
}
