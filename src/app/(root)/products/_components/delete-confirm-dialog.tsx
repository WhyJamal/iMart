"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeleteProduct } from "../_hooks/use-product-mutations";

interface DeleteConfirmDialogProps {
  productId: string | null;
  productName?: string;
  onOpenChange: (open: boolean) => void;
}

export function DeleteConfirmDialog({
  productId,
  productName,
  onOpenChange,
}: DeleteConfirmDialogProps) {
  const { mutate: deleteProduct, isPending } = useDeleteProduct(() =>
    onOpenChange(false)
  );

  return (
    <AlertDialog open={!!productId} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete product?</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="font-medium text-foreground">{productName}</span>{" "}
            will be permanently deleted. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => productId && deleteProduct(productId)}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? "Deleting…" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}