"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import type {
  CreateTimesheetInput,
  SetTimesheetEntryInput,
} from "@/schema/timesheet.schema";

import {
  createTimesheet,
  deleteTimesheet,
  fillTimesheetUsers,
  fillTimesheetDays,
  setTimesheetEntry,
} from "@/actions/timesheet-actions";

import type { ActionResult } from "@/types/action-result.types";

function useAction<TInput, TData = undefined>(
  fn: (input: TInput) => Promise<ActionResult<TData>>,
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

export function useCreateTimesheet(
  onSuccess?: (data: { id: string } | undefined) => void
) {
  return useAction<CreateTimesheetInput, { id: string }>(
    createTimesheet,
    "Tabel yaratildi",
    onSuccess
  );
}

export function useDeleteTimesheet(onSuccess?: () => void) {
  return useAction<string, undefined>(
    deleteTimesheet,
    "Tabel o'chirildi",
    onSuccess
  );
}

export function useFillTimesheetUsers(onSuccess?: () => void) {
  return useAction<string, { addedCount: number }>(
    fillTimesheetUsers,
    "Xodimlar qo'shildi",
    onSuccess
  );
}

export function useFillTimesheetDays(onSuccess?: () => void) {
  return useAction<string, { filledCount: number }>(
    fillTimesheetDays,
    "Tabel to'ldirildi",
    onSuccess
  );
}

export function useSetTimesheetEntry(onSuccess?: () => void) {
  return useAction<SetTimesheetEntryInput, undefined>(
    setTimesheetEntry,
    "Saqlandi",
    onSuccess
  );
}