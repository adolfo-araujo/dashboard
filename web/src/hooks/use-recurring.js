import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { today } from '../lib/format'

export const useRecurringList = (enabled = true) =>
  useQuery({
    queryKey: ['recurring'],
    queryFn: async () => (await api.get('/recurring')).data,
    enabled,
  })

// Lança as recorrentes que já venceram e atualiza o painel se algo foi criado
export const useSyncRecurring = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => (await api.post('/recurring/sync', { today: today() })).data,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['recurring'] })
      if (data?.created > 0) {
        queryClient.invalidateQueries({ queryKey: ['balance'] })
        queryClient.invalidateQueries({ queryKey: ['transactions'] })
        queryClient.invalidateQueries({ queryKey: ['monthly'] })
      }
    },
  })
}

const useRecurringMutation = (mutationFn) => {
  const sync = useSyncRecurring()
  return useMutation({
    mutationFn,
    onSuccess: () => sync.mutate(),
  })
}

export const useCreateRecurring = () =>
  useRecurringMutation(async (values) => (await api.post('/recurring', values)).data)

export const useUpdateRecurring = () =>
  useRecurringMutation(async ({ id, ...values }) => (await api.patch(`/recurring/${id}`, values)).data)

export const useDeleteRecurring = () =>
  useRecurringMutation(async (id) => (await api.delete(`/recurring/${id}`)).data)
