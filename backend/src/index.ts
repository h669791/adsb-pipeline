import Fastify from "fastify";
import websocket from "@fastify/websocket";
import { normalize, parseAircraftFile } from "./normalize.js";
import { readSource } from "./source.js";
import type { Observation } from "./types.js";

const SOURCE = process.env.AIRCRAFT_SOURCE ?? "testdata/aircraft.json";
const NODE_ID = process.env.NODE_ID ?? "dev-pc";
const PORT = Number(process.env.PORT ?? 3000);
const POLL_MS = 1000;

// Live-tilstand i minnet: siste observasjon per fly, med ICAO-adressen som nøkkel.
const live = new Map<string, Observation>();

const app = Fastify({ logger: true });
await app.register(websocket);

app.get("/health", async () => ({ ok: true, aircraft: live.size }));

app.get("/ws", { websocket: true }, (socket) => {
  // En ny klient får hele bildet med en gang, uten å vente på neste runde.
  socket.send(snapshotMessage());
});

function snapshotMessage(): string {
  return JSON.stringify({
    type: "snapshot",
    sentTimeMs: Date.now(),
    observations: [...live.values()],
  });
}

function broadcast(message: string) {
  for (const client of app.websocketServer.clients) {
    if (client.readyState === client.OPEN) client.send(message);
  }
}

async function poll() {
  try {
    const text = await readSource(SOURCE);
    const receivedMs = Date.now();
    const { nowSec, aircraft } = parseAircraftFile(text);

    live.clear();
    for (const raw of aircraft) {
      const obs = normalize(raw, { nodeId: NODE_ID, nowSec, receivedMs });
      if (obs) live.set(obs.icao, obs);
    }
    broadcast(snapshotMessage());
  } catch (err) {
    // Én feilet runde skal ikke ta ned serveren. Vi prøver igjen neste gang.
    app.log.warn({ err }, "Klarte ikke å hente aircraft.json");
  } finally {
    setTimeout(poll, POLL_MS);
  }
}

await app.listen({ port: PORT });
void poll();