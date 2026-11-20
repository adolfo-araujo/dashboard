import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { api, encerrarSessao, pedidoDeSessao, tokenStorage } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const queryClient = useQueryClient()
  const [user, setUser] = useState(null)
  const [isInitializing, setIsInitializing] = useState(true)

  const logout = useCallback(() => {
    encerrarSessao()
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
      } catch (error) {
        // Só desloga se a sessão for recusada. Se a API estiver fora do ar ou sem
        // internet, mantém o login para a próxima tentativa.
        if (error.response?.status === 401) tokenStorage.clear()
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

  const handleAuthResponse = (data, emCookie) => {
    const { tokens, ...userData } = data
    tokenStorage.set(tokens, { emCookie })
    setUser(userData)
  }

  const login = async ({ email, password }) => {
    const { data, emCookie } = await pedidoDeSessao('post', '/users/login', { email, password })
    handleAuthResponse(data, emCookie)
  }

  const signup = async (values) => {
    const { data, emCookie } = await pedidoDeSessao('post', '/users', values)
    handleAuthResponse(data, emCookie)
  }

  // Busca os dados atualizados do usuário (ex.: depois de confirmar o e-mail)
  const refreshUser = useCallback(async () => {
    if (!tokenStorage.getAccess()) return null
    const { data } = await api.get('/users/me')
    setUser(data)
    return data
  }, [])

  const updateUser = async (values) => {
    const { data, emCookie } = await pedidoDeSessao('patch', '/users/me', values)
    // Ao trocar a senha, a API encerra as outras sessões e manda tokens novos para esta
    const { tokens, ...userData } = data
    if (tokens) tokenStorage.set(tokens, { emCookie })
    setUser(userData)
    return userData
  }

  const deleteAccount = async (password) => {
    await api.delete('/users/me', { data: { password } })
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
