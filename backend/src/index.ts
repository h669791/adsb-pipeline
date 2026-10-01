import { readFile } from "node:fs/promises";

// Stien er relativ til mappen du kjører fra (backend/).
const FILE = "testdata/aircraft.json";

async function main() {
  const text = await readFile(FILE, "utf8");

  // "as" er bare et løfte til kompilatoren, ingen sjekk.
  // Det erstatter vi med ekte validering i neste steg.
  const data = JSON.parse(text) as { now: number; aircraft: unknown[] };

  console.log(`readsb-tid: ${data.now}, antall fly: ${data.aircraft.length}`);
}

main().catch((err) => {
  console.error("Klarte ikke å lese filen:", err);
  process.exit(1);
});