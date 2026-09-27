import { NextResponse } from "next/server";

import { commandsSince, drainMail, getRoom, queueCommand } from "@/lib/server/room-store";
import type { Command, Role, RoomState, Signal } from "@/lib/threshold/protocol";

export const runtime = "nodejs";

const CODE = /^[A-Z]{4}$/;

type Body = {
  state?: RoomState;
  frame?: string;
  command?: Command;
  mail?: { to: Role; signal: Signal };
};

/** Patient: `?role=patient` drains queued commands. Console: everything else
 *  returns the latest state and preview frame. */
export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!CODE.test(code)) return NextResponse.json({ error: "Bad code" }, { status: 400 });
  const query = new URL(request.url).searchParams;
  if (query.get("role") === "patient") {
    const since = Number(query.get("since") ?? 0) || 0;
    return NextResponse.json({ commands: commandsSince(code, since), mail: drainMail(code, "patient") });
  }
  const room = getRoom(code);
  return NextResponse.json({
    state: room.state,
    frame: room.frame,
    frameAt: room.frameAt,
    mail: drainMail(code, "therapist"),
  });
}

/** Patient posts `state` and `frame`; console posts a `command`. */
export async function POST(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!CODE.test(code)) return NextResponse.json({ error: "Bad code" }, { status: 400 });
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const room = getRoom(code);
  if (body.state) room.state = { ...body.state, updatedAt: Date.now() };
  if (typeof body.frame === "string" && body.frame.length < 400_000) {
    room.frame = body.frame;
    room.frameAt = Date.now();
  }
  if (body.command) queueCommand(code, body.command);
  if (body.mail && (body.mail.to === "patient" || body.mail.to === "therapist")) {
    room.mail[body.mail.to].push(body.mail.signal);
  }
  return NextResponse.json({ ok: true });
}
