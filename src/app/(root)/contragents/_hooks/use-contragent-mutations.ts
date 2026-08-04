"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import type {
  CreateContragentInput,
  UpdateContragentInput,
} from "@/schema/contragent.schema";
import {
  createContragent,
  updateContragent,
  deleteContragent,
} from "@/actions/contragent-actions";

export function useCreateContragent(onSuccess?: () => void) {
  const [isPending, startTransition] = useTransition();
  const mutate = (input: CreateContragentInput) => {
    startTransition(() => {
      void (async () => {
        const result = await createContragent(input);
        if (result.success) {
          toast.success("Kontragent yaratildi");
          onSuccess?.();
        } else {
          toast.error(result.error);
        }
      })();
    });
  };
  return { mutate, isPending };
}

export function useUpdateContragent(onSuccess?: () => void) {
  const [isPending, startTransition] = useTransition();
  const mutate = (input: UpdateContragentInput) => {
    startTransition(() => {
      void (async () => {
        const result = await updateContragent(input);
        if (result.success) {
          toast.success("Kontragent yangilandi");
          onSuccess?.();
        } else {
          toast.error(result.error);
        }
      })();
    });
  };
  return { mutate, isPending };
}

export function useDeleteContragent(onSuccess?: () => void) {
  const [isPending, startTransition] = useTransition();
  const mutate = (id: string) => {
    startTransition(() => {
      void (async () => {
        const result = await deleteContragent(id);
        if (result.success) {
          toast.success("Kontragent o'chirildi");
          onSuccess?.();
        } else {
          toast.error(result.error);
        }
      })();
    });
  };
  return { mutate, isPending };
}
