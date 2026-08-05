"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import type {
  CreateWorkCalendarInput,
  SetCalendarDayInput,
} from "@/schema/calendar.schema";
import {
  createWorkCalendar,
  setCalendarDay,
  confirmWorkCalendar,
  reopenWorkCalendar,
} from "@/actions/calendar-actions";

export function useCreateWorkCalendar(onSuccess?: (year: number) => void) {
  const [isPending, startTransition] = useTransition();
  const mutate = (input: CreateWorkCalendarInput) => {
    startTransition(() => {
      void (async () => {
        const result = await createWorkCalendar(input);
        if (result.success) {
          toast.success("Kalendar yaratildi");
          onSuccess?.(result.data.year);
        } else {
          toast.error(result.error);
        }
      })();
    });
  };
  return { mutate, isPending };
}

export function useSetCalendarDay(onSuccess?: () => void) {
  const [isPending, startTransition] = useTransition();
  const mutate = (input: SetCalendarDayInput) => {
    startTransition(() => {
      void (async () => {
        const result = await setCalendarDay(input);
        if (result.success) {
          toast.success("Kun saqlandi");
          onSuccess?.();
        } else {
          toast.error(result.error);
        }
      })();
    });
  };
  return { mutate, isPending };
}

export function useConfirmWorkCalendar(onSuccess?: () => void) {
  const [isPending, startTransition] = useTransition();
  const mutate = (id: string) => {
    startTransition(() => {
      void (async () => {
        const result = await confirmWorkCalendar(id);
        if (result.success) {
          toast.success("Kalendar tasdiqlandi");
          onSuccess?.();
        } else {
          toast.error(result.error);
        }
      })();
    });
  };
  return { mutate, isPending };
}

export function useReopenWorkCalendar(onSuccess?: () => void) {
  const [isPending, startTransition] = useTransition();
  const mutate = (id: string) => {
    startTransition(() => {
      void (async () => {
        const result = await reopenWorkCalendar(id);
        if (result.success) {
          toast.success("Kalendar qayta ochildi");
          onSuccess?.();
        } else {
          toast.error(result.error);
        }
      })();
    });
  };
  return { mutate, isPending };
}
