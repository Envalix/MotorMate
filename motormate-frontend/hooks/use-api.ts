import { useQuery, useMutation, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AxiosError } from 'axios';

export function useGet<T>(
  key: string[],
  url: string,
  options?: Omit<UseQueryOptions<T, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<T, AxiosError>({
    queryKey: key,
    queryFn: async () => {
      const { data } = await api.get<T>(url);
      return data;
    },
    ...options,
  });
}

export function usePost<TData, TVariables>(
  url: string,
  options?: UseMutationOptions<TData, AxiosError, TVariables>,
) {
  return useMutation<TData, AxiosError, TVariables>({
    mutationFn: async (variables) => {
      const { data } = await api.post<TData>(url, variables);
      return data;
    },
    ...options,
  });
}

export function usePatch<TData, TVariables>(
  url: string,
  options?: UseMutationOptions<TData, AxiosError, TVariables>,
) {
  return useMutation<TData, AxiosError, TVariables>({
    mutationFn: async (variables) => {
      const { data } = await api.patch<TData>(url, variables);
      return data;
    },
    ...options,
  });
}

export function useDelete<TData>(
  url: string,
  options?: UseMutationOptions<TData, AxiosError, void>,
) {
  return useMutation<TData, AxiosError, void>({
    mutationFn: async () => {
      const { data } = await api.delete<TData>(url);
      return data;
    },
    ...options,
  });
}
