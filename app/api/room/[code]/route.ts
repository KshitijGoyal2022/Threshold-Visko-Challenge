import { NextResponse } from "next/server";

import {
  commandsSince,
  drainMail,
  pushMail,
  queueCommand,
  readRoom,
  writeFrame,
  writeState,
} from "@/lib/server/room-store";
import type { Command, Role, RoomState, Signal } from "@/lib/threshold/protocol";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    const [commands, mail] = await Promise.all([
      commandsSince(code, since),
      drainMail(code, "patient"),
    ]);
    return NextResponse.json({ commands, mail });
  }
  const [room, mail] = await Promise.all([readRoom(code), drainMail(code, "therapist")]);
  return NextResponse.json({ state: room.state, frame: room.frame, frameAt: room.frameAt, mail });
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
  const writes: Promise<void>[] = [];
  if (body.state) writes.push(writeState(code, { ...body.state, updatedAt: Date.now() }));
  if (typeof body.frame === "string" && body.frame.length < 400_000) {
    writes.push(writeFrame(code, body.frame));
  }
  if (body.command) writes.push(queueCommand(code, body.command));
  if (body.mail && (body.mail.to === "patient" || body.mail.to === "therapist")) {
    writes.push(pushMail(code, body.mail.to, body.mail.signal));
  }
  await Promise.all(writes);
  return NextResponse.json({ ok: true });
}
