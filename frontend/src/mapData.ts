import type { FeatureCollection, LineString, Point, Polygon } from "geojson";
import type { Observation } from "./types";
import type { Tracks } from "./tracks";
import { circlePolygon, uncertaintyRadiusM } from "./geo";

// Alder i sekunder. Tiden siden meldingen kom måles på nettleserens egen klokke.
export function ageS(o: Observation, receivedAtMs: number, nowMs: number): number {
  return o.positionAgeS + (nowMs - receivedAtMs) / 1000;
}

export function toPoints(obs: Observation[], receivedAtMs: number, nowMs: number): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: obs.map((o) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [o.lon, o.lat] },
      properties: { icao: o.icao, ageS: ageS(o, receivedAtMs, nowMs) },
    })),
  };
}

export function toUncertainty(obs: Observation[], receivedAtMs: number, nowMs: number): FeatureCollection<Polygon> {
  return {
    type: "FeatureCollection",
    features: obs.map((o) => ({
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [circlePolygon(o.lon, o.lat, uncertaintyRadiusM(o, ageS(o, receivedAtMs, nowMs)))],
      },
      properties: { icao: o.icao },
    })),
  };
}

export function toTracks(tracks: Tracks): FeatureCollection<LineString> {
  return {
    type: "FeatureCollection",
    features: [...tracks.entries()]
      .filter(([, points]) => points.length >= 2)
      .map(([icao, points]) => ({
        type: "Feature",
        geometry: { type: "LineString", coordinates: points.map((p) => [p.lon, p.lat]) },
        properties: { icao },
      })),
  };
}