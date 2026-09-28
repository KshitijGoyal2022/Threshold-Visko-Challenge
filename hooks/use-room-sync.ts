"use client";

import { useEffect, useRef } from "react";

import type { ThresholdSession } from "@/hooks/use-threshold-session";
import type { Command, RoomState, Signal } from "@/lib/threshold/protocol";
import { offerStream } from "@/lib/threshold/rtc";

// Patient side of a shared session: publish state and a preview frame, carry
// out whatever the clinician's console has queued, and relay the live stream
// to the console when it asks for it.

const STATE_EVERY_MS = 1_000;
const FRAME_EVERY_MS = 2_000;

export function useRoomSync(
  code: string | null,
  session: ThresholdSession,
  ids: { fear: string; room: string },
) {
  const peer = useRef<RTCPeerConnection | null>(null);
  /** Seq of the last command carried out; the server resends anything newer. */
  const since = useRef(0);
  const primed = useRef(false);

  useEffect(() => {
    if (!code) return;
    const url = `/api/room/${code}`;
    let stopped = false;

    const publish = () => {
      const state: RoomState = {
        fear: ids.fear,
        room: ids.room,
        phase: session.phase,
        rung: session.rung,
        suds: session.suds,
        auto: session.auto,
        anchored: session.anchored,
        note: session.note,
        readings: session.readings.slice(-600),
        history: session.history,
        log: session.log.slice(0, 60),
        updatedAt: Date.now(),
      };
      void fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state }),
      }).catch(() => {});
    };

    const liveVideo = () => document.querySelector<HTMLVideoElement>(".frame video");

    const snapshot = () => {
      const video = liveVideo();
      if (!video || !video.videoWidth) return;
      const canvas = document.createElement("canvas");
      canvas.width = 480;
      canvas.height = 270;
      canvas.getContext("2d")?.drawImage(video, 0, 0, 480, 270);
      void fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frame: canvas.toDataURL("image/jpeg", 0.55) }),
      }).catch(() => {});
    };

    const apply = (command: Command) => {
      switch (command.type) {
        case "begin":
          if (session.phase === "idle") void session.begin();
          break;
        case "end":
          void session.end();
          break;
        case "jump":
          session.jumpTo(command.level);
          break;
        case "direct":
          session.direct(command.prompt);
          break;
        case "safe":
          session.safePlace();
          break;
        case "auto":
          session.setAuto(command.on);
          break;
      }
    };

    const signal = async (mail: Signal) => {
      const pc = peer.current;
      switch (mail.type) {
        case "want-stream": {
          // Offer only when there is something to send and no healthy link.
          const stream = liveVideo()?.srcObject as MediaStream | null;
          const healthy = pc && ["connected", "connecting", "new"].includes(pc.connectionState);
          if (!stream || healthy) return;
          pc?.close();
          peer.current = await offerStream(code, stream);
          break;
        }
        case "answer":
          if (pc && pc.signalingState === "have-local-offer") {
            await pc.setRemoteDescription({ type: "answer", sdp: mail.sdp });
          }
          break;
        case "candidate":
          if (pc && pc.remoteDescription) await pc.addIceCandidate(mail.candidate).catch(() => {});
          break;
      }
    };

    const poll = async () => {
      try {
        const response = await fetch(`${url}?role=patient&since=${since.current}`, { cache: "no-store" });
        const data = (await response.json()) as {
          commands: { seq: number; command: Command }[];
          mail: Signal[];
        };
        if (stopped) return;
        for (const item of data.commands) {
          // Commands queued before this page loaded are history, not orders.
          if (!primed.current) since.current = Math.max(since.current, item.seq);
          else if (item.seq > since.current) {
            since.current = item.seq;
            apply(item.command);
          }
        }
        primed.current = true;
        for (const mail of data.mail) await signal(mail);
      } catch {
        // The console will retry; a missed poll is harmless.
      }
    };

    publish();
    const stateTimer = setInterval(publish, STATE_EVERY_MS);
    const frameTimer = setInterval(snapshot, FRAME_EVERY_MS);
    const pollTimer = setInterval(() => void poll(), STATE_EVERY_MS);
    return () => {
      stopped = true;
      clearInterval(stateTimer);
      clearInterval(frameTimer);
      clearInterval(pollTimer);
    };
    // `session` is a fresh object every render; its fields are what matter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    code,
    ids.fear,
    ids.room,
    session.phase,
    session.rung,
    session.suds,
    session.auto,
    session.note,
    session.readings,
    session.history,
    session.log,
  ]);

  // Drop the relay when the session ends or the page goes away.
  useEffect(() => {
    if (session.phase !== "ended") return;
    peer.current?.close();
    peer.current = null;
  }, [session.phase]);
  useEffect(() => () => peer.current?.close(), []);
}
