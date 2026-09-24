import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { cn } from "@/lib/utils";
import { PAGES } from "@/config/pages.config";
import { HELP_TOPICS } from "@/config/help-topics";

export async function HelpSidebar({ activeSlug }: { activeSlug: string }) {
  const t = await getTranslations("help.topics");

  return (
    <nav className="w-56 shrink-0 border-r border-border overflow-y-auto py-3">
      {HELP_TOPICS.map((topic) => {
        const active = topic.slug === activeSlug;

        return (
          <Link
            key={topic.slug}
            href={PAGES.HELP(topic.slug)}
            prefetch={false}
            className={cn(
              "block mx-2 mb-0.5 px-3 py-2 rounded-lg text-sm",
              active
                ? "bg-primary/10 text-primary font-semibold"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            {t(topic.slug)}
          </Link>
        );
      })}
    </nav>
  );
}
