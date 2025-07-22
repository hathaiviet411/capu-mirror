import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export const useLogout = () => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const logout = async () => {
    try {
      setIsLoading(true)
      
      // ローカルストレージをクリア
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
      }
      
      // NextAuth.jsのログアウト処理
      await signOut({
        redirect: false,
        callbackUrl: '/'
      })
      
      // ルートページにリダイレクト
      router.push('/')
      router.refresh()
      
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return { logout, isLoading }
}