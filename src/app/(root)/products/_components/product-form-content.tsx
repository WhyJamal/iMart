"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Image from "next/image";
import Barcode from "react-barcode";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  useCreateProduct,
  useUpdateProduct,
} from "../_hooks/use-product-mutations";

import { IProduct } from "@/types/product.types";
import { ProductInput } from "@/schema/product.schema";
import { uploadProductImage } from "@/utils/upload-product-image";
import { createProductCategory } from "@/actions/product-category-actions";
import {
  UNIT_OPTIONS,
  DEFAULT_UNIT,
} from "@/config/units";

type FormValues = {
  name: string;
  price: string;
  code?: string;
};

interface ICategoryOption {
  id: string;
  name: string;
}

export function ProductFormContent({
  editTarget,
  categories,
  onClose,
}: {
  editTarget?: IProduct | null;
  categories: ICategoryOption[];
  onClose: () => void;
}) {
  const t = useTranslations("product.form");

  const isEdit = !!editTarget;

  const [imageFile, setImageFile] =
    useState<File | null>(null);

  const [previewUrl, setPreviewUrl] = useState("");
  const [codePreview, setCodePreview] = useState("");

  const [categoryOptions, setCategoryOptions] =
    useState<ICategoryOption[]>(categories);

  const [categoryId, setCategoryId] = useState("");
  const [unit, setUnit] = useState<string>(DEFAULT_UNIT);

  const [addingCategory, setAddingCategory] =
    useState(false);

  const [newCategoryName, setNewCategoryName] =
    useState("");

  const [isSavingCategory, setIsSavingCategory] =
    useState(false);

  const { register, handleSubmit, reset } =
    useForm<FormValues>();

  useEffect(() => {
    setCategoryOptions(categories);
  }, [categories]);

  useEffect(() => {
    if (editTarget) {
      reset({
        name: editTarget.name,
        price: String(editTarget.price),
        code: editTarget.code ?? "",
      });

      setPreviewUrl(editTarget.image ?? "");
      setCodePreview(editTarget.code ?? "");
      setCategoryId(editTarget.categoryId ?? "");
      setUnit(editTarget.unit || DEFAULT_UNIT);
    } else {
      reset({
        name: "",
        price: "",
        code: "",
      });

      setPreviewUrl("");
      setCodePreview("");
      setCategoryId("");
      setUnit(DEFAULT_UNIT);
    }

    setAddingCategory(false);
    setNewCategoryName("");
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
    const c =
      "PRD-" +
      Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();

    setCodePreview(c);
  };

  const handleAddCategory = async () => {
    const name = newCategoryName.trim();

    if (!name) return;

    setIsSavingCategory(true);

    const result = await createProductCategory({ name });

    setIsSavingCategory(false);

    if (result.success) {
      setCategoryOptions((prev) => {
        if (prev.some((c) => c.id === result.data.id)) {
          return prev;
        }

        return [...prev, result.data].sort((a, b) =>
          a.name.localeCompare(b.name)
        );
      });

      setCategoryId(result.data.id);
      setAddingCategory(false);
      setNewCategoryName("");
    } else {
      toast.error(result.error);
    }
  };

  const onSubmit = async (data: FormValues) => {
    if (!categoryId) {
      toast.error(t("selectCategory"));
      return;
    }

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
      categoryId,
      unit,
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
          {isEdit
            ? t("editProduct")
            : t("newProduct")}
        </h2>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex-1 overflow-y-auto p-6"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-5">
            <div>
              <Label>{t("name")}</Label>

              <Input
                placeholder={t("namePlaceholder")}
                {...register("name")}
              />
            </div>

            <div>
              <Label>{t("category")}</Label>

              {addingCategory ? (
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    autoFocus
                    placeholder={t("newCategoryPlaceholder")}
                    value={newCategoryName}
                    onChange={(e) =>
                      setNewCategoryName(e.target.value)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void handleAddCategory();
                      }
                    }}
                  />

                  <Button
                    type="button"
                    size="sm"
                    disabled={
                      isSavingCategory ||
                      !newCategoryName.trim()
                    }
                    onClick={handleAddCategory}
                  >
                    {t("add")}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setAddingCategory(false);
                      setNewCategoryName("");
                    }}
                  >
                    {t("cancel")}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <Select
                    value={categoryId}
                    onValueChange={setCategoryId}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={t("selectCategory")}
                      />
                    </SelectTrigger>

                    <SelectContent>
                      {categoryOptions.map((c) => (
                        <SelectItem
                          key={c.id}
                          value={c.id}
                        >
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    title={t("addCategory")}
                    onClick={() => setAddingCategory(true)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            <div>
              <Label>{t("unit")}</Label>

              <Select
                value={unit}
                onValueChange={setUnit}
              >
                <SelectTrigger className="w-full mt-1">
                  <SelectValue
                    placeholder={t("selectUnit")}
                  />
                </SelectTrigger>

                <SelectContent>
                  {UNIT_OPTIONS.map((u) => (
                    <SelectItem
                      key={u.value}
                      value={u.value}
                    >
                      {u.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <p className="text-[11px] text-muted-foreground mt-1">
                {t("unitDescription")}
              </p>
            </div>

            <div>
              <Label>{t("price")}</Label>

              <Input
                type="number"
                placeholder="0.00"
                {...register("price")}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>{t("barcode")}</Label>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateCode}
                >
                  {t("generate")}
                </Button>
              </div>

              {codePreview || editTarget?.code ? (
                <div className="p-4 border rounded-xl flex flex-col items-center gap-2 bg-muted/30">
                  <Barcode
                    value={
                      codePreview || editTarget!.code
                    }
                    height={50}
                  />

                  <span className="text-xs text-muted-foreground">
                    {codePreview || editTarget!.code}
                  </span>
                </div>
              ) : (
                <div className="h-20 flex items-center justify-center border rounded-xl text-sm text-muted-foreground">
                  {t("noBarcode")}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <Label>{t("productImage")}</Label>

              <div className="mt-2 border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-sm text-muted-foreground">
                <input
                  type="file"
                  className="hidden"
                  id="imageUpload"
                  onChange={(e) =>
                    onImageChange(e.target.files?.[0])
                  }
                />

                <label
                  htmlFor="imageUpload"
                  className="cursor-pointer text-primary font-medium"
                >
                  {t("clickToUpload")}
                </label>

                <span className="text-xs mt-1">
                  {t("imageDescription")}
                </span>
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
          {t("cancel")}
        </Button>

        <Button onClick={handleSubmit(onSubmit)}>
          {t("save")}
        </Button>
      </div>
    </div>
  );
}