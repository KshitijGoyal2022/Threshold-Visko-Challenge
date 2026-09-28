// Turns "go to rung B from rung A" into the one prompt Orbis needs.
// Pure logic, no network, so it can be tested without credits.

import type { Ladder } from "@/lib/threshold/ladders";

export type Move = { prompt: string; audio: string | undefined };

/** A direct jump: the target's action, preceded by how the current rung ends
 *  when moving to a calmer one (the model keeps what you don't change). */
export function planJump(ladder: Ladder, from: number, to: number): Move {
  const target = ladder.rungs[to];
  const current = ladder.rungs[from];
  const prefix = to < from && current.calm ? `${current.calm} ` : "";
  return { prompt: `${prefix}${target.action}`, audio: target.audio };
}

/** The safe place: how the current rung ends, then the calm scene, so what
 *  stepped into the frame steps out again before the lights come up. */
export function planSafe(ladder: Ladder, from: number): Move {
  const current = ladder.rungs[from];
  const prefix = current.calm ? `${current.calm} ` : "";
  return { prompt: `${prefix}${ladder.safePlace.action}`, audio: undefined };
}
