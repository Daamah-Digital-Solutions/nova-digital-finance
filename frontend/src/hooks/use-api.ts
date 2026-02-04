"use client";

import {
  useQuery,
  useMutation,
  type UseQueryOptions,
  type UseMutationOptions,
  type QueryKey,
} from "@tanstack/react-query";
import api from "@/lib/api";
import type { AxiosError, AxiosResponse } from "axios";
import type { ApiError } from "@/types";

export function useApiQuery<TData = unknown>(
  key: QueryKey,
  url: string,
  options?: Omit<
    UseQueryOptions<TData, AxiosError<ApiError>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery<TData, AxiosError<ApiError>>({
    queryKey: key,
    queryFn: async () => {
      const response: AxiosResponse<TData> = await api.get(url);
      return response.data;
    },
    ...options,
  });
}

export function useApiMutation<TData = unknown, TVariables = unknown>(
  url: string,
  options?: Omit<
    UseMutationOptions<TData, AxiosError<ApiError>, TVariables>,
    "mutationFn"
  >
) {
  return useMutation<TData, AxiosError<ApiError>, TVariables>({
    mutationFn: async (data: TVariables) => {
      const response: AxiosResponse<TData> = await api.post(url, data);
      return response.data;
    },
    ...options,
  });
}

export function useApiPatch<TData = unknown, TVariables = unknown>(
  url: string,
  options?: Omit<
    UseMutationOptions<TData, AxiosError<ApiError>, TVariables>,
    "mutationFn"
  >
) {
  return useMutation<TData, AxiosError<ApiError>, TVariables>({
    mutationFn: async (data: TVariables) => {
      const response: AxiosResponse<TData> = await api.patch(url, data);
      return response.data;
    },
    ...options,
  });
}

export function useApiDelete<TData = unknown>(
  url: string,
  options?: Omit<
    UseMutationOptions<TData, AxiosError<ApiError>, void>,
    "mutationFn"
  >
) {
  return useMutation<TData, AxiosError<ApiError>, void>({
    mutationFn: async () => {
      const response: AxiosResponse<TData> = await api.delete(url);
      return response.data;
    },
    ...options,
  });
}
