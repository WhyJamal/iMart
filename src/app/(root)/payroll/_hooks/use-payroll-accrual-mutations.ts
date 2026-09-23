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

function useAction<TInput>(
  fn: (input: TInput) => Promise<{ success: boolean; error?: string }>,
  successMsg: string,
  onSuccess?: () => void
) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const mutate = (input: TInput) => {
    startTransition(() => {
      void (async () => {
        const result = await fn(input);
        if (result.success) {
          toast.success(successMsg);
          onSuccess?.();
        } else {
          showPointFundsAwareError(result.error ?? "Xatolik yuz berdi", router);
        }
      })();
    });
  };
  return { mutate, isPending };
}

export function useCreatePayrollAccrual(onSuccess?: () => void) {
  return useAction<CreatePayrollAccrualInput>(
    createPayrollAccrual,
    "Hujjat yaratildi",
    onSuccess
  );
}
export function useDeletePayrollAccrual(onSuccess?: () => void) {
  return useAction<string>(deletePayrollAccrual, "Hujjat o'chirildi", onSuccess);
}
export function useFillPayrollAccrual(onSuccess?: () => void) {
  return useAction<string>(fillPayrollAccrual, "To'ldirildi", onSuccess);
}
export function useUpdateAccrualLine(onSuccess?: () => void) {
  return useAction<UpdateAccrualLineInput>(updateAccrualLine, "Saqlandi", onSuccess);
}
export function useConfirmPayrollAccrual(onSuccess?: () => void) {
  return useAction<string>(
    confirmPayrollAccrual,
    "Tasdiqlandi va to'landi",
    onSuccess
  );
}
