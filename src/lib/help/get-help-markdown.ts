import { readFile } from "fs/promises";
import path from "path";

const HELP_CONTENT_DIR = path.join(process.cwd(), "content", "help");

const SUPPORTED_LOCALES = ["ru", "uz", "en"] as const;

const SAFE_SLUG = /^[a-z0-9-]+$/;

export async function getHelpMarkdown(
  slug: string,
  locale: string
): Promise<string | null> {
  if (!SAFE_SLUG.test(slug)) {
    return null;
  }

  const localesToTry = [
    locale,
    ...SUPPORTED_LOCALES.filter((l) => l !== locale),
  ].filter((l): l is (typeof SUPPORTED_LOCALES)[number] =>
    (SUPPORTED_LOCALES as readonly string[]).includes(l)
  );

  for (const loc of localesToTry) {
    try {
      const filePath = path.join(HELP_CONTENT_DIR, loc, `${slug}.md`);
      return await readFile(filePath, "utf-8");
    } catch {
      continue;
    }
  }

  return null;
}
