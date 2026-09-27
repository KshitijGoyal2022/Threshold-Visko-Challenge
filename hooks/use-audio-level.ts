"use client";

import { useEffect, useState } from "react";

// Watches the live <video> element the SDK renders and reports the loudness
// of its audio track (0–1) plus whether the browser actually let it play.
// Browsers may refuse unmuted autoplay; the SDK swallows that error, so the
// only way to know is to look at the element.

export function useAudioLevel(active: boolean, selector = ".frame video") {
  const [level, setLevel] = useState(0);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    if (!active) {
      setLevel(0);
      setBlocked(false);
      return;
    }

    let context: AudioContext | null = null;
    let raf = 0;
    let cancelled = false;
    let attached: MediaStream | null = null;
    const buffer = new Float32Array(1024);

    const poll = () => {
      if (cancelled) return;
      const video = document.querySelector<HTMLVideoElement>(selector);
      const stream = (video?.srcObject as MediaStream | null) ?? null;
      const track = stream?.getAudioTracks()[0];

      if (video && stream && track && stream !== attached) {
        attached = stream;
        context?.close().catch(() => {});
        context = new AudioContext();
        const analyser = context.createAnalyser();
        analyser.fftSize = buffer.length;
        context.createMediaStreamSource(new MediaStream([track])).connect(analyser);
        const tick = () => {
          if (cancelled) return;
          analyser.getFloatTimeDomainData(buffer);
          let sum = 0;
          for (const sample of buffer) sum += sample * sample;
          // Root mean square, scaled so ordinary room sound fills the meter.
          setLevel(Math.min(1, Math.sqrt(sum / buffer.length) * 6));
          raf = requestAnimationFrame(tick);
        };
        tick();
      }
      setBlocked(Boolean(video && stream && video.paused));
    };

    const timer = setInterval(poll, 500);
    poll();
    return () => {
      cancelled = true;
      clearInterval(timer);
      cancelAnimationFrame(raf);
      context?.close().catch(() => {});
    };
  }, [active, selector]);

  const enable = () => {
    const video = document.querySelector<HTMLVideoElement>(selector);
    void video?.play().catch(() => {});
  };

  return { level, blocked, enable };
}
