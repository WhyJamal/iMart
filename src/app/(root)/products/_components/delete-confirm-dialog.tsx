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
import { useTranslations } from "next-intl";
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
  const t = useTranslations("product.delete");

  const { mutate: deleteProduct, isPending } = useDeleteProduct(() =>
    onOpenChange(false)
  );

  return (
    <AlertDialog open={!!productId} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("title")}</AlertDialogTitle>

          <AlertDialogDescription>
            {t("description", {
              name: productName ?? "",
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {t("cancel")}
          </AlertDialogCancel>

          <AlertDialogAction
            onClick={() => productId && deleteProduct(productId)}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? t("deleting") : t("delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}