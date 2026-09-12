"use client";

import { Suspense, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PAGES } from "@/config/pages.config";
import { resetPassword } from "./_actions/server";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get("email") ?? "";
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("auth.resetPassword");

  const Schema = z
    .object({
      email: z.string().email(t("invalidEmail")),
      code: z.string().length(6, t("codeLength")),
      password: z.string().min(8, t("atLeastEightCharacters")),
      confirmPassword: z.string().min(8, t("atLeastEightCharacters")),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("passwordsDontMatch"),
      path: ["confirmPassword"],
    });

  type FormValues = z.infer<typeof Schema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: { email: emailFromQuery },
  });

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      const result = await resetPassword({
        email: data.email,
        code: data.code,
        password: data.password,
      });

      if (!result.success) {
        toast.error(t(mapError(result.error)));
        return;
      }

      toast.success(t("passwordUpdated"));
      router.push(PAGES.LOGIN);
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
      <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-6">
        <ShieldCheck className="w-5 h-5 text-blue-500" />
      </div>

      <div className="mb-7">
        <h1 className="text-xl font-semibold tracking-tight text-gray-900">
          {t("title")}
        </h1>

        <p className="text-sm text-gray-500 mt-1">{t("description")}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">{t("email")}</Label>

          <Input
            id="email"
            type="email"
            placeholder={t("emailPlaceholder")}
            autoComplete="email"
            {...register("email")}
          />

          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="code">{t("code")}</Label>

          <Input
            id="code"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            className="tracking-[0.5em] text-center text-lg"
            autoComplete="one-time-code"
            {...register("code")}
          />

          {errors.code && (
            <p className="text-xs text-destructive">{errors.code.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">{t("newPassword")}</Label>

          <Input
            id="password"
            type="password"
            placeholder={t("passwordPlaceholder")}
            autoComplete="new-password"
            {...register("password")}
          />

          {errors.password && (
            <p className="text-xs text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>

          <Input
            id="confirmPassword"
            type="password"
            placeholder={t("passwordPlaceholder")}
            autoComplete="new-password"
            {...register("confirmPassword")}
          />

          {errors.confirmPassword && (
            <p className="text-xs text-destructive">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full mt-2" disabled={isPending}>
          {isPending ? t("updating") : t("updatePassword")}
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        <Link
          href={PAGES.LOGIN}
          className="font-medium text-gray-900 hover:underline"
        >
          {t("backToLogin")}
        </Link>
      </p>
    </div>
  );
}

function mapError(error: string): "invalidCode" | "codeExpired" | "genericError" {
  if (error === "Invalid code") return "invalidCode";
  if (error === "Code expired") return "codeExpired";
  return "genericError";
}
