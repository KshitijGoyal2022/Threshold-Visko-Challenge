"use client";

import { useState } from "react";

import { LADDERS } from "@/lib/threshold/ladders";
import { newCode } from "@/lib/threshold/protocol";

export default function Home() {
  const [fearId, setFearId] = useState(LADDERS[0].id);
  const ladder = LADDERS.find((item) => item.id === fearId) ?? LADDERS[0];
  const [roomId, setRoomId] = useState(ladder.rooms[0].id);
  const [code, setCode] = useState<string | null>(null);

  const query = `fear=${ladder.id}&room=${roomId}`;
  const patientUrl = code ? `/patient?code=${code}&${query}` : "";
  const therapistUrl = code ? `/therapist?code=${code}&${query}` : "";

  return (
    <div className="intake">
      <section className="intake-copy">
        <span className="wordmark">Threshold</span>
        <div>
          <h1>
            Face it
            <br />
            at <em>your</em> pace.
          </h1>
          <p className="intake-lede">
            A live scene, generated in real time by Visko Orbis, that gets harder as
            you settle and eases the moment you need it to. Exposure therapy that
            listens.
          </p>
        </div>
        <p className="intake-foot">
          A tool for clinicians and their patients. Not a medical device.
        </p>
      </section>

      <section className="intake-form">
        <div className="field">
          <span className="field-label">What are we working on?</span>
          <div className="choice-list" role="radiogroup" aria-label="Fear">
            {LADDERS.map((item) => (
              <button
                key={item.id}
                className="choice choice-row"
                role="radio"
                aria-checked={item.id === fearId}
                aria-pressed={item.id === fearId}
                onClick={() => setFearId(item.id)}
              >
                <span className="choice-title">{item.title}</span>
                <small className="choice-scene">{item.rooms[0].label}</small>
              </button>
            ))}
          </div>
        </div>

        {ladder.rooms.length > 1 && (
        <div className="field">
          <span className="field-label">Where are we?</span>
          <div className="choice-grid">
            {ladder.rooms.map((room) => (
              <button
                key={room.id}
                className="choice"
                aria-pressed={room.id === roomId}
                onClick={() => setRoomId(room.id)}
              >
                <span>{room.label}</span>
                <small>{room.anchor ? "From a photo" : "From text"}</small>
              </button>
            ))}
          </div>
        </div>
        )}

        {!code ? (
          <div className="intake-actions">
            <button className="primary" onClick={() => setCode(newCode())}>
              Create a session
            </button>
          </div>
        ) : (
          <div className="field">
            <span className="field-label">
              Session <span className="mono">{code}</span> — open each link on its own screen
            </span>
            <div className="link-grid">
              <a className="choice" href={patientUrl} target="_blank" rel="noreferrer">
                <span>Patient screen</span>
                <small>The live room, the anxiety slider, Safe place. Streams Orbis.</small>
              </a>
              <a className="choice" href={therapistUrl} target="_blank" rel="noreferrer">
                <span>Clinician console</span>
                <small>Preview, ladder, direct the room, live anxiety, report.</small>
              </a>
            </div>
            <div className="intake-actions">
              <button className="ghost" onClick={() => setCode(null)}>
                Change setup
              </button>
              <span className="hint">
                Solo on one screen? <a href={`/session?${query}&live=1`}>Open the combined view.</a>
              </span>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
