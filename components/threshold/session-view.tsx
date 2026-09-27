"use client";

import { ReactorView } from "@reactor-team/js-sdk";
import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";

import { Console } from "@/components/threshold/console";
import { mockFrameFor } from "@/components/threshold/mock-frames";
import { Report } from "@/components/threshold/report";
import { useAudioLevel } from "@/hooks/use-audio-level";
import { useRoomSync } from "@/hooks/use-room-sync";
import { useThresholdSession } from "@/hooks/use-threshold-session";
import type { Ladder } from "@/lib/threshold/ladders";

type Props = {
  ladder: Ladder;
  roomId: string;
  live: boolean;
  anchorUrl?: string;
  /** With a code, this is the patient's screen of a shared session: no
   *  console, and the clinician's commands arrive from the server. */
  code?: string | null;
  clearJwt: () => void;
  getCurrentJwt: () => string | null;
};

/** Sage at 0, amber around 50, coral at 100: the one colour the UI speaks in. */
export function stateHsl(suds: number) {
  const stops: [number, [number, number, number]][] = [
    [0, [150, 34, 62]],
    [50, [38, 92, 62]],
    [100, [6, 86, 64]],
  ];
  const upper = stops.find(([at]) => at >= suds) ?? stops[stops.length - 1];
  const lower = [...stops].reverse().find(([at]) => at <= suds) ?? stops[0];
  const range = upper[0] - lower[0] || 1;
  const k = (suds - lower[0]) / range;
  const mix = lower[1].map((value, index) => value + (upper[1][index] - value) * k);
  return `${mix[0].toFixed(0)} ${mix[1].toFixed(0)}% ${mix[2].toFixed(0)}%`;
}

export function SessionView({ ladder, roomId, live, anchorUrl, code = null, clearJwt, getCurrentJwt }: Props) {
  const session = useThresholdSession({ ladder, roomId, live, anchorUrl, clearJwt, getCurrentJwt });
  const shared = Boolean(code);
  const [railOpen, setRailOpen] = useState(!shared);
  const [clock, setClock] = useState(0);
  const sound = useAudioLevel(live && session.streaming);
  useRoomSync(code, session, { fear: ladder.id, room: roomId });

  useEffect(() => {
    if (session.phase !== "running") return;
    const started = Date.now() - (session.readings.at(-1)?.t ?? 0);
    const timer = setInterval(() => setClock(Date.now() - started), 1000);
    return () => clearInterval(timer);
    // The clock only needs to start once the session is running.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.phase]);

  const rung = ladder.rungs[session.rung];
  const running = session.phase === "running";
  const style = { "--state": stateHsl(session.suds) } as CSSProperties;
  const minutes = Math.floor(clock / 60_000);
  const seconds = Math.floor((clock % 60_000) / 1000);

  return (
    <div className={railOpen ? "session" : "session rail-hidden"} style={style}>
      <header className="topbar">
        <Link href="/" className="wordmark">
          Threshold
        </Link>
        <div className="topbar-center">
          {shared ? (
            <>
              <span className="mono">{code}</span>
              <b>{rung.label}</b>
            </>
          ) : (
            <>
              <span className="mono">
                {session.rung + 1}/{ladder.rungs.length}
              </span>
              <b>{rung.label}</b>
              <span>{ladder.title}</span>
            </>
          )}
        </div>
        <div className="topbar-right">
          <span className="mono">
            {minutes}:{String(seconds).padStart(2, "0")}
          </span>
          <span className={session.streaming ? "live-dot" : "live-dot off"} />
          <span>{live ? (session.streaming ? "Live" : session.phase) : "Mock"}</span>
          {live && session.streaming && (
            <span className="meter" aria-label="Sound level" title="Sound from the room">
              {[0.15, 0.3, 0.45, 0.6, 0.75].map((threshold) => (
                <i key={threshold} className={sound.level >= threshold ? "on" : ""} />
              ))}
            </span>
          )}
          {live && sound.blocked && (
            <button className="primary" onClick={sound.enable}>
              Enable sound
            </button>
          )}
          {live && (
            <button className="ghost" onClick={session.toggleMuted}>
              {session.muted ? "Unmute" : "Mute"}
            </button>
          )}
          {!shared && (
            <button className="ghost" onClick={() => setRailOpen((open) => !open)}>
              {railOpen ? "Hide console" : "Console"}
            </button>
          )}
          {!shared && (running || session.phase === "restarting") && (
            <button onClick={() => void session.end()}>End session</button>
          )}
        </div>
      </header>

      <main className="stage">
        <div className="frame">
          {live && session.streaming ? (
            <div className="frame-video">
              <ReactorView
                track="main_video"
                audioTrack="main_audio"
                muted={session.muted}
                videoObjectFit="cover"
              />
            </div>
          ) : !live && running ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mockFrameFor(session.rung, false)} alt="" />
          ) : null}

          {session.phase === "idle" && (
            <div className="frame-placeholder">
              <div>
                <p className="eyebrow">Ready</p>
                <p>
                  {session.roomLabel}. Nobody is looking yet.
                  {shared && " Your clinician can see and steer this session."}
                </p>
                <button className="primary" onClick={() => void session.begin()}>
                  Begin session
                </button>
              </div>
            </div>
          )}
          {(session.phase === "connecting" || session.phase === "starting") && (
            <div className="frame-placeholder">
              <div>
                <div className="breath-ring" />
                <p>{session.phase === "connecting" ? "Connecting…" : "Building the room…"}</p>
              </div>
            </div>
          )}
          {session.phase === "restarting" && (
            <div className="breath">
              <div>
                <div className="breath-ring" />
                <p>Restarting from the photo…</p>
              </div>
            </div>
          )}
          {session.phase === "ended" && (
            <div className="frame-placeholder">
              <div className="frame-report">
                <p className="eyebrow">Session ended</p>
                <Report ladder={ladder} readings={session.readings} history={session.history} />
                <Link href="/" className="ghost">
                  Start another
                </Link>
              </div>
            </div>
          )}
          {running && <div className="frame-caption">{rung.summary}</div>}
        </div>
      </main>

      <footer className="dial">
        <div className="dial-number">{session.suds}</div>
        <div className="dial-body">
          <div className="dial-question">
            <span>How anxious are you right now?</span>
            <span>0 calm · 100 worst imaginable</span>
          </div>
          <input
            className="slider"
            type="range"
            min={0}
            max={100}
            value={session.suds}
            disabled={!running}
            onChange={(event) => session.rate(Number(event.target.value))}
            aria-label="Anxiety, 0 to 100"
          />
        </div>
        <button className="safe-button" disabled={!running} onClick={session.safePlace}>
          Safe place
        </button>
      </footer>

      {!shared && (
        <aside className={railOpen ? "rail" : "rail collapsed"}>
          <Console
            ladder={ladder}
            state={{
              phase: session.phase,
              rung: session.rung,
              readings: session.readings,
              note: session.note,
              auto: session.auto,
              disruptionsOn: session.disruptionsOn,
              anchored: session.anchored,
              log: session.log,
              error: session.error || undefined,
            }}
            actions={{
              jumpTo: session.jumpTo,
              stepUp: session.stepUp,
              stepDown: session.stepDown,
              safePlace: session.safePlace,
              disrupt: () => session.disrupt(),
              restart: session.restart,
              direct: session.direct,
              setAuto: session.setAuto,
              setDisruptions: session.setDisruptionsOn,
            }}
          />
        </aside>
      )}
    </div>
  );
}
