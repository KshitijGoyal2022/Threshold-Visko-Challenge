"use client";

import { useEffect, useState } from "react";

import { AnxietyChart } from "@/components/threshold/anxiety-chart";
import type { Reading } from "@/lib/threshold/engine";
import type { Ladder } from "@/lib/threshold/ladders";

// The clinician's controls. Used beside the stream in solo mode and on its own
// page in a shared session, where every action becomes a queued command.

export type ConsoleState = {
  phase: string;
  rung: number;
  readings: Reading[];
  note: string;
  auto: boolean;
  log: { t: number; text: string }[];
  error?: string;
};

export type ConsoleActions = {
  /** Resolves once the server has the direction; rejects if it did not. */
  direct: (prompt: string) => Promise<void> | void;
  jumpTo: (level: number) => void;
  safePlace: () => void;
  setAuto: (on: boolean) => void;
};

type SendStatus = "idle" | "sending" | "sent" | "failed";

export function Console({
  ladder,
  state,
  actions,
}: {
  ladder: Ladder;
  state: ConsoleState;
  actions: ConsoleActions;
}) {
  const [direction, setDirection] = useState("");
  const [status, setStatus] = useState<SendStatus>("idle");
  const running = state.phase === "running";

  const sendDirection = async () => {
    const text = direction.trim();
    if (!text) return;
    setStatus("sending");
    try {
      await actions.direct(text);
      setDirection("");
      setStatus("sent");
    } catch {
      setStatus("failed");
    }
  };

  useEffect(() => {
    if (status !== "sent" && status !== "failed") return;
    const timer = setTimeout(() => setStatus("idle"), 6_000);
    return () => clearTimeout(timer);
  }, [status]);

  return (
    <>
      {state.error && <p className="error">{state.error}</p>}
      <section className="rail-section">
        <h3>Engine</h3>
        <p className="engine-note">{state.note}</p>
        <div className="toggle">
          <span>Adapt automatically</span>
          <button
            className="switch"
            role="switch"
            aria-checked={state.auto}
            aria-label="Adapt automatically"
            onClick={() => actions.setAuto(!state.auto)}
          />
        </div>
      </section>

      <section className="rail-section">
        <h3>Ladder</h3>
        <ol className="ladder">
          {ladder.rungs.map((item) => (
            <li
              key={item.level}
              className={
                item.level === state.rung ? "current" : item.level < state.rung ? "done" : ""
              }
              title={item.action}
              onClick={() => running && actions.jumpTo(item.level)}
            >
              <span className="step">{item.level + 1}</span>
              <span>{item.label}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="rail-section">
        <h3>Anxiety</h3>
        <AnxietyChart readings={state.readings} />
      </section>

      <section className="rail-section">
        <h3>Direct the room</h3>
        <p className="hint">
          One thing that visibly happens, in plain words. Not a mood: “a man in the
          front row stands up and leaves”, not “make them hostile”.
        </p>
        <textarea
          className="direct-box"
          rows={2}
          placeholder="A woman in the front row shakes her head."
          value={direction}
          disabled={!running}
          onChange={(event) => setDirection(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void sendDirection();
            }
          }}
        />
        <button
          className="wide"
          disabled={!running || !direction.trim() || status === "sending"}
          onClick={() => void sendDirection()}
        >
          {status === "sending" ? "Sending…" : "Send"}
        </button>
        {status === "sent" && (
          <p className="hint sent">Sent — watch for it in the log below, then in the room.</p>
        )}
        {status === "failed" && <p className="error">Could not reach the session. Try again.</p>}
      </section>

      <ol className="log">
        {state.log.map((entry, index) => (
          <li key={index}>
            <span className="mono">{entry.t.toFixed(0)}s</span>
            {entry.text}
          </li>
        ))}
      </ol>
    </>
  );
}
