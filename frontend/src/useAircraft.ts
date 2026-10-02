import { useEffect, useState } from "react";
import type { Observation } from "./types";
import { updateTracks, type Tracks } from "./tracks";

export type Status = "connecting" | "open" | "closed";

type Snapshot = { type: "snapshot"; sentTimeMs: number; observations: Observation[] };

type LiveState = { observations: Observation[]; tracks: Tracks; receivedAtMs: number };

// Sjekker konvolutten, ikke hver observasjon. Dataene kommer fra vår egen backend,
// og i fase 1b tar Protobuf og kontrakttester over den jobben.
function isSnapshot(msg: unknown): msg is Snapshot {
  if (typeof msg !== "object" || msg === null) return false;
  const m = msg as { type?: unknown; observations?: unknown };
  return m.type === "snapshot" && Array.isArray(m.observations);
}

export function useAircraft(url: string) {
  const [live, setLive] = useState<LiveState>({ observations: [], tracks: new Map(), receivedAtMs: 0 });
  const [status, setStatus] = useState<Status>("connecting");

  useEffect(() => {
    let ws: WebSocket | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let retryMs = 1000;
    let stopped = false;

    function connect() {
      setStatus("connecting");
      ws = new WebSocket(url);
      ws.onopen = () => {
        setStatus("open");
        retryMs = 1000;
      };
      ws.onmessage = (event) => {
        try {
          const msg: unknown = JSON.parse(String(event.data));
          if (!isSnapshot(msg)) return;
          const receivedAtMs = Date.now(); // nettleserens klokke
          setLive((prev) => ({
            observations: msg.observations,
            tracks: updateTracks(prev.tracks, msg.observations),
            receivedAtMs,
          }));
        } catch {
          // Ugyldig melding: ignorer den, neste snapshot kommer om et sekund.
        }
      };
      ws.onclose = () => {
        setStatus("closed");
        if (stopped) return;
        timer = setTimeout(connect, retryMs);
        retryMs = Math.min(retryMs * 2, 10_000);
      };
    }

    connect();
    return () => {
      stopped = true;
      clearTimeout(timer);
      ws?.close();
    };
  }, [url]);

  return { ...live, status };
}