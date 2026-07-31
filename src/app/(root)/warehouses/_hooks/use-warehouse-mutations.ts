"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import type {
  CreateWarehouseInput,
  UpdateWarehouseInput,
} from "@/schema/warehouse.schema";
import {
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
} from "@/actions/warehouse-actions";

export function useCreateWarehouse(onSuccess?: () => void) {
  const [isPending, startTransition] = useTransition();
  const mutate = (input: CreateWarehouseInput) => {
    startTransition(() => {
      void (async () => {
        const result = await createWarehouse(input);
        if (result.success) {
          toast.success("Sklad yaratildi");
          onSuccess?.();
        } else {
          toast.error(result.error);
        }
      })();
    });
  };
  return { mutate, isPending };
}

export function useUpdateWarehouse(onSuccess?: () => void) {
  const [isPending, startTransition] = useTransition();
  const mutate = (input: UpdateWarehouseInput) => {
    startTransition(() => {
      void (async () => {
        const result = await updateWarehouse(input);
        if (result.success) {
          toast.success("Sklad yangilandi");
          onSuccess?.();
        } else {
          toast.error(result.error);
        }
      })();
    });
  };
  return { mutate, isPending };
}

export function useDeleteWarehouse(onSuccess?: () => void) {
  const [isPending, startTransition] = useTransition();
  const mutate = (id: string) => {
    startTransition(() => {
      void (async () => {
        const result = await deleteWarehouse(id);
        if (result.success) {
          toast.success("Sklad o'chirildi");
          onSuccess?.();
        } else {
          toast.error(result.error);
        }
      })();
    });
  };
  return { mutate, isPending };
}
