"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteConfirmDialog } from "./delete-confirm-dialog";
import { IProduct } from "@/types/product.types";
import { Drawer } from "@/components/drawer";
import { ProductFormContent } from "./product-form-content";
import { getUnitLabel } from "@/config/units";

interface ICategoryOption {
  id: string;
  name: string;
}

interface ProductsClientProps {
  initialProducts: IProduct[];
  categories: ICategoryOption[];
}

const fmt = (n: number) =>
  new Intl.NumberFormat("ru-RU", { style: "currency", currency: "UZS" }).format(n);

export function ProductsClient({ initialProducts, categories }: ProductsClientProps) {
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<IProduct | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return initialProducts;
    return initialProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q)
    );
  }, [initialProducts, search]);

  const usedCategories = useMemo(
    () => [...new Set(initialProducts.map((p) => p.categoryName))],
    [initialProducts]
  );

  const handleEdit = (product: IProduct) => {
    setEditTarget(product);
    setFormOpen(true);
  };

  const handleCreate = () => {
    setEditTarget(null);
    setFormOpen(true);
  };

  const deleteTarget = initialProducts.find((p) => p.id === deleteId);

  return (
    <>
      <div className="relative h-full">

        <Drawer open={formOpen} onClose={() => setFormOpen(false)}>
          <ProductFormContent
            editTarget={editTarget}
            categories={categories}
            onClose={() => setFormOpen(false)}
          />
        </Drawer>

        <div className="flex flex-col gap-6 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Products</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {initialProducts.length} product{initialProducts.length !== 1 ? "s" : ""} across{" "}
                {usedCategories.length} categor{usedCategories.length !== 1 ? "ies" : "y"}
              </p>
            </div>

            <Button onClick={handleCreate} size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" />
              New product
            </Button>
          </div>

          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, code or category…"
              className="pl-9 h-9"
            />
          </div>

          <div className="rounded-xl border bg-white overflow-hidden">
            {filtered.length === 0 ? (
              <EmptyState hasSearch={!!search} onCreate={handleCreate} />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/70 hover:bg-gray-50/70">
                    <TableHead className="w-12" />
                    <TableHead>Product</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filtered.map((product) => (
                    <TableRow key={product.id} className="group">
                      <TableCell className="py-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                          {product.image ? (
                            <Image
                              src={product.image}
                              alt={product.name}
                              width={40}
                              height={40}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <Package className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="font-medium">{product.name}</TableCell>

                      <TableCell>
                        <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                          {product.code}
                        </span>
                      </TableCell>

                      <TableCell>
                        <Badge variant="secondary" className="font-normal">
                          {product.categoryName}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground">
                        {getUnitLabel(product.unit)}
                      </TableCell>

                      <TableCell className="text-right font-medium tabular-nums">
                        {fmt(product.price)}
                      </TableCell>

                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => handleEdit(product)}>
                              <Pencil className="w-3.5 h-3.5 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeleteId(product.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

        <DeleteConfirmDialog
          productId={deleteId}
          productName={deleteTarget?.name}
          onOpenChange={(open) => !open && setDeleteId(null)}
        />
      </div>
    </>
  );
}

function EmptyState({
  hasSearch,
  onCreate,
}: {
  hasSearch: boolean;
  onCreate: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-4">
        <Package className="w-5 h-5 text-gray-400" />
      </div>
      <p className="text-sm font-medium text-gray-900">
        {hasSearch ? "No products found" : "No products yet"}
      </p>
      <p className="text-sm text-muted-foreground mt-1 max-w-xs">
        {hasSearch
          ? "Try adjusting your search term."
          : "Add your first product to get started."}
      </p>
      {!hasSearch && (
        <Button onClick={onCreate} size="sm" className="mt-4 gap-1.5">
          <Plus className="w-4 h-4" />
          New product
        </Button>
      )}
    </div>
  );
}