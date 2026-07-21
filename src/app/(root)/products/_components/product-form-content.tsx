"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Image from "next/image";
import Barcode from "react-barcode";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import { useCreateProduct, useUpdateProduct } from "../_hooks/use-product-mutations";
import { IProduct } from "@/types/product.types";
import { ProductInput } from "@/schema/product.schema";
import { uploadProductImage } from "@/utils/upload-product-image";

type FormValues = {
  name: string;
  price: string;
  code?: string;
  category: string;
};

export function ProductFormContent({
  editTarget,
  onClose,
}: {
  editTarget?: IProduct | null;
  onClose: () => void;
}) {
  const isEdit = !!editTarget;

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [codePreview, setCodePreview] = useState("");

  const { register, handleSubmit, reset } = useForm<FormValues>();

  useEffect(() => {
    if (editTarget) {
      reset({
        name: editTarget.name,
        price: String(editTarget.price),
        code: editTarget.code ?? "",
        category: editTarget.category,
      });
      setPreviewUrl(editTarget.image ?? "");
      setCodePreview(editTarget.code ?? "");
    } else {
      reset({ name: "", price: "", code: "", category: "" });
      setPreviewUrl("");
      setCodePreview("");
    }
  }, [editTarget, reset]);

  const { mutate: create } = useCreateProduct(onClose);
  const { mutate: update } = useUpdateProduct(onClose);

  const onImageChange = (file?: File) => {
    if (!file) return;

    setImageFile(file); 
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const generateCode = () => {
    const c = "PRD-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    setCodePreview(c);
  };

  const onSubmit = async (data: FormValues) => {
    let imageUrl = editTarget?.image || "";

    if (imageFile) {
      const res = await uploadProductImage(
        imageFile,
        editTarget?.image ?? undefined
      );
      imageUrl = res.url;
    }

    const input: ProductInput = {
      name: data.name,
      price: parseFloat(data.price),
      code: data.code || codePreview,
      category: data.category,
      image: imageUrl,
    };

    if (isEdit && editTarget) {
      update(editTarget.id, input);
    } else {
      create(input);
    }
  };

  return (
    <div className="h-full flex flex-col">

      <div className="px-6 py-4 border-b flex items-center justify-between">
        <h2 className="text-base font-semibold">
          {isEdit ? "Edit product" : "New product"}
        </h2>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex-1 overflow-y-auto p-6"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <div className="space-y-5">
            <div>
              <Label>Name</Label>
              <Input placeholder="Espresso" {...register("name")} />
            </div>

            <div>
              <Label>Category</Label>
              <Input placeholder="Coffee" {...register("category")} />
            </div>

            <div>
              <Label>Price</Label>
              <Input type="number" placeholder="0.00" {...register("price")} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Barcode</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateCode}
                >
                  Generate
                </Button>
              </div>

              {(codePreview || editTarget?.code) ? (
                <div className="p-4 border rounded-xl flex flex-col items-center gap-2 bg-muted/30">
                  <Barcode
                    value={codePreview || editTarget!.code}
                    height={50}
                  />
                  <span className="text-xs text-muted-foreground">
                    {codePreview || editTarget!.code}
                  </span>
                </div>
              ) : (
                <div className="h-20 flex items-center justify-center border rounded-xl text-sm text-muted-foreground">
                  No barcode
                </div>
              )}
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <Label>Product Image</Label>

              <div className="mt-2 border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-sm text-muted-foreground">
                <input
                  type="file"
                  className="hidden"
                  id="imageUpload"
                  onChange={(e) => onImageChange(e.target.files?.[0])}
                />

                <label
                  htmlFor="imageUpload"
                  className="cursor-pointer text-primary font-medium"
                >
                  Click to upload
                </label>

                <span className="text-xs mt-1">PNG, JPG up to 5MB</span>
              </div>

              {previewUrl && (
                <div className="relative h-48 mt-4 rounded-xl overflow-hidden border">
                  <Image
                    src={previewUrl}
                    alt="preview"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
            </div>
          </div>

        </div>
      </form>

      <div className="p-4 border-t flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit(onSubmit)}>
          Save product
        </Button>
      </div>
    </div>
  );
}