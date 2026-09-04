"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { z } from "zod";
import Link from "next/link";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PAGES } from "@/config/pages.config";

export default function LoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("auth.login");

  const Schema = z.object({
    email: z.string().email(t("invalidEmail")),
    password: z.string().min(1, t("passwordRequired")),
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
      const res = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (res?.error) {
        toast.error(t("invalidEmail"));
        return;
      }

      router.refresh();
      router.push(PAGES.HOME);
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
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
          <Label htmlFor="email">
            {t("email")}
          </Label>

          <Input
            id="email"
            type="email"
            placeholder={t("emailPlaceholder")}
            autoComplete="email"
            {...register("email")}
          />

          {errors.email && (
            <p className="text-xs text-destructive">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">
            {t("password")}
          </Label>

          <Input
            id="password"
            type="password"
            placeholder={t("passwordPlaceholder")}
            autoComplete="current-password"
            {...register("password")}
          />

          {errors.password && (
            <p className="text-xs text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full mt-2"
          disabled={isPending}
        >
          {isPending ? t("signingIn") : t("signIn")}
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        {t("noAccount")}{" "}

        <Link
          href="/register"
          className="font-medium text-gray-900 hover:underline"
        >
          {t("signUp")}
        </Link>
      </p>
    </div>
  );
}