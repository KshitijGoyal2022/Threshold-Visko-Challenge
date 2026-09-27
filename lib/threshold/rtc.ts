// Browser-to-browser relay of the patient's stream to the clinician's console.
// The room API carries the handshake; the media goes direct.

import type { Role, Signal } from "@/lib/threshold/protocol";

const ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

export function postMail(code: string, to: Role, signal: Signal) {
  return fetch(`/api/room/${code}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mail: { to, signal } }),
  }).catch(() => {});
}

/** Patient side: send the tracks the SDK is playing to the console. */
export async function offerStream(code: string, stream: MediaStream) {
  const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
  stream.getTracks().forEach((track) => pc.addTrack(track, stream));
  pc.onicecandidate = (event) => {
    if (event.candidate) void postMail(code, "therapist", { type: "candidate", candidate: event.candidate.toJSON() });
  };
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  await postMail(code, "therapist", { type: "offer", sdp: offer.sdp ?? "" });
  return pc;
}

/** Console side: accept the patient's offer and hand back a stream to play. */
export async function answerStream(
  code: string,
  sdp: string,
  onStream: (stream: MediaStream) => void,
) {
  const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
  pc.ontrack = (event) => {
    if (event.streams[0]) onStream(event.streams[0]);
  };
  pc.onicecandidate = (event) => {
    if (event.candidate) void postMail(code, "patient", { type: "candidate", candidate: event.candidate.toJSON() });
  };
  await pc.setRemoteDescription({ type: "offer", sdp });
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  await postMail(code, "patient", { type: "answer", sdp: answer.sdp ?? "" });
  return pc;
}
