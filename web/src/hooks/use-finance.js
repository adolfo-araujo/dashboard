import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export const useBalance = (from, to) =>
  useQuery({
    queryKey: ['balance', from, to],
    queryFn: async () => (await api.get('/users/me/balance', { params: { from, to } })).data,
    enabled: from <= to,
  })

export const useTransactions = (from, to) =>
  useQuery({
    queryKey: ['transactions', from, to],
    queryFn: async () => (await api.get('/transactions/me', { params: { from, to } })).data,
    enabled: from <= to,
  })

const useInvalidate = () => {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: ['balance'] })
    queryClient.invalidateQueries({ queryKey: ['transactions'] })
  }
}

export const useCreateTransaction = () => {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: async (values) => (await api.post('/transactions/me', values)).data,
    onSuccess: invalidate,
  })
}

export const useUpdateTransaction = () => {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: async ({ id, ...values }) =>
      (await api.patch(`/transactions/me/${id}`, values)).data,
    onSuccess: invalidate,
  })
}

export const useDeleteTransaction = () => {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/transactions/me/${id}`)).data,
    onSuccess: invalidate,
  })
}
