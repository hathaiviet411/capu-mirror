import { useAuth } from './useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export const useRequireAuth = (requiredUserType?: 'GUEST' | 'CAST' | 'ADMIN') => {
  const { isAuthenticated, isLoading, userType, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/')
        return
      }

      if (requiredUserType && userType !== requiredUserType) {
        router.push('/auth/unauthorized')
        return
      }
    }
  }, [isAuthenticated, isLoading, userType, requiredUserType, router])

  return { 
    isAuthenticated, 
    isLoading, 
    userType, 
    user,
    isAuthorized: isAuthenticated && (!requiredUserType || userType === requiredUserType)
  }
}

// キャスト専用フック
export const useRequireCastAuth = () => {
  return useRequireAuth('CAST')
}

// ゲスト専用フック  
export const useRequireGuestAuth = () => {
  return useRequireAuth('GUEST')
}

// 管理者専用フック
export const useRequireAdminAuth = () => {
  return useRequireAuth('ADMIN')
}