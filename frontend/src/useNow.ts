import { useEffect, useState } from "react";

// Gir nåtiden på nytt hvert sekund, slik at alder og sirkler oppdateres
// også når det ikke kommer nye meldinger.
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}