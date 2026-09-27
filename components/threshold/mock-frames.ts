// Still frames captured from real Orbis runs, shown in mock mode so the UI can
// be built and demoed without a live stream (and without spending credits).

import { LADDERS } from "@/lib/threshold/ladders";

const HIGH_RUNG_FRAMES: Record<string, [number, string]> = {
  flying: [6, "/anchors/window-seat-rung6-reference.jpg"],
  horror: [6, "/anchors/hallway-rung6-reference.jpg"],
  rejection: [6, "/anchors/cafe-rung6-reference.jpg"],
  spiders: [6, "/anchors/desk-rung6-reference.jpg"],
  claustrophobia: [3, "/anchors/elevator-rung3-reference.jpg"],
};

export function mockFrameFor(ladderId: string, rung: number, safe: boolean) {
  if (ladderId === "public-speaking") {
    if (safe || rung <= 3) return "/anchors/stage-rung0-reference.jpg";
    if (rung === 4) return "/anchors/stage-rung4-reference.jpg";
    if (rung <= 6) return "/anchors/stage-rung6-reference.jpg";
    return "/anchors/stage-rung8-reference.jpg";
  }
  if (ladderId === "heights") {
    if (safe || rung === 0) return "/anchors/edge.jpg";
    return "/anchors/edge-rung2-reference.jpg";
  }
  const ladder = LADDERS.find((item) => item.id === ladderId);
  const anchor = ladder?.rooms[0].anchor ?? "/anchors/stage-rung0-reference.jpg";
  const high = HIGH_RUNG_FRAMES[ladderId];
  if (!safe && high && rung >= high[0]) return high[1];
  return anchor;
}
