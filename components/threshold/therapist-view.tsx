"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";

import { Console } from "@/components/threshold/console";
import { mockFrameFor } from "@/components/threshold/mock-frames";
import { Report } from "@/components/threshold/report";
import { stateHsl } from "@/components/threshold/session-view";
import type { Ladder } from "@/lib/threshold/ladders";
import type { CommandInput, RoomState, Signal } from "@/lib/threshold/protocol";
import { answerStream, postMail } from "@/lib/threshold/rtc";

// The clinician's screen for a shared session: the patient's stream relayed
// live, their anxiety, and every control — each one a command the patient's
// browser carries out.

const WANT_STREAM_EVERY_MS = 5_000;

export function TherapistView({ ladder, code }: { ladder: Ladder; code: string }) {
  const [state, setState] = useState<RoomState | null>(null);
  const [frame, setFrame] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [muted, setMuted] = useState(true);
  const peer = useRef<RTCPeerConnection | null>(null);
  const video = useRef<HTMLVideoElement | null>(null);
  const lastWant = useRef(0);

  useEffect(() => {
    let stopped = false;

    const signal = async (mail: Signal) => {
      switch (mail.type) {
        case "offer":
          peer.current?.close();
          peer.current = await answerStream(code, mail.sdp, (incoming) => {
            if (!stopped) setStream(incoming);
          });
          peer.current.onconnectionstatechange = () => {
            const pc = peer.current;
            if (pc && ["failed", "disconnected", "closed"].includes(pc.connectionState)) {
              setStream(null);
            }
          };
          break;
        case "candidate":
          if (peer.current?.remoteDescription) {
            await peer.current.addIceCandidate(mail.candidate).catch(() => {});
          }
          break;
      }
    };

    const poll = async () => {
      try {
        const response = await fetch(`/api/room/${code}`, { cache: "no-store" });
        const data = (await response.json()) as {
          state: RoomState | null;
          frame: string | null;
          mail: Signal[];
        };
        if (stopped) return;
        setState(data.state);
        setFrame(data.frame);
        setStale(Boolean(data.state && Date.now() - data.state.updatedAt > 5_000));
        for (const mail of data.mail) await signal(mail);

        // Ask for the live stream until we have one.
        const wantsStream =
          data.state?.phase === "running" &&
          !(peer.current && ["connected", "connecting"].includes(peer.current.connectionState));
        if (wantsStream && Date.now() - lastWant.current > WANT_STREAM_EVERY_MS) {
          lastWant.current = Date.now();
          void postMail(code, "patient", { type: "want-stream" });
        }
      } catch {
        // Retried on the next tick.
      }
    };

    void poll();
    const timer = setInterval(() => void poll(), 1_000);
    return () => {
      stopped = true;
      clearInterval(timer);
      peer.current?.close();
      peer.current = null;
    };
  }, [code]);

  useEffect(() => {
    if (!video.current) return;
    video.current.srcObject = stream;
    if (stream) void video.current.play().catch(() => {});
  }, [stream]);

  const send = async (command: CommandInput) => {
    const response = await fetch(`/api/room/${code}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command: { ...command, id: crypto.randomUUID() } }),
    });
    if (!response.ok) throw new Error(`Command rejected (${response.status})`);
  };

  const suds = state?.suds ?? 0;
  const style = { "--state": stateHsl(suds) } as CSSProperties;
  const rung = ladder.rungs[state?.rung ?? 0];
  const running = state?.phase === "running";
  const ended = state?.phase === "ended";

  return (
    <div className="session therapist" style={style}>
      <header className="topbar">
        <Link href="/" className="wordmark">
          Threshold
        </Link>
        <div className="topbar-center">
          <span className="mono">{code}</span>
          <b>{state ? rung.label : "Waiting for the patient"}</b>
          <span>{ladder.title}</span>
        </div>
        <div className="topbar-right">
          <span className={running && !stale ? "live-dot" : "live-dot off"} />
          <span>
            {!state
              ? "no patient yet"
              : stale
                ? "patient offline"
                : stream
                  ? "live relay"
                  : state.phase}
          </span>
          {stream && (
            <button className="ghost" onClick={() => setMuted((current) => !current)}>
              {muted ? "Unmute" : "Mute"}
            </button>
          )}
          {state && !ended && (
            <button onClick={() => send({ type: "end" })}>End session</button>
          )}
        </div>
      </header>

      <main className="stage">
        <div className="frame">
          <video
            ref={video}
            className="relay"
            autoPlay
            playsInline
            muted={muted}
            style={{ display: stream && !ended ? "block" : "none" }}
          />
          {!stream && frame && !ended ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={frame} alt="" />
          ) : !stream && running ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mockFrameFor(state?.rung ?? 0, false)} alt="" />
          ) : null}
          {!state && (
            <div className="frame-placeholder">
              <div>
                <p className="eyebrow">Session {code}</p>
                <p>Waiting for the patient to open their link.</p>
              </div>
            </div>
          )}
          {state?.phase === "idle" && (
            <div className="frame-placeholder">
              <div>
                <p className="eyebrow">Patient connected</p>
                <p>They can press Begin, or you can start it for them.</p>
                <button className="primary" onClick={() => send({ type: "begin" })}>
                  Begin session
                </button>
              </div>
            </div>
          )}
          {ended && state && (
            <div className="frame-placeholder">
              <div className="frame-report">
                <p className="eyebrow">Session ended</p>
                <Report ladder={ladder} readings={state.readings} history={state.history} />
              </div>
            </div>
          )}
          {running && <div className="frame-caption">{rung.summary}</div>}
        </div>
      </main>

      <footer className="dial">
        <div className="dial-number">{suds}</div>
        <div className="dial-body">
          <div className="dial-question">
            <span>Patient&apos;s anxiety right now</span>
            <span>0 calm · 100 worst imaginable</span>
          </div>
          <input
            className="slider"
            type="range"
            min={0}
            max={100}
            value={suds}
            readOnly
            disabled
            aria-label="Patient anxiety"
          />
        </div>
        <button className="safe-button" disabled={!running} onClick={() => send({ type: "safe" })}>
          Safe place
        </button>
      </footer>

      <aside className="rail">
        <Console
          ladder={ladder}
          state={{
            phase: state?.phase ?? "idle",
            rung: state?.rung ?? 0,
            readings: state?.readings ?? [],
            note: state?.note ?? "Waiting for the patient.",
            auto: state?.auto ?? false,
            disruptionsOn: state?.disruptionsOn ?? false,
            anchored: state?.anchored ?? false,
            log: state?.log ?? [],
          }}
          actions={{
            jumpTo: (level) => send({ type: "jump", level }),
            stepUp: () => send({ type: "jump", level: (state?.rung ?? 0) + 1 }),
            stepDown: () => send({ type: "jump", level: (state?.rung ?? 0) - 1 }),
            safePlace: () => send({ type: "safe" }),
            disrupt: () => send({ type: "disrupt" }),
            restart: () => send({ type: "restart" }),
            direct: (prompt) => send({ type: "direct", prompt }),
            setAuto: (on) => send({ type: "auto", on }),
            setDisruptions: (on) => send({ type: "disruptions", on }),
          }}
        />
      </aside>
    </div>
  );
}
