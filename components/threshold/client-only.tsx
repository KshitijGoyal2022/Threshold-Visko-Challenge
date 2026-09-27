"use client";

import { useSyncExternalStore, type ReactNode } from "react";

// Renders children only in the browser. The session screens read the URL,
// poll the server and drive WebRTC, so server-rendering them buys nothing and
// exposes them to hydration mismatches (browser extensions that rewrite
// buttons and inputs before React loads, for one).

const subscribe = () => () => {};

export function ClientOnly({ children }: { children: ReactNode }) {
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  return mounted ? <>{children}</> : null;
}
