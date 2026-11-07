import axios from 'axios'

const ACCESS_KEY = 'finance-app:accessToken'
const REFRESH_KEY = 'finance-app:refreshToken'

export const tokenStorage = {
  getAccess: () => localStorage.getItem(ACCESS_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  set: ({ accessToken, refreshToken }) => {
    localStorage.setItem(ACCESS_KEY, accessToken)
    localStorage.setItem(REFRESH_KEY, refreshToken)
  },
  clear: () => {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
  },
}

// Em produção pode apontar para outra URL (ex.: API hospedada no Render).
// Sem a variável, usa o proxy /api (Vite em dev, Nginx no Docker).
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
})

// Pedidos que passaram de 4 s: mostram o aviso de "servidor acordando" (components/aviso-servidor-lento.jsx).
let lentos = 0
const marcarLento = (delta) => {
  lentos = Math.max(0, lentos + delta)
  window.dispatchEvent(new CustomEvent('valtrea:lento', { detail: lentos }))
}
const iniciarRelogio = (config) => {
  config._relogio = setTimeout(() => {
    config._avisou = true
    marcarLento(1)
  }, 4000)
}
const pararRelogio = (config) => {
  if (!config) return
  clearTimeout(config._relogio)
  if (config._avisou) {
    config._avisou = false
    marcarLento(-1)
  }
}

api.interceptors.request.use((config) => {
  iniciarRelogio(config)
  const token = tokenStorage.getAccess()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Um único refresh em andamento por vez, mesmo com várias requisições falhando juntas
let refreshPromise = null

const refreshTokens = async () => {
  const refreshToken = tokenStorage.getRefresh()
  if (!refreshToken) throw new Error('Sem refresh token')
  const { data } = await axios.post(`${api.defaults.baseURL}/users/refresh-token`, {
    refreshToken,
  })
  tokenStorage.set(data)
  return data.accessToken
}

api.interceptors.response.use(
  (response) => {
    pararRelogio(response.config)
    return response
  },
  async (error) => {
    pararRelogio(error.config)
    const original = error.config
    const status = error.response?.status
    const isAuthRoute =
      original?.url?.includes('/users/login') || original?.url?.includes('/users/refresh-token')

    if (status === 401 && original && !original._retry && !isAuthRoute) {
      original._retry = true
      try {
        if (!refreshPromise) {
          refreshPromise = refreshTokens().finally(() => {
            refreshPromise = null
          })
        }
        const accessToken = await refreshPromise
        original.headers.Authorization = `Bearer ${accessToken}`
        return api(original)
      } catch {
        tokenStorage.clear()
        window.dispatchEvent(new Event('finance-app:logout'))
      }
    }
    return Promise.reject(error)
  },
)

export const getErrorMessage = (error, fallback = 'Algo deu errado. Tente novamente.') => {
  // Mensagens que dizem o que fazer, não só o que deu errado
  if (!error?.response) return 'Sem conexão com o servidor. Confira a internet e tente de novo. Na primeira vez do dia, ele pode levar até 1 minuto para acordar.'
  const status = error.response.status
  const message = error.response.data?.message
  if (status >= 500) return 'Tivemos um problema do nosso lado. Tente de novo em alguns minutos; se continuar, conte para nós em "Enviar sugestão", no rodapé.'
  if (status === 429) return message || 'Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo.'
  if (!message) return fallback
  if (message.includes('already in use')) return 'Este e-mail já está em uso. Se a conta é sua, entre ou use "Esqueci a senha".'
  if (message === 'Forbidden') return 'Você não tem permissão para esta ação. Confira se entrou com a conta certa.'
  if (message.toLowerCase().includes('not found')) return 'Não encontramos este registro. Ele pode ter sido apagado; atualize a página.'
  return message
}
