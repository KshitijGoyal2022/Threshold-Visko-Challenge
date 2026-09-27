"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { ClientOnly } from "@/components/threshold/client-only";
import { ReactorShell } from "@/components/threshold/reactor-shell";
import { SessionView } from "@/components/threshold/session-view";
import { LADDERS } from "@/lib/threshold/ladders";

function Session() {
  const params = useSearchParams();
  const ladder = LADDERS.find((item) => item.id === params.get("fear")) ?? LADDERS[0];
  const roomId =
    ladder.rooms.find((room) => room.id === params.get("room"))?.id ?? ladder.rooms[0].id;
  const live = params.get("live") !== "0";
  const anchorUrl = params.get("anchor") ?? undefined;

  return (
    <ReactorShell>
      {(jwt) => (
        <SessionView
          ladder={ladder}
          roomId={roomId}
          live={live}
          anchorUrl={anchorUrl}
          {...jwt}
        />
      )}
    </ReactorShell>
  );
}

export default function SessionPage() {
  return (
    <ClientOnly>
      <Suspense>
        <Session />
      </Suspense>
    </ClientOnly>
  );
}
