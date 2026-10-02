import type { Observation } from "./types";

const KT_TO_MS = 0.514444;
const ASSUMED_MAX_KT = 600; // Antakelse når farten er ukjent: heller for stor sirkel enn ingen
const M_PER_DEG_LAT = 111_320;

// Hvor langt flyet kan ha flydd siden siste posisjon: fart × alder.
export function uncertaintyRadiusM(o: Observation, ageS: number): number {
  const speedKt = o.groundSpeedKt ?? ASSUMED_MAX_KT;
  return speedKt * KT_TO_MS * ageS;
}

// Sirkel som polygon. Tilnærmingen er god nok for radier opp til noen titalls km.
export function circlePolygon(lon: number, lat: number, radiusM: number, steps = 48): [number, number][] {
  const mPerDegLon = M_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180);
  const ring: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * 2 * Math.PI;
    ring.push([lon + (radiusM * Math.sin(a)) / mPerDegLon, lat + (radiusM * Math.cos(a)) / M_PER_DEG_LAT]);
  }
  return ring;
}