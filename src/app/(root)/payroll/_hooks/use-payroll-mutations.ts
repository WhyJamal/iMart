"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import type { CreatePayrollPaymentInput } from "@/schema/payroll.schema";
import { createPayrollPayment, deletePayrollPayment } from "@/actions/payroll-actions";

export function useCreatePayrollPayment(onSuccess?: () => void) {
  const [isPending, startTransition] = useTransition();

  const mutate = (input: CreatePayrollPaymentInput) => {
    startTransition(() => {
      void (async () => {
        const result = await createPayrollPayment(input);
        if (result.success) {
          toast.success(`To'landi: ${result.data.totalAmount.toFixed(2)} сум`);
          onSuccess?.();
        } else {
          toast.error(result.error);
        }
      })();
    });
  };

  return { mutate, isPending };
}

export function useDeletePayrollPayment(onSuccess?: () => void) {
  const [isPending, startTransition] = useTransition();

  const mutate = (id: string) => {
    startTransition(() => {
      void (async () => {
        const result = await deletePayrollPayment(id);
        if (result.success) {
          toast.success("To'lov o'chirildi");
          onSuccess?.();
        } else {
          toast.error(result.error);
        }
      })();
    });
  };

  return { mutate, isPending };
}
