import type { Observation } from "./types";

export type TrackPoint = { lon: number; lat: number; sensorTimeMs: number };
export type Tracks = Map<string, TrackPoint[]>;

const MAX_POINTS = 120;

// Ren funksjon: lager nye spor ut fra de gamle sporene og den nye snapshoten.
export function updateTracks(prev: Tracks, observations: Observation[]): Tracks {
  const next: Tracks = new Map();
  for (const o of observations) {
    const old = prev.get(o.icao) ?? [];
    // Samme sensortid som sist betyr samme posisjon: ikke legg den til igjen.
    if (old.at(-1)?.sensorTimeMs === o.sensorTimeMs) {
      next.set(o.icao, old);
    } else {
      const point = { lon: o.lon, lat: o.lat, sensorTimeMs: o.sensorTimeMs };
      next.set(o.icao, [...old, point].slice(-MAX_POINTS));
    }
  }
  return next;
}