"use client"

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function UnauthorizedPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            アクセス権限がありません
          </h1>
          <p className="text-gray-600 mb-6">
            このページにアクセスする権限がありません。<br />
            ゲストユーザーとしてログインしてください。
          </p>
        </div>
        
        <div className="space-y-4">
          <Button
            onClick={() => router.push('/')}
            className="w-full bg-main-navy-gradient hover:bg-main-blue text-white"
          >
            ログイン画面に戻る
          </Button>
          
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="w-full"
          >
            前のページに戻る
          </Button>
        </div>
      </div>
    </div>
  )
}