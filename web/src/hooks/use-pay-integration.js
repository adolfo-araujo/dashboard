import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

const KEY = ['pay-integration']

export const usePayIntegration = () =>
  useQuery({
    queryKey: KEY,
    queryFn: async () => (await api.get('/integrations/pay')).data,
  })

export const useCreatePayToken = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => (await api.post('/integrations/pay/token')).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  })
}

export const useDisconnectPay = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => (await api.delete('/integrations/pay')).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  })
}
