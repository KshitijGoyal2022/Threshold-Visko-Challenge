// Still frames captured from real Orbis runs, shown in mock mode so the UI can
// be built and demoed without a live stream (and without spending credits).

import { LADDERS } from "@/lib/threshold/ladders";

/** Per ladder, the highest rung each frame stands in for, highest first. */
const FRAMES: Record<string, Array<[number, string]>> = {
  "public-speaking": [
    [7, "/anchors/stage-rung8-reference.jpg"],
    [4, "/anchors/stage-rung6-reference.jpg"],
    [0, "/anchors/stage-rung0-reference.jpg"],
  ],
  heights: [
    [3, "/anchors/edge-rung2-reference.jpg"],
    [2, "/anchors/edge-rung4-reference.jpg"],
  ],
  flying: [
    [5, "/anchors/window-seat-rung5-reference.jpg"],
    [4, "/anchors/window-seat-rung4-reference.jpg"],
  ],
  horror: [
    [6, "/anchors/hallway-rung6-reference.jpg"],
    [5, "/anchors/hallway-rung5-reference.jpg"],
    [4, "/anchors/hallway-rung4-reference.jpg"],
    [3, "/anchors/hallway-rung3-reference.jpg"],
    [2, "/anchors/hallway-rung2-reference.jpg"],
  ],
  rejection: [[6, "/anchors/cafe-rung6-reference.jpg"]],
  spiders: [
    [6, "/anchors/desk-rung6-reference.jpg"],
    [5, "/anchors/desk-rung5-reference.jpg"],
  ],
  claustrophobia: [
    [6, "/anchors/elevator-rung6-reference.jpg"],
    [5, "/anchors/elevator-rung5-reference.jpg"],
    [3, "/anchors/elevator-rung3-reference.jpg"],
  ],
};

export function mockFrameFor(ladderId: string, rung: number, safe: boolean) {
  const ladder = LADDERS.find((item) => item.id === ladderId);
  const anchor = ladder?.rooms[0].anchor ?? "/anchors/stage-rung0-reference.jpg";
  if (safe) return anchor;
  const frame = (FRAMES[ladderId] ?? []).find(([min]) => rung >= min);
  return frame ? frame[1] : anchor;
}
