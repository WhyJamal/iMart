"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Warehouse as WarehouseIcon, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { IPointOption } from "@/types/point.types";
import type { IWarehouse } from "@/types/warehouse.types";
import {
  useCreateWarehouse,
  useUpdateWarehouse,
} from "../_hooks/use-warehouse-mutations";

interface CellRow {
  id?: string;
  key: string; // faqat UI uchun, backendga yubormaymiz
  name: string;
}

interface Props {
  points: IPointOption[];
  warehouse?: IWarehouse;
  onClose?: () => void;
}

export function WarehouseForm({ points, warehouse, onClose }: Props) {
  const router = useRouter();
  const [name, setName] = useState(warehouse?.name ?? "");
  const [pointId, setPointId] = useState(warehouse?.pointId ?? "");
  const [cells, setCells] = useState<CellRow[]>(
    warehouse?.cells.map((c) => ({ id: c.id, key: c.id, name: c.name })) ?? []
  );

  const handleClose = () => {
    if (onClose) onClose();
    else router.push("/warehouses");
  };
  const onDone = () => {
    router.refresh();
    handleClose();
  };

  const { mutate: create, isPending: isCreating } = useCreateWarehouse(onDone);
  const { mutate: update, isPending: isUpdating } = useUpdateWarehouse(onDone);
  const isPending = isCreating || isUpdating;

  const addCell = () =>
    setCells((prev) => [...prev, { key: crypto.randomUUID(), name: "" }]);
  const removeCell = (key: string) =>
    setCells((prev) => prev.filter((c) => c.key !== key));
  const setCellName = (key: string, name: string) =>
    setCells((prev) => prev.map((c) => (c.key === key ? { ...c, name } : c)));

  const handleSubmit = () => {
    const cellsInput = cells
      .filter((c) => c.name.trim())
      .map((c) => (c.id ? { id: c.id, name: c.name.trim() } : { name: c.name.trim() }));

    if (warehouse) {
      update({ id: warehouse.id, name, pointId, cells: cellsInput });
    } else {
      create({ name, pointId, cells: cellsInput });
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <WarehouseIcon className="w-4 h-4" />
          {warehouse ? "Skladni tahrirlash" : "Yangi sklad"}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="space-y-1.5">
          <Label>Nomi</Label>
          <Input
            placeholder="e.g. Asosiy sklad"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Point</Label>
          <Select value={pointId} onValueChange={setPointId}>
            <SelectTrigger>
              <SelectValue placeholder="Nuqtani tanlang" />
            </SelectTrigger>
            <SelectContent>
              {points.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Yacheykalar</Label>
            <Button type="button" variant="outline" size="sm" onClick={addCell}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              Qo'shish
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Sklad ichidagi bo'limlar — masalan "Oddiy non", "Qora non" va h.k.
          </p>

          {cells.map((c) => (
            <div key={c.key} className="flex gap-2">
              <Input
                placeholder="Yacheyka nomi"
                value={c.name}
                onChange={(e) => setCellName(c.key, e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeCell(c.key)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 border-t flex justify-end gap-2">
        <Button variant="ghost" onClick={handleClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isPending || !name.trim() || !pointId}>
          {isPending ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}
