"use client";

import { useTransition } from "react";
import { updateUserTheme } from "@/lib/theme/actions";
import type { ThemeMode, ThemeRadius } from "@/lib/theme/types";
import { useTranslations } from "next-intl";

const colors = ["red", "blue", "green", "violet", "orange"] as const;

export function ThemeCustomizer() {
    const t = useTranslations("profile.appearance");
    const [isPending, startTransition] = useTransition();

    function update(data: {
        mode?: ThemeMode;
        primary?: string;
        radius?: ThemeRadius;
    }) {
        startTransition(async () => {
            await updateUserTheme(data);

            window.location.reload();
        });
    }

    return (
        <div className="w-full max-w-sm space-y-6 rounded-lg border p-5">
            <div>
                <h2 className="font-semibold">{t("title")}</h2>
                <p className="text-sm text-muted-foreground">
                    {t("description")}
                </p>
            </div>

            <div className="space-y-2">
                <p className="text-sm font-medium">{t("color")}</p>

                <div className="flex flex-wrap gap-2">
                    {colors.map((color) => (
                        <button
                            key={color}
                            type="button"
                            disabled={isPending}
                            onClick={() => update({ primary: color })}
                            className="rounded-md border px-3 py-2 text-sm capitalize hover:bg-accent"
                        >
                            {color}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <p className="text-sm font-medium">{t("mode")}</p>

                <div className="flex gap-2">
                    {(["light", "dark", "system"] as const).map((mode) => (
                        <button
                            key={mode}
                            type="button"
                            disabled={isPending}
                            onClick={() => update({ mode })}
                            className="rounded-md border px-3 py-2 text-sm"
                        >
                            {t(mode)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <p className="text-sm font-medium">Radius</p>

                <div className="flex gap-2">
                    {(["none", "small", "medium", "large"] as const).map((radius) => (
                        <button
                            key={radius}
                            type="button"
                            disabled={isPending}
                            onClick={() => update({ radius })}
                            className="rounded-md border px-3 py-2 text-sm"
                        >
                            {t(radius)}
                        </button>
                    ))}
                </div>
            </div>

            {isPending && (
                <p className="text-sm text-muted-foreground">
                    {t("saving")}
                </p>
            )}
        </div>
    );
}