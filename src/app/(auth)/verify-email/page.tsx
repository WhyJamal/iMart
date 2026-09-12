"use client";

import { useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { MailCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PAGES } from "@/config/pages.config";
import { verifyEmailCode, resendVerificationCode } from "./_actions/server";

export default function VerifyEmailPage() {
  const { data: session, update } = useSession();
  const [isPending, startTransition] = useTransition();
  const [isResending, startResendTransition] = useTransition();
  const [resent, setResent] = useState(false);
  const t = useTranslations("auth.verifyEmail");

  const Schema = z.object({
    code: z
      .string()
      .length(6, t("codeLength")),
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
      const result = await verifyEmailCode(data);

      if (!result.success) {
        toast.error(t(mapError(result.error)));
        return;
      }

      await update({ isEmailVerified: true });

      window.location.href = PAGES.HOME;
    });
  };

  const handleResend = () => {
    startResendTransition(async () => {
      const result = await resendVerificationCode();

      if (!result.success) {
        toast.error(t(mapError(result.error)));
        return;
      }

      setResent(true);
      toast.success(t("codeResent"));
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
      <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-6">
        <MailCheck className="w-5 h-5 text-blue-500" />
      </div>

      <div className="mb-7">
        <h1 className="text-xl font-semibold tracking-tight text-gray-900">
          {t("title")}
        </h1>

        <p className="text-sm text-gray-500 mt-1">
          {session?.user?.email
            ? t("descriptionWithEmail", { email: session.user.email })
            : t("description")}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

        <Button type="submit" className="w-full mt-2" disabled={isPending}>
          {isPending ? t("verifying") : t("verify")}
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        {t("noCode")}{" "}

        <button
          type="button"
          onClick={handleResend}
          disabled={isResending}
          className="font-medium text-gray-900 hover:underline disabled:opacity-60"
        >
          {isResending ? t("resending") : resent ? t("resentAgain") : t("resend")}
        </button>
      </p>
    </div>
  );
}

function mapError(error: string): "invalidCode" | "codeExpired" | "genericError" {
  if (error === "Invalid code") return "invalidCode";
  if (error === "Code expired") return "codeExpired";
  return "genericError";
}
