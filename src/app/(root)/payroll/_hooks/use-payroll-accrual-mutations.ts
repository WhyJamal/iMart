"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { showPointFundsAwareError } from "@/lib/point-funds-error";

import type {
  CreatePayrollAccrualInput,
  UpdateAccrualLineInput,
} from "@/schema/payroll-accrual.schema";

import {
  createPayrollAccrual,
  deletePayrollAccrual,
  fillPayrollAccrual,
  updateAccrualLine,
  confirmPayrollAccrual,
} from "@/actions/payroll-accrual-actions";

import type { ActionResult } from "@/types/action-result.types";

function useAction<TInput, TData = undefined>(
  fn: (input: TInput) => Promise<ActionResult<TData>>,
  successMsg: string,
  onSuccess?: (data: TData | undefined) => void
) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const mutate = (input: TInput) => {
    startTransition(() => {
      void (async () => {
        const result = await fn(input);

        if (result.success) {
          toast.success(successMsg);
          onSuccess?.(result.data);
        } else {
          showPointFundsAwareError(
            result.error ?? "Xatolik yuz berdi",
            router
          );
        }
      })();
    });
  };

  return { mutate, isPending };
}

export function useCreatePayrollAccrual(
  onSuccess?: (data: { id: string } | undefined) => void
) {
  return useAction<CreatePayrollAccrualInput, { id: string }>(
    createPayrollAccrual,
    "Hujjat yaratildi",
    onSuccess
  );
}

export function useDeletePayrollAccrual(onSuccess?: () => void) {
  return useAction<string, undefined>(
    deletePayrollAccrual,
    "Hujjat o'chirildi",
    onSuccess
  );
}

export function useFillPayrollAccrual(
  onSuccess?: (data: { addedCount: number } | undefined) => void
) {
  return useAction<string, { addedCount: number }>(
    fillPayrollAccrual,
    "To'ldirildi",
    onSuccess
  );
}

export function useUpdateAccrualLine(onSuccess?: () => void) {
  return useAction<UpdateAccrualLineInput, undefined>(
    updateAccrualLine,
    "Saqlandi",
    onSuccess
  );
}

export function useConfirmPayrollAccrual(onSuccess?: () => void) {
  return useAction<string, undefined>(
    confirmPayrollAccrual,
    "Tasdiqlandi va to'landi",
    onSuccess
  );
}