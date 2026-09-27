"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { ClientOnly } from "@/components/threshold/client-only";
import { ReactorShell } from "@/components/threshold/reactor-shell";
import { SessionView } from "@/components/threshold/session-view";
import { LADDERS } from "@/lib/threshold/ladders";

function Patient() {
  const params = useSearchParams();
  const ladder = LADDERS.find((item) => item.id === params.get("fear")) ?? LADDERS[0];
  const roomId =
    ladder.rooms.find((room) => room.id === params.get("room"))?.id ?? ladder.rooms[0].id;
  const live = params.get("live") !== "0";
  const code = params.get("code");

  return (
    <ReactorShell>
      {(jwt) => <SessionView ladder={ladder} roomId={roomId} live={live} code={code} {...jwt} />}
    </ReactorShell>
  );
}

export default function PatientPage() {
  return (
    <ClientOnly>
      <Suspense>
        <Patient />
      </Suspense>
    </ClientOnly>
  );
}
