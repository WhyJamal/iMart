"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import type { CreatePointInput, UpdatePointInput } from "@/schema/point.schema";
import { createPoint, updatePoint, deletePoint } from "@/actions/point-actions";

export function useCreatePoint(onSuccess?: () => void) {
  const [isPending, startTransition] = useTransition();
  const mutate = (input: CreatePointInput) => {
    startTransition(() => {
      void (async () => {
        const result = await createPoint(input);
        if (result.success) {
          toast.success("Nuqta yaratildi");
          onSuccess?.();
        } else {
          toast.error(result.error);
        }
      })();
    });
  };
  return { mutate, isPending };
}

export function useUpdatePoint(onSuccess?: () => void) {
  const [isPending, startTransition] = useTransition();
  const mutate = (input: UpdatePointInput) => {
    startTransition(() => {
      void (async () => {
        const result = await updatePoint(input);
        if (result.success) {
          toast.success("Nuqta yangilandi");
          onSuccess?.();
        } else {
          toast.error(result.error);
        }
      })();
    });
  };
  return { mutate, isPending };
}

export function useDeletePoint(onSuccess?: () => void) {
  const [isPending, startTransition] = useTransition();
  const mutate = (id: string) => {
    startTransition(() => {
      void (async () => {
        const result = await deletePoint(id);
        if (result.success) {
          toast.success("Nuqta o'chirildi");
          onSuccess?.();
        } else {
          toast.error(result.error);
        }
      })();
    });
  };
  return { mutate, isPending };
}
