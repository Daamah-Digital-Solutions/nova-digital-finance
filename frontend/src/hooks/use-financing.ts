"use client";

import { useApiQuery } from "@/hooks/use-api";
import type {
  FinancingApplication,
  Installment,
  CalculatorResult,
  PaginatedResponse,
} from "@/types";

export function useApplications() {
  return useApiQuery<PaginatedResponse<FinancingApplication>>(
    ["financing", "applications"],
    "/financing/"
  );
}

export function useApplication(id: string) {
  return useApiQuery<FinancingApplication>(
    ["financing", "applications", id],
    `/financing/${id}/`,
    {
      enabled: !!id,
    }
  );
}

export function useInstallments(id: string) {
  return useApiQuery<PaginatedResponse<Installment>>(
    ["financing", "installments", id],
    `/financing/${id}/installments/`,
    {
      enabled: !!id,
    }
  );
}

export function useStatement(id: string) {
  return useApiQuery<Blob>(
    ["financing", "statement", id],
    `/financing/${id}/statement/`,
    {
      enabled: !!id,
    }
  );
}

export function useCalculator(amount: number, period: number) {
  return useApiQuery<CalculatorResult>(
    ["financing", "calculator", amount, period],
    `/financing/calculator/?amount=${amount}&period=${period}`,
    {
      enabled: amount > 0 && period > 0,
    }
  );
}

export function useFinancing() {
  return {
    useApplications,
    useApplication,
    useInstallments,
    useStatement,
    useCalculator,
  };
}
