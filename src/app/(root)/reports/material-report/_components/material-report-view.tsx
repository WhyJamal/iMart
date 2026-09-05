"use client";

import { useMemo, useState, useTransition } from "react";

import { useTranslations } from "next-intl";

import { FileBarChart, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { getMaterialReport } from "@/actions/reports/material-report-actions";

import type { IMaterialReportRow } from "@/types/material-report.types";
import type { IPointOption } from "@/types/point.types";
import type { IWarehouse } from "@/types/warehouse.types";
import type { IProduct } from "@/types/product.types";

const ALL = "all";

interface Category {
  id: string;
  name: string;
}

interface Props {
  initialRows: IMaterialReportRow[];
  points: IPointOption[];
  warehouses: IWarehouse[];
  products: IProduct[];
  categories: Category[];
}

const fmtNum = (n: number) =>
  n.toLocaleString("uz-UZ", { maximumFractionDigits: 3 });

const fmtSum = (n: number) => n.toLocaleString("uz-UZ") + " so'm";

export function MaterialReportView({
  initialRows,
  points,
  warehouses,
  products,
  categories,
}: Props) {
  const t = useTranslations("material-report.warehouse");

  const [isPending, startTransition] = useTransition();

  const [rows, setRows] = useState(initialRows);

  const [pointId, setPointId] = useState(ALL);
  const [warehouseId, setWarehouseId] = useState(ALL);
  const [categoryId, setCategoryId] = useState(ALL);
  const [productId, setProductId] = useState(ALL);

  const filteredWarehouses = useMemo(
    () =>
      pointId === ALL ? warehouses : warehouses.filter((w) => w.pointId === pointId),
    [warehouses, pointId]
  );

  const filteredProducts = useMemo(
    () =>
      categoryId === ALL
        ? products
        : products.filter((p) => p.categoryId === categoryId),
    [products, categoryId]
  );

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, r) => ({ amount: acc.amount + r.amount }),
        { amount: 0 }
      ),
    [rows]
  );

  const refresh = (next: {
    pointId?: string;
    warehouseId?: string;
    categoryId?: string;
    productId?: string;
  }) => {
    const nextPointId = next.pointId ?? pointId;
    const nextWarehouseId = next.warehouseId ?? warehouseId;
    const nextCategoryId = next.categoryId ?? categoryId;
    const nextProductId = next.productId ?? productId;

    startTransition(async () => {
      const data = await getMaterialReport({
        pointId: nextPointId === ALL ? undefined : nextPointId,
        warehouseId: nextWarehouseId === ALL ? undefined : nextWarehouseId,
        categoryId: nextCategoryId === ALL ? undefined : nextCategoryId,
        productId: nextProductId === ALL ? undefined : nextProductId,
      });
      setRows(data);
    });
  };

  const handlePointChange = (value: string) => {
    setPointId(value);
    setWarehouseId(ALL);
    refresh({ pointId: value, warehouseId: ALL });
  };

  const handleWarehouseChange = (value: string) => {
    setWarehouseId(value);
    refresh({ warehouseId: value });
  };

  const handleCategoryChange = (value: string) => {
    setCategoryId(value);
    setProductId(ALL);
    refresh({ categoryId: value, productId: ALL });
  };

  const handleProductChange = (value: string) => {
    setProductId(value);
    refresh({ productId: value });
  };

  const handleReset = () => {
    setPointId(ALL);
    setWarehouseId(ALL);
    setCategoryId(ALL);
    setProductId(ALL);
    refresh({
      pointId: ALL,
      warehouseId: ALL,
      categoryId: ALL,
      productId: ALL,
    });
  };

  const hasFilters =
    pointId !== ALL ||
    warehouseId !== ALL ||
    categoryId !== ALL ||
    productId !== ALL;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 pt-6">
          <div className="min-w-45 space-y-1.5">
            <label className="text-sm text-muted-foreground">
              {t("filters.point")}
            </label>
            <Select value={pointId} onValueChange={handlePointChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t("filters.all")}</SelectItem>
                {points.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-45 space-y-1.5">
            <label className="text-sm text-muted-foreground">
              {t("filters.warehouse")}
            </label>
            <Select value={warehouseId} onValueChange={handleWarehouseChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t("filters.all")}</SelectItem>
                {filteredWarehouses.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-45 space-y-1.5">
            <label className="text-sm text-muted-foreground">
              {t("filters.category")}
            </label>
            <Select value={categoryId} onValueChange={handleCategoryChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t("filters.all")}</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-50 space-y-1.5">
            <label className="text-sm text-muted-foreground">
              {t("filters.product")}
            </label>
            <Select value={productId} onValueChange={handleProductChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t("filters.all")}</SelectItem>
                {filteredProducts.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {t("filters.reset")}
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 overflow-x-auto">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
              <FileBarChart className="w-8 h-8" />
              <p className="text-sm">{t("empty")}</p>
            </div>
          ) : (
            <Table className={isPending ? "opacity-50 transition-opacity" : ""}>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("table.product")}</TableHead>
                  <TableHead>{t("table.code")}</TableHead>
                  <TableHead>{t("table.category")}</TableHead>
                  <TableHead>{t("table.point")}</TableHead>
                  <TableHead>{t("table.warehouse")}</TableHead>
                  <TableHead>{t("table.cell")}</TableHead>
                  <TableHead className="text-right">{t("table.qty")}</TableHead>
                  <TableHead>{t("table.unit")}</TableHead>
                  <TableHead className="text-right">{t("table.price")}</TableHead>
                  <TableHead className="text-right">{t("table.amount")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={`${r.productId}:${r.cellId}`}>
                    <TableCell className="font-medium">{r.productName}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.productCode}
                    </TableCell>
                    <TableCell>{r.categoryName}</TableCell>
                    <TableCell>{r.pointName}</TableCell>
                    <TableCell>{r.warehouseName}</TableCell>
                    <TableCell>{r.cellName}</TableCell>
                    <TableCell className="text-right">{fmtNum(r.qty)}</TableCell>
                    <TableCell className="text-muted-foreground">{r.unit}</TableCell>
                    <TableCell className="text-right">{fmtSum(r.price)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {fmtSum(r.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={9}>{t("table.total")}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {fmtSum(totals.amount)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
