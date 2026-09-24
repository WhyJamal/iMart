import { getLocale, getTranslations } from "next-intl/server";
import ReactMarkdown from "react-markdown";

import { getHelpMarkdown } from "@/lib/help/get-help-markdown";

export async function HelpContent({ slug }: { slug: string }) {
  const [t, locale] = await Promise.all([
    getTranslations("help"),
    getLocale(),
  ]);

  const markdown = await getHelpMarkdown(slug, locale);

  if (!markdown) {
    return (
      <div>
        <h1 className="text-xl font-bold text-foreground capitalize mb-3">
          {slug.replace(/-/g, " ")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("comingSoon")}</p>
      </div>
    );
  }

  return (
    <div
      className="
        text-sm text-foreground leading-relaxed
        [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-3 [&_h1]:mt-0
        [&_h2]:text-base [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-2
        [&_p]:mb-3 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5
        [&_li]:mb-1 [&_strong]:font-semibold [&_hr]:my-5 [&_hr]:border-border
        [&_a]:text-primary [&_a]:underline
        [&_p:has(>img)]:text-center
        [&_img]:inline-block [&_img]:max-w-full [&_img]:rounded-xl
        [&_img]:border [&_img]:border-border [&_img]:shadow-sm [&_img]:mt-4
        [&_p:has(>img)+p]:text-center [&_p:has(>img)+p]:text-xs
        [&_p:has(>img)+p]:text-muted-foreground [&_p:has(>img)+p]:mt-1.5
        [&_p:has(>img)+p]:mb-4
      "
    >
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </div>
  );
}
