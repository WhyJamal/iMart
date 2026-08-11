"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import type {
  CreateTemplateInput,
  UpdateTemplateInput,
  CreateWorkScheduleInput,
  SetScheduleDayInput,
} from "@/schema/work-schedule.schema";
import {
  createTemplate,
  updateTemplate,
  deleteTemplate,
  createWorkSchedule,
  deleteWorkSchedule,
  fillWorkSchedule,
  setScheduleDay,
} from "@/actions/work-schedule-actions";

function useAction<TInput>(
  fn: (input: TInput) => Promise<{ success: boolean; error?: string }>,
  successMsg: string,
  onSuccess?: () => void
) {
  const [isPending, startTransition] = useTransition();
  const mutate = (input: TInput) => {
    startTransition(() => {
      void (async () => {
        const result = await fn(input);
        if (result.success) {
          toast.success(successMsg);
          onSuccess?.();
        } else {
          toast.error(result.error ?? "Xatolik yuz berdi");
        }
      })();
    });
  };
  return { mutate, isPending };
}

export function useCreateTemplate(onSuccess?: () => void) {
  return useAction<CreateTemplateInput>(createTemplate, "Shablon yaratildi", onSuccess);
}
export function useUpdateTemplate(onSuccess?: () => void) {
  return useAction<UpdateTemplateInput>(updateTemplate, "Shablon yangilandi", onSuccess);
}
export function useDeleteTemplate(onSuccess?: () => void) {
  return useAction<string>(deleteTemplate, "Shablon o'chirildi", onSuccess);
}

export function useCreateWorkSchedule(onSuccess?: () => void) {
  return useAction<CreateWorkScheduleInput>(createWorkSchedule, "Grafik yaratildi", onSuccess);
}
export function useDeleteWorkSchedule(onSuccess?: () => void) {
  return useAction<string>(deleteWorkSchedule, "Grafik o'chirildi", onSuccess);
}
export function useFillWorkSchedule(onSuccess?: () => void) {
  return useAction<string>(fillWorkSchedule, "Grafik to'ldirildi", onSuccess);
}
export function useSetScheduleDay(onSuccess?: () => void) {
  return useAction<SetScheduleDayInput>(setScheduleDay, "Saqlandi", onSuccess);
}
