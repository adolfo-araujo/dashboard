import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export const useBudgetStatus = (month) =>
  useQuery({
    queryKey: ['budgets', month],
    queryFn: async () => (await api.get('/budgets', { params: { month } })).data,
  })

export const useSaveBudgets = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (budgets) => (await api.put('/budgets', { budgets })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['budgets'] }),
  })
}
