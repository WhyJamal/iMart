"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import type { ProductInput } from "@/schema/product.schema";
import {
  createProduct,
  updateProduct,
  deleteProduct,
} from "../../../../actions/product-actions";

export function useCreateProduct(onSuccess?: () => void) {
  const [isPending, startTransition] = useTransition();

  const mutate = (input: ProductInput) => {
    startTransition(() => {
      void (async () => {
        const result = await createProduct(input);
        if (result.success) {
          toast.success(`Product created. Code: ${result.data.code}`);
          onSuccess?.();
        } else {
          toast.error(result.error);
        }
      })();
    });
  };

  return { mutate, isPending };
}

export function useUpdateProduct(onSuccess?: () => void) {
  const [isPending, startTransition] = useTransition();

  const mutate = (id: string, input: ProductInput) => {
    startTransition(() => {
      void (async () => {
        const result = await updateProduct(id, input);
        if (result.success) {
          toast.success(`Product updated. Code: ${result.data.code}`);
          onSuccess?.();
        } else {
          toast.error(result.error);
        }
      })();
    });
  };

  return { mutate, isPending };
}

export function useDeleteProduct(onSuccess?: () => void) {
  const [isPending, startTransition] = useTransition();

  const mutate = (id: string) => {
    startTransition(() => {
      void (async () => {
        const result = await deleteProduct(id);
        if (result.success) {
          toast.success("Product deleted");
          onSuccess?.();
        } else {
          toast.error(result.error);
        }
      })();
    });
  };

  return { mutate, isPending };
}