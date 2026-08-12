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

export function useCreateTimesheet(onSuccess?: () => void) {
  return useAction<CreateTimesheetInput>(createTimesheet, "Tabel yaratildi", onSuccess);
}
export function useDeleteTimesheet(onSuccess?: () => void) {
  return useAction<string>(deleteTimesheet, "Tabel o'chirildi", onSuccess);
}
export function useFillTimesheetUsers(onSuccess?: () => void) {
  return useAction<string>(fillTimesheetUsers, "Xodimlar qo'shildi", onSuccess);
}
export function useFillTimesheetDays(onSuccess?: () => void) {
  return useAction<string>(fillTimesheetDays, "Tabel to'ldirildi", onSuccess);
}
export function useSetTimesheetEntry(onSuccess?: () => void) {
  return useAction<SetTimesheetEntryInput>(setTimesheetEntry, "Saqlandi", onSuccess);
}