// Still frames captured from real Orbis runs, shown in mock mode so the UI can
// be built and demoed without a live stream (and without spending credits).

export function mockFrameFor(rung: number, safe: boolean) {
  if (safe || rung === 0) return "/anchors/stage-rung0-reference.jpg";
  if (rung <= 3) return "/anchors/stage-rung0-reference.jpg";
  if (rung === 4) return "/anchors/stage-rung4-reference.jpg";
  if (rung <= 6) return "/anchors/stage-rung6-reference.jpg";
  return "/anchors/stage-rung8-reference.jpg";
}
