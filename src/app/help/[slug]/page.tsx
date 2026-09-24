import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { PAGES } from "@/config/pages.config";
import { HelpSidebar } from "@/components/help/help-sidebar";
import { HelpContent } from "@/components/help/help-content";

export default async function HelpStandalonePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const t = await getTranslations("help");

  return (
    <div className="h-screen bg-muted/40 flex flex-col overflow-hidden">
      <div className="h-12 shrink-0 flex items-center justify-end px-3 border-b border-border bg-card">
        <Link
          href={PAGES.HOME}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          {t("closeButton")}
        </Link>
      </div>

      <div className="flex-1 min-h-0 flex overflow-hidden">
        <HelpSidebar activeSlug={slug} />

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto">
            <HelpContent slug={slug} />
          </div>
        </div>
      </div>
    </div>
  );
}
