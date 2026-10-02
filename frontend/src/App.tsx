import { AircraftMap } from "./AircraftMap";
import { useAircraft, type Status } from "./useAircraft";

const WS_URL = "ws://localhost:3000/ws";

const STATUS_TEXT: Record<Status, string> = {
  connecting: "Kobler til …",
  open: "Tilkoblet",
  closed: "Frakoblet – viser siste kjente data",
};

export default function App() {
  const { observations, tracks, receivedAtMs, status } = useAircraft(WS_URL);
  return (
    <>
      <AircraftMap observations={observations} tracks={tracks} receivedAtMs={receivedAtMs} />
      <div className={`status status-${status}`}>
        {STATUS_TEXT[status]} · {observations.length} fly
      </div>
    </>
  );
}