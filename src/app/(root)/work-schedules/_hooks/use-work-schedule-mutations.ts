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

function useAction<TInput, TData = undefined>(
  fn: (input: TInput) => Promise<{
    success: boolean;
    data?: TData;
    error?: string;
  }>,
  successMsg: string,
  onSuccess?: (data: TData | undefined) => void
) {
  const [isPending, startTransition] = useTransition();

  const mutate = (input: TInput) => {
    startTransition(() => {
      void (async () => {
        const result = await fn(input);

        if (result.success) {
          toast.success(successMsg);
          onSuccess?.(result.data);
        } else {
          toast.error(result.error ?? "Xatolik yuz berdi");
        }
      })();
    });
  };

  return { mutate, isPending };
}

export function useCreateTemplate(onSuccess?: (data: { id: string } | undefined) => void) {
  return useAction<CreateTemplateInput, { id: string }>(
    createTemplate,
    "Shablon yaratildi",
    onSuccess
  );
}

export function useUpdateTemplate(onSuccess?: () => void) {
  return useAction<UpdateTemplateInput, undefined>(
    updateTemplate,
    "Shablon yangilandi",
    onSuccess
  );
}

export function useDeleteTemplate(onSuccess?: () => void) {
  return useAction<string, undefined>(
    deleteTemplate,
    "Shablon o'chirildi",
    onSuccess
  );
}

export function useCreateWorkSchedule(
  onSuccess?: (data: { id: string } | undefined) => void
) {
  return useAction<CreateWorkScheduleInput, { id: string }>(
    createWorkSchedule,
    "Grafik yaratildi",
    onSuccess
  );
}

export function useDeleteWorkSchedule(onSuccess?: () => void) {
  return useAction<string, undefined>(
    deleteWorkSchedule,
    "Grafik o'chirildi",
    onSuccess
  );
}

export function useFillWorkSchedule(onSuccess?: () => void) {
  return useAction<string, { filledCount: number }>(
    fillWorkSchedule,
    "Grafik to'ldirildi",
    onSuccess
  );
}

export function useSetScheduleDay(onSuccess?: () => void) {
  return useAction<SetScheduleDayInput, undefined>(
    setScheduleDay,
    "Saqlandi",
    onSuccess
  );
}

