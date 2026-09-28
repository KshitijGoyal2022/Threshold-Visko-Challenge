// What the patient's browser and the clinician's console exchange through the
// server. The stream itself goes only to the patient; the console sees a
// snapshot of state and a low-rate preview frame.

import type { Reading } from "@/lib/threshold/engine";

export type RungVisit = { t: number; level: number };

export type RoomState = {
  fear: string;
  room: string;
  phase: string;
  rung: number;
  suds: number;
  auto: boolean;
  anchored: boolean;
  note: string;
  readings: Reading[];
  history: RungVisit[];
  log: { t: number; text: string }[];
  updatedAt: number;
};

export type Command =
  | { id: string; type: "begin" }
  | { id: string; type: "end" }
  | { id: string; type: "jump"; level: number }
  | { id: string; type: "direct"; prompt: string }
  | { id: string; type: "safe" }
  | { id: string; type: "auto"; on: boolean };

/** WebRTC handshake between the two browsers, relayed through the server, so
 *  the console sees and hears exactly what the patient does. */
export type Signal =
  | { type: "want-stream" }
  | { type: "offer"; sdp: string }
  | { type: "answer"; sdp: string }
  | { type: "candidate"; candidate: RTCIceCandidateInit };

export type Role = "patient" | "therapist";

/** A command before the console stamps an id on it. */
export type CommandInput = {
  [K in Command["type"]]: Omit<Extract<Command, { type: K }>, "id">;
}[Command["type"]];

export function newCode() {
  const letters = "ABCDEFGHJKMNPQRSTUVWXYZ";
  return Array.from({ length: 4 }, () => letters[Math.floor(Math.random() * letters.length)]).join("");
}
