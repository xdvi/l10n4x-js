export type PakLoader = (locale: string, baseDir: string) => Promise<Uint8Array>;

/** Browser loader — uses the Fetch API. */
export const fetchPakLoader: PakLoader = async (locale, baseDir) => {
  const url = `${baseDir.replace(/\/$/, "")}/${locale}.pak`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`l10n4x: HTTP ${res.status} for ${url}`);
  return new Uint8Array(await res.arrayBuffer());
};

/** Node.js / SSR loader — uses `fs/promises`. */
export const fsPakLoader: PakLoader = async (locale, baseDir) => {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  const filePath = path.join(baseDir, `${locale}.pak`);
  try {
    const buf = await fs.readFile(filePath);
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`l10n4x: failed to read '${filePath}': ${msg}`);
  }
};

/** Modular bundle: `{baseDir}/{locale}/{namespace}.pak`. */
export const fetchNamespacePakLoader =
  (namespace: string): PakLoader =>
  async (locale, baseDir) => {
    const url = `${baseDir.replace(/\/$/, "")}/${locale}/${namespace}.pak`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`l10n4x: HTTP ${res.status} for ${url}`);
    return new Uint8Array(await res.arrayBuffer());
  };

export const autoPakLoader: PakLoader = (locale, baseDir) =>
  typeof fetch !== "undefined"
    ? fetchPakLoader(locale, baseDir)
    : fsPakLoader(locale, baseDir);

export function resolveLoader(kind: PakLoader | import("./types.js").LoaderKind | undefined): PakLoader {
  if (typeof kind === "function") return kind;
  switch (kind) {
    case "fetch":
      return fetchPakLoader;
    case "fs":
      return fsPakLoader;
    case "auto":
    default:
      return autoPakLoader;
  }
}