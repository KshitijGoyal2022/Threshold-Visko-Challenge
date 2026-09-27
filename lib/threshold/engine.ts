// The exposure engine: decides when the scene should get harder, easier, or
// retreat to the safe place, from the patient's live anxiety ratings.
//
// Ratings use SUDS (Subjective Units of Distress, 0–100), the scale used in
// exposure therapy. The core rule is habituation: hold a rung until anxiety
// has dropped well below its peak at that rung, then offer the next one.
// Pure logic so it can be tested without a stream.

export type Reading = { t: number; suds: number };

export type EngineConfig = {
  /** Fraction of the rung's peak that anxiety must fall to before stepping up. */
  habituationRatio: number;
  /** Anxiety at or below this always counts as habituated. */
  calmFloor: number;
  /** Anxiety at or above this triggers a step down. */
  retreatCeiling: number;
  /** Minimum time on a rung before stepping up. */
  minDwellMs: number;
  /** Minimum gap between automatic decisions. */
  cooldownMs: number;
};

export const DEFAULT_CONFIG: EngineConfig = {
  habituationRatio: 0.5,
  calmFloor: 30,
  retreatCeiling: 85,
  minDwellMs: 20_000,
  cooldownMs: 15_000,
};

export type EngineState = {
  rung: number;
  peak: number;
  enteredAt: number;
  lastDecisionAt: number;
  safe: boolean;
};

export type Decision = "up" | "down" | "safe" | "hold";

export function createState(now: number, rung = 0): EngineState {
  return { rung, peak: 0, enteredAt: now, lastDecisionAt: now, safe: false };
}

/** Record a rating and return what the scene should do next. */
export function decide(
  state: EngineState,
  reading: Reading,
  maxRung: number,
  config: EngineConfig = DEFAULT_CONFIG,
): { state: EngineState; decision: Decision } {
  const next = { ...state, peak: Math.max(state.peak, reading.suds) };
  const sinceDecision = reading.t - next.lastDecisionAt;
  const dwell = reading.t - next.enteredAt;

  if (next.safe) return { state: next, decision: "hold" };
  if (sinceDecision < config.cooldownMs) return { state: next, decision: "hold" };

  if (reading.suds >= config.retreatCeiling && next.rung > 0) {
    return { state: moveTo(next, next.rung - 1, reading.t), decision: "down" };
  }

  const habituated =
    reading.suds <= config.calmFloor ||
    reading.suds <= next.peak * config.habituationRatio;
  if (habituated && dwell >= config.minDwellMs && next.rung < maxRung) {
    return { state: moveTo(next, next.rung + 1, reading.t), decision: "up" };
  }

  return { state: next, decision: "hold" };
}

/** A manual move by the clinician, or a step the engine chose. */
export function moveTo(state: EngineState, rung: number, now: number): EngineState {
  return { ...state, rung, peak: 0, enteredAt: now, lastDecisionAt: now, safe: false };
}

export function enterSafePlace(state: EngineState, now: number): EngineState {
  return { ...state, safe: true, lastDecisionAt: now };
}

/** A one-line explanation of what the engine is waiting for, for the console. */
export function describe(
  state: EngineState,
  latest: number | undefined,
  now: number,
  config: EngineConfig = DEFAULT_CONFIG,
): string {
  if (state.safe) return "In the safe place. Step up when ready.";
  if (latest === undefined) return "Waiting for a first rating.";
  const target = Math.max(config.calmFloor, Math.round(state.peak * config.habituationRatio));
  const dwellLeft = Math.max(0, config.minDwellMs - (now - state.enteredAt));
  if (latest >= config.retreatCeiling) return "Anxiety is high. Stepping down.";
  if (latest <= target) {
    return dwellLeft > 0
      ? `Habituated. Holding ${Math.ceil(dwellLeft / 1000)}s more before stepping up.`
      : "Habituated. Stepping up.";
  }
  return `Holding until anxiety falls to ${target} (peak ${state.peak}).`;
}
