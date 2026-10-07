import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { api, tokenStorage } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const queryClient = useQueryClient()
  const [user, setUser] = useState(null)
  const [isInitializing, setIsInitializing] = useState(true)

  const logout = useCallback(() => {
    tokenStorage.clear()
    setUser(null)
    queryClient.clear()
  }, [queryClient])

  useEffect(() => {
    const init = async () => {
      if (!tokenStorage.getAccess()) {
        setIsInitializing(false)
        return
      }
      try {
        const { data } = await api.get('/users/me')
        setUser(data)
      } catch {
        tokenStorage.clear()
      } finally {
        setIsInitializing(false)
      }
    }
    init()
  }, [])

  // disparado pelo interceptor quando o refresh token também expirou
  useEffect(() => {
    window.addEventListener('finance-app:logout', logout)
    return () => window.removeEventListener('finance-app:logout', logout)
  }, [logout])

  const handleAuthResponse = (data) => {
    const { tokens, ...userData } = data
    tokenStorage.set(tokens)
    setUser(userData)
  }

  const login = async ({ email, password }) => {
    const { data } = await api.post('/users/login', { email, password })
    handleAuthResponse(data)
  }

  const signup = async (values) => {
    const { data } = await api.post('/users', values)
    handleAuthResponse(data)
  }

  // Busca os dados atualizados do usuário (ex.: depois de confirmar o e-mail)
  const refreshUser = useCallback(async () => {
    if (!tokenStorage.getAccess()) return null
    const { data } = await api.get('/users/me')
    setUser(data)
    return data
  }, [])

  const updateUser = async (values) => {
    const { data } = await api.patch('/users/me', values)
    setUser(data)
    return data
  }

  const deleteAccount = async () => {
    await api.delete('/users/me')
    logout()
  }

  return (
    <AuthContext.Provider
      value={{ user, isInitializing, login, signup, logout, refreshUser, updateUser, deleteAccount }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth precisa estar dentro de AuthProvider')
  return context
}
