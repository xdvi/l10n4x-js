export interface NamespaceManifest {
  version?: number;
  preload?: string[];
  locales: Record<string, string[]>;
}

export async function fetchNamespaceManifest(
  outputDir: string,
): Promise<NamespaceManifest | null> {
  const url = `${outputDir.replace(/\/$/, "")}/namespaces.json`;
  try {
    if (typeof fetch !== "undefined") {
      const res = await fetch(url);
      if (!res.ok) return null;
      return (await res.json()) as NamespaceManifest;
    }
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const filePath = path.join(outputDir, "namespaces.json");
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as NamespaceManifest;
  } catch {
    return null;
  }
}

export function namespacesForLocale(
  manifest: NamespaceManifest,
  locale: string,
  configPreload?: string[],
): string[] {
  const fromLocale = manifest.locales[locale] ?? [];
  const preload = configPreload ?? manifest.preload ?? [];
  const merged = new Set<string>([...preload, ...fromLocale]);
  return [...merged];
}