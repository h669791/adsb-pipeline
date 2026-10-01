import { readFile } from "node:fs/promises";

// Henter aircraft.json enten fra en fil eller over HTTP (fra Pi-en senere).
export async function readSource(source: string): Promise<string> {
  if (source.startsWith("http://") || source.startsWith("https://")) {
    const res = await fetch(source, { signal: AbortSignal.timeout(2000) });
    if (!res.ok) throw new Error(`HTTP ${res.status} fra ${source}`);
    return await res.text();
  }
  return await readFile(source, "utf8");
}