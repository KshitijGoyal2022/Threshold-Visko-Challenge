"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { ClientOnly } from "@/components/threshold/client-only";
import { TherapistView } from "@/components/threshold/therapist-view";
import { LADDERS } from "@/lib/threshold/ladders";

function Therapist() {
  const params = useSearchParams();
  const ladder = LADDERS.find((item) => item.id === params.get("fear")) ?? LADDERS[0];
  const code = params.get("code") ?? "";
  return <TherapistView ladder={ladder} code={code} />;
}

export default function TherapistPage() {
  return (
    <ClientOnly>
      <Suspense>
        <Therapist />
      </Suspense>
    </ClientOnly>
  );
}
