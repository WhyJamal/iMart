"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { IPoint } from "@/types/point.types";
import {
  useCreatePoint,
  useUpdatePoint,
} from "../_hooks/use-point-mutations";
import { useTranslations } from "next-intl";

interface Props {
  point?: IPoint;
  onClose?: () => void;
}

export function PointForm({ point, onClose }: Props) {
  const router = useRouter();
  const t = useTranslations("point.form");

  const [name, setName] = useState(point?.name ?? "");

  const handleClose = () => {
    if (onClose) onClose();
    else router.push("/points");
  };

  const onDone = () => {
    router.refresh();
    handleClose();
  };

  const {
    mutate: create,
    isPending: isCreating,
  } = useCreatePoint(onDone);

  const {
    mutate: update,
    isPending: isUpdating,
  } = useUpdatePoint(onDone);

  const isPending = isCreating || isUpdating;

  const handleSubmit = () => {
    if (point) {
      update({
        id: point.id,
        name,
      });
    } else {
      create({ name });
    }
  };

  return (
    <div className="relative h-full overflow-hidden bg-background rounded-2xl">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Main primary glow */}
        <div className="absolute -right-52 top-1/4 h-162.5 w-162.5 rounded-full bg-primary/5.5 blur-3xl" />

        <div className="absolute -bottom-48 -right-32 h-137.5 w-137.5 rounded-full bg-primary/4.5 blur-3xl" />

        {/* Abstract map */}
        <svg
          viewBox="0 0 600 900"
          className="absolute -right-44 top-1/2 h-237.5 w-162.5 -translate-y-1/2 text-primary opacity-[0.09]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Roads */}
          <path
            d="M50 30
           C160 130 110 220 250 300
           C390 380 420 470 330 570
           C250 660 300 760 530 870"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
          />

          <path
            d="M530 10
           C400 130 450 240 320 340
           C180 450 140 520 220 640
           C290 750 450 760 410 910"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />

          <path
            d="M0 280
           C120 330 190 410 310 390
           C450 365 500 330 620 400"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />

          <path
            d="M20 700
           C150 650 190 700 300 740
           C420 785 480 690 620 650"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Map blocks */}
          <path
            d="M280 210L390 150L470 230L360 300Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />

          <path
            d="M170 470L280 400L370 470L260 550Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />

          <path
            d="M360 570L470 500L560 570L450 650Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />

          {/* Location pulse */}
          <circle
            cx="390"
            cy="455"
            r="105"
            stroke="currentColor"
            strokeWidth="1.5"
          />

          <circle
            cx="390"
            cy="455"
            r="65"
            stroke="currentColor"
            strokeWidth="1"
          />

          <circle
            cx="390"
            cy="455"
            r="28"
            fill="currentColor"
            opacity="0.18"
          />

          {/* Pin */}
          <path
            d="M390 395
           C356 395 330 421 330 455
           C330 505 390 555 390 555
           C390 555 450 505 450 455
           C450 421 424 395 390 395Z"
            fill="currentColor"
          />

          <circle
            cx="390"
            cy="455"
            r="16"
            fill="white"
          />

          {/* Small locations */}
          <circle cx="180" cy="330" r="7" fill="currentColor" />
          <circle cx="500" cy="300" r="6" fill="currentColor" />
          <circle cx="240" cy="680" r="8" fill="currentColor" />
          <circle cx="510" cy="730" r="6" fill="currentColor" />
        </svg>
      </div>

      <div className="relative z-10 flex h-full flex-col">
        {/* Header */}
        <div className="relative overflow-hidden border-b">
          <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-transparent to-primary/5" />

          <div className="relative px-6 pt-7 pb-6">
            <div className="flex items-start gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/10">
                <MapPin className="size-5" />
              </div>

              <div className="space-y-1">
                <h2 className="text-lg font-semibold tracking-tight">
                  {point ? t("editPoint") : t("newPoint")}
                </h2>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-3 max-w-md space-y-6">
            <div className="space-y-2">
              <Label
                htmlFor="point-name"
                className="text-sm font-medium"
              >
                {t("name")}
              </Label>

              <Input
                id="point-name"
                placeholder={t("namePlaceholder")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 rounded-lg bg-background"
                autoFocus
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t bg-muted/20 p-4">
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={handleClose}
              disabled={isPending}
            >
              {t("cancel")}
            </Button>

            <Button
              onClick={handleSubmit}
              disabled={isPending || !name.trim()}
              className="min-w-24"
            >
              {isPending ? t("saving") : t("save")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}