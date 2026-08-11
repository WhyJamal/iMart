"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import type { CreateUserInput } from "@/schema/user.schema";
import type { Role } from "@/types/role.types";
import {
  createUser,
  updateUserRole,
  updateUserPoint,
  deleteOrgUser,
  updateUserSchedule,
} from "@/actions/user-actions";

export function useCreateUser(onSuccess?: () => void) {
  const [isPending, startTransition] = useTransition();

  const mutate = (input: CreateUserInput) => {
    startTransition(() => {
      void (async () => {
        const result = await createUser(input);
        if (result.success) {
          toast.success("User created");
          onSuccess?.();
        } else {
          toast.error(result.error);
        }
      })();
    });
  };

  return { mutate, isPending };
}

export function useUpdateUserRole(onSuccess?: () => void) {
  const [isPending, startTransition] = useTransition();

  const mutate = (userId: string, role: Role) => {
    startTransition(() => {
      void (async () => {
        const result = await updateUserRole({ userId, role });
        if (result.success) {
          toast.success("Role updated");
          onSuccess?.();
        } else {
          toast.error(result.error);
        }
      })();
    });
  };

  return { mutate, isPending };
}

export function useUpdateUserPoint(onSuccess?: () => void) {
  const [isPending, startTransition] = useTransition();

  const mutate = (userId: string, pointId: string | null) => {
    startTransition(() => {
      void (async () => {
        const result = await updateUserPoint({ userId, pointId });
        if (result.success) {
          toast.success("Point updated");
          onSuccess?.();
        } else {
          toast.error(result.error);
        }
      })();
    });
  };

  return { mutate, isPending };
}

export function useDeleteUser(onSuccess?: () => void) {
  const [isPending, startTransition] = useTransition();

  const mutate = (userId: string) => {
    startTransition(() => {
      void (async () => {
        const result = await deleteOrgUser(userId);
        if (result.success) {
          toast.success("User deleted");
          onSuccess?.();
        } else {
          toast.error(result.error);
        }
      })();
    });
  };

  return { mutate, isPending };
}

export function useUpdateUserSchedule(onSuccess?: () => void) {
  const [isPending, startTransition] = useTransition();

  const mutate = (
    userId: string,
    workScheduleId: string | null
  ) => {
    startTransition(() => {
      void (async () => {
        const result = await updateUserSchedule({
          userId,
          workScheduleId,
        });

        if (result.success) {
          toast.success("Schedule updated");
          onSuccess?.();
        } else {
          toast.error(result.error);
        }
      })();
    });
  };

  return { mutate, isPending };
}