import type { Observation } from "./types.js";

// Alt som kommer utenfra er "unknown" til vi har sjekket det.
export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

export function parseAircraftFile(text: string): { nowSec: number; aircraft: unknown[] } {
  const data: unknown = JSON.parse(text);
  if (!isRecord(data)) throw new Error("aircraft.json er ikke et objekt");
  const { now, aircraft } = data;
  if (typeof now !== "number" || !Array.isArray(aircraft)) {
    throw new Error("aircraft.json mangler 'now' eller 'aircraft'");
  }
  return { nowSec: now, aircraft };
}

type Context = { nodeId: string; nowSec: number; receivedMs: number };

// Returnerer null for fly vi ikke kan vise på kartet (uten posisjon).
export function normalize(raw: unknown, ctx: Context): Observation | null {
  if (!isRecord(raw)) return null;

  const icao = typeof raw.hex === "string" ? raw.hex.toLowerCase() : null;
  const lat = num(raw.lat);
  const lon = num(raw.lon);
  const seenPos = num(raw.seen_pos);
  if (icao === null || lat === null || lon === null || seenPos === null) return null;

  return {
    nodeId: ctx.nodeId,
    icao,
    callsign: typeof raw.flight === "string" ? raw.flight.trim() || null : null,
    lat,
    lon,
    altitudeFt: num(raw.alt_baro),
    onGround: raw.alt_baro === "ground",
    groundSpeedKt: num(raw.gs),
    trackDeg: num(raw.track),
    sensorTimeMs: Math.round((ctx.nowSec - seenPos) * 1000),
    receivedTimeMs: ctx.receivedMs,
    positionAgeS: seenPos,
  };
}