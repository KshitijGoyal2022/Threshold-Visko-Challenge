// In-memory store for shared sessions. Enough for a single dev server; kept on
// globalThis so hot reloads do not lose rooms.

import type { Command, Role, RoomState, Signal } from "@/lib/threshold/protocol";

export type Numbered = { seq: number; command: Command };

type Room = {
  state: RoomState | null;
  commands: Numbered[];
  nextSeq: number;
  frame: string | null;
  frameAt: number;
  mail: Record<Role, Signal[]>;
};

const KEEP_COMMANDS = 100;

const store = (globalThis as { __thresholdRooms?: Map<string, Room> }).__thresholdRooms ??=
  new Map<string, Room>();

export function getRoom(code: string) {
  let room = store.get(code);
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
    store.set(code, room);
  }
  return room;
}

export function queueCommand(code: string, command: Command) {
  const room = getRoom(code);
  room.commands.push({ seq: room.nextSeq++, command });
  if (room.commands.length > KEEP_COMMANDS) room.commands.splice(0, room.commands.length - KEEP_COMMANDS);
}

/** Everything queued after `since`; the patient remembers the last seq it ran. */
export function commandsSince(code: string, since: number) {
  return getRoom(code).commands.filter((item) => item.seq > since);
}

export function drainMail(code: string, role: Role) {
  const room = getRoom(code);
  const mail = room.mail[role];
  room.mail[role] = [];
  return mail;
}
