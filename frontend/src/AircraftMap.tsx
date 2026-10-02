import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type { GeoJSONSource } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import type { FeatureCollection } from "geojson";
import type { Observation } from "./types";
import type { Tracks } from "./tracks";
import { toPoints, toTracks, toUncertainty } from "./mapData";
import { useNow } from "./useNow";

// MapLibre 6 laster sin web worker fra en URL. Vite bygger workeren og gir oss adressen.
// Må settes før noe kart opprettes.
maplibregl.setWorkerUrl(workerUrl);

const STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";
const EMPTY: FeatureCollection = { type: "FeatureCollection", features: [] };

type Props = { observations: Observation[]; tracks: Tracks; receivedAtMs: number };

function setData(map: maplibregl.Map, id: string, data: FeatureCollection) {
  // Vi opprettet kildene selv som "geojson", så denne typen stemmer.
  (map.getSource(id) as GeoJSONSource | undefined)?.setData(data);
}

export function AircraftMap({ observations, tracks, receivedAtMs }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [loaded, setLoaded] = useState(false);
  const now = useNow(1000);

  useEffect(() => {
    if (!containerRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      center: [10.75, 59.91],
      zoom: 7,
    });
    map.on("load", () => {
      map.addSource("uncertainty", { type: "geojson", data: EMPTY });
      map.addSource("tracks", { type: "geojson", data: EMPTY });
      map.addSource("aircraft", { type: "geojson", data: EMPTY });

      // Rekkefølgen bestemmer hva som ligger øverst: sirkler nederst, fly øverst.
      map.addLayer({
        id: "uncertainty-fill", type: "fill", source: "uncertainty",
        paint: { "fill-color": "#d9480f", "fill-opacity": 0.1 },
      });
      map.addLayer({
        id: "uncertainty-edge", type: "line", source: "uncertainty",
        paint: { "line-color": "#d9480f", "line-opacity": 0.5, "line-width": 1 },
      });
      map.addLayer({
        id: "tracks", type: "line", source: "tracks",
        paint: { "line-color": "#1c7ed6", "line-width": 2, "line-opacity": 0.7 },
      });
      map.addLayer({
        id: "aircraft-points", type: "circle", source: "aircraft",
        paint: {
          "circle-radius": 6,
          // Fersk posisjon: oransje og tydelig. 60 sekunder gammel: grå og blek.
          "circle-color": ["interpolate", ["linear"], ["get", "ageS"], 0, "#d9480f", 60, "#868e96"],
          "circle-opacity": ["interpolate", ["linear"], ["get", "ageS"], 0, 1, 60, 0.35],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });
      setLoaded(true);
    });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!loaded || !map) return;
    setData(map, "aircraft", toPoints(observations, receivedAtMs, now));
    setData(map, "uncertainty", toUncertainty(observations, receivedAtMs, now));
    setData(map, "tracks", toTracks(tracks));
  }, [observations, tracks, receivedAtMs, now, loaded]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}