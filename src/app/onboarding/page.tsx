"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { z } from "zod";
import { toast } from "sonner";
import { Building2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createOrganization } from "./_actions/server";

export default function OnboardingPage() {
  const t = useTranslations("onboarding");

  const Schema = z.object({
    name: z.string().min(2, t("validation.name")).max(80),
  });

  type FormValues = z.infer<typeof Schema>;

  const router = useRouter();
  const { update } = useSession();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(Schema),
  });

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      const result = await createOrganization({ name: data.name });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      await update();

      toast.success(t("success"));

      router.push("/");
      router.refresh();
    });
  };

  return (
    <div className="w-full max-w-sm">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-6">
          <Building2 className="w-5 h-5 text-blue-500" />
        </div>

        <div className="mb-7">
          <h1 className="text-xl font-semibold tracking-tight text-gray-900">
            {t("title")}
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            {t("description")}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">{t("organizationName")}</Label>

            <Input
              id="name"
              placeholder={t("namePlaceholder")}
              autoFocus
              {...register("name")}
            />

            {errors.name && (
              <p className="text-xs text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full mt-2"
            disabled={isPending}
          >
            {isPending ? t("creating") : t("continue")}
          </Button>
        </form>
      </div>
    </div>

  );
}