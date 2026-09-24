import { HelpOverlayShell } from "@/components/help/help-overlay-shell";
import { HelpSidebar } from "@/components/help/help-sidebar";
import { HelpContent } from "@/components/help/help-content";

export default async function HelpInterceptedPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <HelpOverlayShell>
      <HelpSidebar activeSlug={slug} />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto">
          <HelpContent slug={slug} />
        </div>
      </div>
    </HelpOverlayShell>
  );
}
