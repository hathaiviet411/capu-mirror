import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

export interface AuthUser {
  id: string
  email?: string
  name?: string
  userType: 'GUEST' | 'CAST' | 'ADMIN'
  image?: string
}

export interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  userType: 'GUEST' | 'CAST' | 'ADMIN' | null
}

export const useAuth = (): AuthState => {
  const { data: session, status } = useSession()
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    userType: null
  })

  useEffect(() => {
    if (status === 'loading') {
      setAuthState(prev => ({ ...prev, isLoading: true }))
      return
    }

    if (status === 'authenticated' && session?.user) {
      setAuthState({
        user: {
          id: session.user.id,
          email: session.user.email || undefined,
          name: session.user.name || undefined,
          userType: session.user.userType,
          image: session.user.image || undefined
        },
        isAuthenticated: true,
        isLoading: false,
        userType: session.user.userType
      })
    } else {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        userType: null
      })
    }
  }, [session, status])

  return authState
}