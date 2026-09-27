"use client";

import { ReactorProvider } from "@reactor-team/js-sdk";
import { useCallback, useRef, type ReactNode } from "react";

import { ORBIS_MODEL_NAME, ORBIS_TRACKS, requestReactorJwt } from "@/lib/orbis";

// Wraps a page in the Reactor provider with a lazily minted, session-scoped JWT.

export function ReactorShell({
  children,
}: {
  children: (jwt: {
    clearJwt: () => void;
    getCurrentJwt: () => string | null;
  }) => ReactNode;
}) {
  const jwtPromise = useRef<Promise<string> | null>(null);
  const currentJwt = useRef<string | null>(null);

  const getJwt = useCallback(async () => {
    const pending = (jwtPromise.current ??= requestReactorJwt());
    try {
      const jwt = await pending;
      currentJwt.current = jwt;
      return jwt;
    } catch (error) {
      // Do not permanently cache a failed token request.
      if (jwtPromise.current === pending) jwtPromise.current = null;
      throw error;
    }
  }, []);
  const getCurrentJwt = useCallback(() => currentJwt.current, []);
  const clearJwt = useCallback(() => {
    jwtPromise.current = null;
    currentJwt.current = null;
  }, []);

  return (
    <ReactorProvider
      apiUrl="https://api.reactor.inc"
      modelName={ORBIS_MODEL_NAME}
      modelTracks={[...ORBIS_TRACKS]}
      connectOptions={{ autoConnect: false }}
      jwtToken={getJwt}
    >
      {children({ clearJwt, getCurrentJwt })}
    </ReactorProvider>
  );
}
