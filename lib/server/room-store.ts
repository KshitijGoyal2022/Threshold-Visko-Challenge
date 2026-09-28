// Rooms for shared sessions. With an Upstash Redis (the Vercel "Upstash for
// Redis" integration sets KV_REST_API_URL and KV_REST_API_TOKEN) every server
// instance sees the same room, which is what a deployment needs. Without one,
// rooms live in memory on globalThis: fine for one dev server, and hot
// reloads do not lose them.

import { Redis } from "@upstash/redis";

import type { Command, Role, RoomState, Signal } from "@/lib/threshold/protocol";

export type Numbered = { seq: number; command: Command };
export type RoomView = { state: RoomState | null; frame: string | null; frameAt: number };

const KEEP_COMMANDS = 100;
const MAIL_BATCH = 50;
/** A room is forgotten this long after its last write. */
const TTL_SECONDS = 3 * 60 * 60;

// Memory backend -------------------------------------------------------------

type Room = {
  state: RoomState | null;
  commands: Numbered[];
  nextSeq: number;
  frame: string | null;
  frameAt: number;
  mail: Record<Role, Signal[]>;
};

const memory = (globalThis as { __thresholdRooms?: Map<string, Room> }).__thresholdRooms ??=
  new Map<string, Room>();

function memoryRoom(code: string) {
  let room = memory.get(code);
  if (room) {
    // Rooms outlive hot reloads of this module; fill in any field added since.
    room.commands = (room.commands ?? []).filter((item) => Number.isFinite(item.seq));
    if (!Number.isFinite(room.nextSeq)) {
      room.nextSeq = (room.commands.at(-1)?.seq ?? 0) + 1;
    }
    room.mail ??= { patient: [], therapist: [] };
    room.frame ??= null;
    room.frameAt ??= 0;
  }
  if (!room) {
    room = {
      state: null,
      commands: [],
      nextSeq: 1,
      frame: null,
      frameAt: 0,
      mail: { patient: [], therapist: [] },
    };
    memory.set(code, room);
  }
  return room;
}

// Redis backend --------------------------------------------------------------

const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = url && token ? new Redis({ url, token }) : null;

/** True when rooms are shared across server instances. */
export const sharedRooms = Boolean(redis);

const key = (code: string, part: string) => `threshold:${code}:${part}`;

// Operations -----------------------------------------------------------------

export async function readRoom(code: string): Promise<RoomView> {
  if (!redis) {
    const room = memoryRoom(code);
    return { state: room.state, frame: room.frame, frameAt: room.frameAt };
  }
  const [state, frame, frameAt] = await redis.mget<[RoomState | null, string | null, number | null]>(
    key(code, "state"),
    key(code, "frame"),
    key(code, "frameAt"),
  );
  return { state: state ?? null, frame: frame ?? null, frameAt: frameAt ?? 0 };
}

export async function writeState(code: string, state: RoomState) {
  if (!redis) {
    memoryRoom(code).state = state;
    return;
  }
  await redis.set(key(code, "state"), state, { ex: TTL_SECONDS });
}

export async function writeFrame(code: string, frame: string) {
  if (!redis) {
    const room = memoryRoom(code);
    room.frame = frame;
    room.frameAt = Date.now();
    return;
  }
  const batch = redis.pipeline();
  batch.set(key(code, "frame"), frame, { ex: TTL_SECONDS });
  batch.set(key(code, "frameAt"), Date.now(), { ex: TTL_SECONDS });
  await batch.exec();
}

export async function queueCommand(code: string, command: Command) {
  if (!redis) {
    const room = memoryRoom(code);
    room.commands.push({ seq: room.nextSeq++, command });
    if (room.commands.length > KEEP_COMMANDS) {
      room.commands.splice(0, room.commands.length - KEEP_COMMANDS);
    }
    return;
  }
  const seq = await redis.incr(key(code, "seq"));
  const item: Numbered = { seq, command };
  const batch = redis.pipeline();
  batch.rpush(key(code, "commands"), item);
  batch.ltrim(key(code, "commands"), -KEEP_COMMANDS, -1);
  batch.expire(key(code, "commands"), TTL_SECONDS);
  batch.expire(key(code, "seq"), TTL_SECONDS);
  await batch.exec();
}

/** Everything queued after `since`; the patient remembers the last seq it ran. */
export async function commandsSince(code: string, since: number): Promise<Numbered[]> {
  if (!redis) return memoryRoom(code).commands.filter((item) => item.seq > since);
  const items = await redis.lrange<Numbered>(key(code, "commands"), 0, -1);
  return items.filter((item) => Number.isFinite(item.seq) && item.seq > since);
}

export async function pushMail(code: string, to: Role, signal: Signal) {
  if (!redis) {
    memoryRoom(code).mail[to].push(signal);
    return;
  }
  const batch = redis.pipeline();
  batch.rpush(key(code, `mail:${to}`), signal);
  batch.expire(key(code, `mail:${to}`), TTL_SECONDS);
  await batch.exec();
}

export async function drainMail(code: string, role: Role): Promise<Signal[]> {
  if (!redis) {
    const room = memoryRoom(code);
    const mail = room.mail[role];
    room.mail[role] = [];
    return mail;
  }
  const items = await redis.lpop<Signal[]>(key(code, `mail:${role}`), MAIL_BATCH);
  return items ?? [];
}
