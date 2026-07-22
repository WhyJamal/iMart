"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import type { SetSalaryRateInput } from "@/schema/payroll.schema";
import { setSalaryRate } from "@/actions/salary-actions";

export function useSetSalaryRate(onSuccess?: () => void) {
  const [isPending, startTransition] = useTransition();

  const mutate = (input: SetSalaryRateInput) => {
    startTransition(() => {
      void (async () => {
        const result = await setSalaryRate(input);
        if (result.success) {
          toast.success("Stavka saqlandi");
          onSuccess?.();
        } else {
          toast.error(result.error);
        }
      })();
    });
  };

  return { mutate, isPending };
}