// Intern representasjon av én posisjonsobservasjon.
// Speiler datakontrakten i seksjon 6, men med camelCase slik TypeScript-kode vanligvis skrives.
// null betyr "ukjent". Det er noe annet enn 0.
export type Observation = {
  nodeId: string;
  icao: string;
  callsign: string | null;
  lat: number;
  lon: number;
  altitudeFt: number | null;
  onGround: boolean;
  groundSpeedKt: number | null;
  trackDeg: number | null;
  sensorTimeMs: number;    // når sensoren hørte posisjonen (readsb sin klokke)
  receivedTimeMs: number;  // når backend leste den (backend sin klokke)
  positionAgeS: number;    // alderen på posisjonen da filen ble lest
};