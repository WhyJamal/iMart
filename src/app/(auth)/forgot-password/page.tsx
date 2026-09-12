"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { KeyRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PAGES } from "@/config/pages.config";
import { requestPasswordReset } from "./_actions/server";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("auth.forgotPassword");

  const Schema = z.object({
    email: z.string().email(t("invalidEmail")),
  });

  type FormValues = z.infer<typeof Schema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(Schema),
  });

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      const result = await requestPasswordReset(data);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(t("codeSent"));
      router.push(
        `${PAGES.RESET_PASSWORD}?email=${encodeURIComponent(data.email)}`
      );
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
      <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-6">
        <KeyRound className="w-5 h-5 text-blue-500" />
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

        <Button type="submit" className="w-full mt-2" disabled={isPending}>
          {isPending ? t("sending") : t("sendCode")}
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
