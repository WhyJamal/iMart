import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { cn } from "@/lib/utils";
import { PAGES } from "@/config/pages.config";
import { HELP_TOPICS } from "@/config/help-topics";

export async function HelpSidebar({ activeSlug }: { activeSlug: string }) {
  const [tSidebar, tHelp] = await Promise.all([
    getTranslations("sidebar"),
    getTranslations("help.topics"),
  ]);

  const labelFor = (topic: { slug: string; sidebarLabelKey?: string }) =>
    topic.sidebarLabelKey ? tSidebar(topic.sidebarLabelKey) : tHelp(topic.slug);

  return (
    <nav className="w-56 shrink-0 border-r border-border overflow-y-auto py-3">
      {HELP_TOPICS.map((group) => (
        <div key={group.groupKey} className="mb-1">
          {group.groupKey !== "top" && (
            <div className="px-4 pt-4 pb-1 text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground/60">
              {tSidebar(group.groupKey)}
            </div>
          )}

          {group.topics.map((topic) => {
            const active = topic.slug === activeSlug;

            return (
              <Link
                key={topic.slug}
                href={PAGES.HELP(topic.slug)}
                prefetch={false}
                replace
                className={cn(
                  "block mx-2 mb-0.5 px-3 py-2 rounded-lg text-sm",
                  active
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                {labelFor(topic)}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
