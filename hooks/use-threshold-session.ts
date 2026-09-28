"use client";

import { useReactor } from "@reactor-team/js-sdk";
import { useCallback, useEffect, useRef, useState } from "react";

import { useOrbisSession } from "@/hooks/use-orbis-session";
import { planJump, planSafe } from "@/lib/threshold/director";
import {
  createState,
  decide,
  describe,
  enterSafePlace,
  moveTo,
  type EngineState,
  type Reading,
} from "@/lib/threshold/engine";
import { openingPrompt, type Ladder } from "@/lib/threshold/ladders";
import type { RungVisit } from "@/lib/threshold/protocol";

// Ties the exposure engine to the Orbis stream. The patient rates anxiety, the
// engine decides up/down/hold, and every move is ONE prompt to Orbis.
// In mock mode nothing is sent.

export type Phase =
  | "idle"
  | "connecting"
  | "starting"
  | "running"
  | "restarting"
  | "ended";

export type LogEntry = { t: number; text: string };

const ENGINE_TICK_MS = 5_000;
/** Interruptions: how often the room considers one, and the least time since
 *  the last prompt before it may. Off unless the clinician turns them on. */
const DISRUPTION_TICK_MS = 20_000;
const DISRUPTION_MIN_GAP_MS = 12_000;
const DISRUPTION_CHANCE = 0.5;
/** A change lands over 2–4 s; prompts are never sent closer than this. */
const MIN_PROMPT_GAP_MS = 4_000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function useThresholdSession({
  ladder,
  roomId,
  live,
  anchorUrl,
  clearJwt,
  getCurrentJwt,
}: {
  ladder: Ladder;
  roomId: string;
  live: boolean;
  /** Photo to anchor the opening frame; overrides the room's own anchor. */
  anchorUrl?: string;
  clearJwt: () => void;
  getCurrentJwt: () => string | null;
}) {
  const orbis = useOrbisSession(clearJwt, getCurrentJwt);
  const sendCommand = useReactor((state) => state.sendCommand);

  const room = ladder.rooms.find((item) => item.id === roomId) ?? ladder.rooms[0];
  const anchor = anchorUrl ?? room.anchor;

  const [phase, setPhase] = useState<Phase>("idle");
  const [rung, setRung] = useState(0);
  const [suds, setSuds] = useState(20);
  const [readings, setReadings] = useState<Reading[]>([]);
  // The clinician drives; automatic adaptation is an opt-in.
  const [auto, setAuto] = useState(false);
  const [disruptionsOn, setDisruptionsOn] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [history, setHistory] = useState<RungVisit[]>([]);
  const [note, setNote] = useState("Waiting for a first rating.");

  const engine = useRef<EngineState>(createState(0));
  const startedAt = useRef<number | null>(null);
  const lastPromptAt = useRef(0);
  const latestSuds = useRef(suds);
  const anchorFile = useRef<File | null>(null);
  const maxRung = ladder.rungs.length - 1;

  const elapsed = () =>
    startedAt.current === null ? 0 : performance.now() - startedAt.current;

  const append = useCallback((text: string) => {
    const t = startedAt.current === null ? 0 : performance.now() - startedAt.current;
    setLog((current) => [{ t: t / 1000, text }, ...current].slice(0, 200));
  }, []);

  /** One prompt to Orbis. `audio` undefined clears the sound prompt so the
   *  sound comes from the picture; a string describes a sound event. */
  const send = useCallback(
    async (prompt: string, audio?: string) => {
      const wait = MIN_PROMPT_GAP_MS - (performance.now() - lastPromptAt.current);
      if (wait > 0) await sleep(wait);
      lastPromptAt.current = performance.now();
      if (!live) return;
      await Promise.all([
        sendCommand("set_prompt", { prompt }),
        sendCommand("set_audio_prompt", { prompt: audio ?? "" }),
      ]);
    },
    [live, sendCommand],
  );

  const startRun = useCallback(
    async (level: number) => {
      const opening = openingPrompt(room, ladder.rungs[level]);
      append(`Opening — "${opening}"`);
      if (!live) return true;
      const ok = await orbis.startWithPrompt(opening, anchorFile.current);
      if (ok) lastPromptAt.current = performance.now();
      return ok;
    },
    [append, ladder, live, orbis, room],
  );

  const begin = useCallback(async () => {
    startedAt.current = performance.now();
    engine.current = createState(0);
    setRung(0);
    setReadings([]);
    setLog([]);
    setHistory([{ t: 0, level: 0 }]);
    append(`Room: ${room.label}`);

    if (!live) {
      setPhase("running");
      return;
    }
    setPhase("connecting");
    if (!(await orbis.connectSession())) {
      setPhase("idle");
      return;
    }
    setPhase("starting");
    if (anchor) {
      const blob = await (await fetch(anchor)).blob();
      anchorFile.current = new File([blob], "anchor.jpg", { type: blob.type || "image/jpeg" });
      append(`Anchor photo: ${anchor}`);
    }
    setPhase((await startRun(0)) ? "running" : "idle");
  }, [anchor, append, live, orbis, room, startRun]);

  const end = useCallback(async () => {
    setPhase("ended");
    if (live) await orbis.disconnectSession();
  }, [live, orbis]);

  /** Jump straight to a rung with one prompt. */
  const jumpTo = useCallback(
    (target: number, reason: string) => {
      const from = engine.current.rung;
      const to = Math.max(0, Math.min(maxRung, target));
      if (to === from && !engine.current.safe) return;
      engine.current = moveTo(engine.current, to, elapsed());
      const move = planJump(ladder, from, to);
      append(`${reason} → ${to + 1} ${ladder.rungs[to].label} — "${move.prompt}"`);
      setRung(to);
      setHistory((current) => [...current, { t: elapsed(), level: to }]);
      void send(move.prompt, move.audio);
    },
    [append, ladder, maxRung, send],
  );

  /** Stop and start again from the photo at the current rung. The world is
   *  rebuilt, so faces change; only for when the picture has drifted. */
  const restart = useCallback(async () => {
    const level = engine.current.rung;
    append(`Restart from photo at ${level + 1} ${ladder.rungs[level].label}`);
    setPhase("restarting");
    if (live) {
      await orbis.reset();
      await sleep(800);
    } else {
      await sleep(2_000);
    }
    setPhase((await startRun(level)) ? "running" : "idle");
  }, [append, ladder, live, orbis, startRun]);

  const safePlace = useCallback(() => {
    const move = planSafe(ladder, engine.current.rung);
    engine.current = enterSafePlace(engine.current, elapsed());
    append(`Safe place — "${move.prompt}"`);
    void send(move.prompt, move.audio);
    setNote(describe(engine.current, latestSuds.current, elapsed()));
  }, [append, ladder, send]);

  /** A clinician's own words, sent as the next action. */
  const direct = useCallback(
    (prompt: string) => {
      const text = prompt.trim();
      if (!text) return;
      append(`Clinician — "${text}"`);
      void send(text);
    },
    [append, send],
  );

  /** Throw an interruption without changing rung. */
  const disrupt = useCallback(
    (id?: string) => {
      const eligible = ladder.disruptions.filter(
        (item) => item.minRung <= engine.current.rung && (!id || item.id === id),
      );
      const pick = eligible[Math.floor(Math.random() * eligible.length)];
      if (!pick) return;
      append(`Interruption: ${pick.label}${pick.prompt ? ` — "${pick.prompt}"` : ""}`);
      void send(pick.prompt ?? ladder.rungs[engine.current.rung].action, pick.audio);
    },
    [append, ladder, send],
  );

  useEffect(() => {
    if (phase !== "running" || !disruptionsOn) return;
    const timer = setInterval(() => {
      if (engine.current.safe) return;
      if (performance.now() - lastPromptAt.current < DISRUPTION_MIN_GAP_MS) return;
      if (Math.random() > DISRUPTION_CHANCE) return;
      disrupt();
    }, DISRUPTION_TICK_MS);
    return () => clearInterval(timer);
  }, [disrupt, disruptionsOn, phase]);

  /** Feed a rating to the engine and act on its decision. */
  const evaluate = useCallback(
    (reading: Reading) => {
      const result = decide(engine.current, reading, maxRung);
      if (!auto) {
        // Manual mode: track the peak, but the clinician moves the rung.
        engine.current = { ...engine.current, peak: result.state.peak };
        setNote(`Manual. Peak so far ${engine.current.peak}, now ${reading.suds}.`);
        return;
      }
      setNote(describe(result.state, reading.suds, reading.t));
      if (result.decision === "up" || result.decision === "down") {
        jumpTo(result.state.rung, result.decision === "up" ? `Habituated at ${reading.suds}` : `Too high at ${reading.suds}`);
      } else {
        engine.current = result.state;
      }
    },
    [auto, jumpTo, maxRung],
  );

  const rate = useCallback(
    (value: number) => {
      setSuds(value);
      latestSuds.current = value;
      if (phase !== "running") return;
      const reading = { t: elapsed(), suds: value };
      setReadings((current) => [...current, reading]);
      evaluate(reading);
    },
    [evaluate, phase],
  );

  // The stream can end on its own (session cap, network). End the session
  // so the report shows instead of prompts going nowhere.
  useEffect(() => {
    if (!live || phase !== "running" || orbis.status !== "disconnected") return;
    append("The stream ended.");
    setPhase("ended");
  }, [append, live, orbis.status, phase]);

  // Dwell and cooldown rules need to fire even when the slider is untouched.
  useEffect(() => {
    if (phase !== "running") return;
    const timer = setInterval(() => {
      const reading = { t: elapsed(), suds: latestSuds.current };
      setReadings((current) => [...current, reading]);
      evaluate(reading);
    }, ENGINE_TICK_MS);
    return () => clearInterval(timer);
  }, [evaluate, phase]);

  return {
    phase,
    rung,
    suds,
    readings,
    auto,
    disruptionsOn,
    anchored: Boolean(anchor),
    log,
    history,
    roomLabel: room.label,
    note,
    error: orbis.error,
    muted: orbis.muted,
    streaming: live && orbis.runStarted,
    begin,
    end,
    rate,
    setAuto,
    setDisruptionsOn,
    disrupt,
    direct,
    restart: () => void restart(),
    stepUp: () => jumpTo(engine.current.rung + 1, "Clinician"),
    stepDown: () => jumpTo(engine.current.rung - 1, "Clinician"),
    jumpTo: (target: number) => jumpTo(target, "Clinician"),
    safePlace,
    toggleMuted: orbis.toggleMuted,
  };
}

export type ThresholdSession = ReturnType<typeof useThresholdSession>;
