// Fear ladders for exposure sessions.
//
// Rules from Reactor's Orbis prompt guide, followed strictly:
//   - The opening prompt builds the world once (WHO does WHAT at WHERE +
//     camera, under 100 words). Camera words appear ONLY there.
//   - Every later prompt is ONE short action. Never restate the world.
//   - What you don't change is preserved, so leaving a noisy rung says so.
//   - Sound from the picture is "measured the best"; an audio prompt is sent
//     only for a rung that IS a sound event.
//   - A change lands in 2–4 s. Prompts are never stacked faster than that.
//   - Every action is done by someone or something ALREADY IN THE FRAME. A
//     door, a technician, or "the front row" (cut off by the lectern) makes the
//     model invent a new person or re-frame to find the thing.
//   - The viewer is never named. "The speaker" made the model SHOW a speaker
//     (and reframe to fit him in); "the camera" made it move the camera.
//     People simply look "forward".

export type Rung = {
  level: number;
  label: string;
  /** What the patient is facing, in plain words. */
  summary: string;
  /** One action that produces this rung from any calmer state. */
  action: string;
  /** How this rung ends, said before moving to a calmer one. */
  calm?: string;
  /** One sentence of sound, only when the rung is a sound event. */
  audio?: string;
  /** This rung as a standing state, for a restart from the photo. */
  state: string;
};

export type Room = {
  id: string;
  label: string;
  /** Photo that anchors the opening frame (16:9). */
  anchor?: string;
  /** The world, described once; with a photo, it describes the photo. */
  world: string;
};

export type Disruption = {
  id: string;
  label: string;
  minRung: number;
  prompt?: string;
  audio: string;
};

export type Ladder = {
  id: string;
  title: string;
  rooms: Room[];
  rungs: Rung[];
  safePlace: { label: string; action: string };
  disruptions: Disruption[];
};

const CAMERA = "Wide shot, eye-level, static camera.";

export const PUBLIC_SPEAKING: Ladder = {
  id: "public-speaking",
  title: "Public speaking",
  rooms: [
    {
      id: "stage",
      label: "On stage",
      anchor: "/anchors/stage.jpg",
      world:
        "From the lectern on a stage, an audience fills the tiered seats of a dark auditorium, lit by the glow from the stage",
    },
  ],
  rungs: [
    {
      level: 0,
      label: "Nobody is looking",
      summary: "The room is busy with itself. Phones, chatter, no eyes on you.",
      action: "The audience looks down at their phones and chats with their neighbours.",
      state: "looking at their phones and chatting with their neighbours",
    },
    {
      level: 1,
      label: "All eyes on you",
      summary: "Silence. Every face turns to you.",
      action: "The audience falls silent and every face turns forward to stare.",
      state: "sitting in silence, staring forward",
    },
    {
      level: 2,
      label: "They are judging",
      summary: "Frowns. Whispering behind hands.",
      action: "People in the middle rows frown and whisper to each other.",
      calm: "The whispering stops.",
      state: "frowning and whispering to each other",
    },
    {
      level: 3,
      label: "They are bored",
      summary: "Arms crossed. A yawn. Someone checks the time.",
      action: "A man in the middle rows yawns, crosses his arms and checks his watch.",
      state: "staring forward, a man in the middle rows yawning with his arms crossed",
    },
    {
      level: 4,
      label: "Under the lights",
      summary: "The stage lights swing onto you. The hall goes black.",
      action:
        "Bright stage lights swing forward, white glare floods the foreground and the audience falls into darkness.",
      calm: "The stage lights dim back to normal.",
      audio: "The electric buzz of stage lights in a silent hall.",
      state: "in darkness while bright stage lights flood the foreground with white glare",
    },
    {
      level: 5,
      label: "Being filmed",
      summary: "Phones come up. The room is recording you.",
      action: "The audience raises their phones and films, faces lit by the screens.",
      calm: "The phones go down.",
      state: "holding up phones, filming",
    },
    {
      level: 6,
      label: "They laugh",
      summary: "Laughter spreads. Heads shake.",
      action: "The audience bursts out laughing, shaking their heads.",
      calm: "The laughter stops.",
      audio: "Loud mocking laughter spreading across a large hall.",
      state: "laughing and shaking their heads",
    },
    {
      level: 7,
      label: "They walk out",
      summary: "People stand up and leave.",
      action: "Several people in the back rows stand up, gather their coats and climb the steps out of the hall.",
      calm: "The people who stood up sit back down.",
      audio: "Seats flipping up and footsteps on hard steps.",
      state: "staring forward while several people in the back rows climb the steps out of the hall",
    },
    {
      level: 8,
      label: "The heckler",
      summary: "A man stands up and shouts at you.",
      action: "A man in the middle rows stands up, points forward and shouts.",
      calm: "The man sits back down.",
      audio: "A man's angry voice shouting in a silent hall.",
      state: "staring at a man in the middle rows who stands, pointing forward and shouting",
    },
  ],
  safePlace: {
    label: "Safe place",
    action: "The audience looks down at their phones and the house lights warm to a soft glow.",
  },
  disruptions: [
    {
      id: "phone",
      label: "A phone rings",
      minRung: 1,
      prompt: "Someone in the middle rows fumbles to silence a ringing phone.",
      audio: "A phone ringtone in a quiet hall, cut off abruptly.",
    },
    {
      id: "cough",
      label: "A loud cough",
      minRung: 1,
      audio: "A single loud cough echoing in a quiet hall.",
    },
    {
      id: "door",
      label: "A door slams",
      minRung: 1,
      prompt: "Heads in the back rows turn toward a loud bang behind them.",
      audio: "A heavy door slamming shut, the echo fading.",
    },
    {
      id: "watch",
      label: "Someone checks the time",
      minRung: 1,
      prompt: "A woman in the second row checks her watch and sighs.",
      audio: "A long sigh in a silent hall.",
    },
    {
      id: "leave-one",
      label: "Someone leaves",
      minRung: 2,
      prompt: "A person on the aisle stands up, picks up their coat and climbs the steps out of the hall.",
      audio: "A seat flipping up and footsteps climbing hard steps.",
    },
  ],
};

export const LADDERS: Ladder[] = [PUBLIC_SPEAKING];

/** The opening prompt: the world once, what the audience is doing, the camera. */
export function openingPrompt(room: Room, rung: Rung) {
  return `${room.world}, ${rung.state}. ${CAMERA}`;
}
