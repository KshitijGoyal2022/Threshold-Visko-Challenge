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
//   - A single named person pulls the camera into a close-up of them and it
//     never comes back. Rungs act on the crowd or the environment; one named
//     person only for the climax.
//   - Camera rungs describe the VIEW that results, never a body movement.
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
      action: "Across the rows people yawn, cross their arms and check their watches.",
      state: "yawning, arms crossed, checking their watches",
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

export const HEIGHTS: Ladder = {
  id: "heights",
  title: "Heights",
  rooms: [
    {
      id: "edge",
      label: "The edge",
      anchor: "/anchors/edge.jpg",
      world:
        "POV from the open edge of a skyscraper roof with no railing, a narrow steel beam sticking out over the drop, the street hundreds of feet below with tiny cars, the city skyline beyond",
    },
  ],
  // The fear is already in the opening picture. Each rung is one change of
  // VIEW toward the drop (what ends up in frame, never a body movement) or one
  // thing that happens at the edge. Calm is the view coming back up.
  rungs: [
    {
      level: 0,
      label: "Eyes on the skyline",
      summary: "At the edge. The beam and the drop below, the city ahead.",
      action: "The view tilts up until the skyline fills the top of the frame, the roof edge and the beam in the lower half.",
      state: "the roof edge and the beam over the drop in the lower half of the frame, the skyline above",
    },
    {
      level: 1,
      label: "A glance down",
      summary: "The edge, the beam and the drop come into view.",
      action: "The view tilts down until the beam and the drop to the street fill most of the frame.",
      calm: "The view tilts back up toward the skyline.",
      state: "tilted down so the beam and the drop to the street fill most of the frame",
    },
    {
      level: 2,
      label: "Straight down",
      summary: "Only the street, hundreds of feet below.",
      action: "The view tilts straight down past the edge until only the street far below, with its tiny cars, fills the frame.",
      calm: "The view tilts back up to the edge and the skyline.",
      state: "tilted straight down past the edge, only the street far below filling the frame",
    },
    {
      level: 3,
      label: "The wind",
      summary: "A hard gust. Grit skitters over the edge and falls.",
      action: "A hard gust blows across the roof and loose grit skitters over the edge and falls away.",
      calm: "The wind dies down.",
      audio: "A hard gust of wind on a high rooftop, grit scattering.",
      state: "tilted down over the edge, wind blowing grit off the roof into the drop",
    },
    {
      level: 4,
      label: "Out on the beam",
      summary: "Forward along the beam, the drop on both sides.",
      action: "The view moves forward out along the narrow beam, the drop on both sides.",
      calm: "The view moves back along the beam onto the roof.",
      state: "out on the narrow beam over the drop, the street far below on both sides",
    },
    {
      level: 5,
      label: "The beam bounces",
      summary: "It flexes and sways under you.",
      action: "The beam flexes and bounces, swaying over the drop.",
      calm: "The beam steadies.",
      audio: "Metal flexing and creaking, wind whistling past.",
      state: "out on the narrow beam as it flexes and sways over the drop",
    },
    {
      level: 6,
      label: "Something falls",
      summary: "A chunk breaks off the edge and tumbles all the way down.",
      action: "A chunk of concrete breaks off the roof edge and tumbles down toward the street, shrinking as it falls.",
      calm: "The edge is still again.",
      audio: "A sharp crack, a long silence, then a faint distant impact.",
      state: "out on the beam, a chunk of concrete falling away from the edge toward the street",
    },
  ],
  safePlace: {
    label: "Safe place",
    action: "The view pulls back from the edge onto the roof and tilts up to the calm skyline.",
  },
  disruptions: [
    {
      id: "gust",
      label: "A gust",
      minRung: 1,
      prompt: "A sudden gust of wind sweeps across the roof.",
      audio: "A sudden gust of wind on a high rooftop.",
    },
    {
      id: "siren",
      label: "A siren far below",
      minRung: 1,
      audio: "A siren wailing far below in the streets, thin with distance.",
    },
    {
      id: "pigeon",
      label: "A pigeon drops off the edge",
      minRung: 1,
      prompt: "A pigeon at the roof edge launches off and drops out of sight.",
      audio: "A flurry of wings, then wind.",
    },
    {
      id: "helicopter",
      label: "A helicopter passes",
      minRung: 2,
      audio: "A helicopter thudding past below, fading.",
    },
    {
      id: "creak",
      label: "The beam creaks",
      minRung: 4,
      audio: "A sharp metallic creak from the beam.",
    },
  ],
};


export const FLYING: Ladder = {
  id: "flying",
  title: "Flying",
  rooms: [
    {
      id: "window-seat",
      label: "A window seat",
      anchor: "/anchors/window-seat.jpg",
      world:
        "POV from a window seat in a passenger jet at cruising altitude, the wing and engine outside the window, rows of seat backs and overhead bins ahead, the seatbelt sign above",
    },
  ],
  rungs: [
    {
      level: 0,
      label: "Smooth cruise",
      summary: "Calm cabin. The wing steady in sunlight.",
      action: "The cabin brightens and settles, the wing steady in sunlight outside the window.",
      state: "the cabin calm and bright, the wing steady in sunlight",
    },
    {
      level: 1,
      label: "Seatbelt sign",
      summary: "A chime. The sign lights up.",
      action: "The seatbelt sign lights up with a chime.",
      calm: "The seatbelt sign goes dark.",
      audio: "A soft cabin chime over the engine hum.",
      state: "the seatbelt sign lit",
    },
    {
      level: 2,
      label: "Light chop",
      summary: "The cabin starts to shake. The wing flexes.",
      action: "The cabin begins to shake lightly and the wing flexes outside the window.",
      calm: "The shaking stops.",
      audio: "A low rumble and rattling through the cabin.",
      state: "the cabin shaking lightly, the wing flexing outside the window",
    },
    {
      level: 3,
      label: "Into the cloud",
      summary: "Dark cloud swallows the wing. Rain on the glass.",
      action: "The window fills with dark grey cloud and rain streaks across the glass.",
      calm: "The cloud clears from the window.",
      state: "the window filled with dark grey cloud, rain streaking the glass",
    },
    {
      level: 4,
      label: "The drop",
      summary: "The floor falls away. Bins rattle.",
      action: "The cabin lurches downward, overhead bins rattle and bags shift.",
      calm: "The cabin levels out.",
      audio: "Overhead bins rattling and a gasp through the cabin.",
      state: "the cabin lurching, overhead bins rattling",
    },
    {
      level: 5,
      label: "Lightning",
      summary: "A flash in the cloud lights the cabin white.",
      action: "Lightning flashes in the cloud outside the window, lighting the cabin white.",
      audio: "A crack of thunder over the engines.",
      state: "lightning flashing in the cloud outside the window",
    },
    {
      level: 6,
      label: "Lights out",
      summary: "The cabin goes dark. Only the flashes outside.",
      action: "The cabin lights flicker and go out, leaving only the flashes outside the window.",
      calm: "The cabin lights come back on.",
      state: "the cabin dark, lit only by flashes outside the window",
    },
  ],
  safePlace: {
    label: "Safe place",
    action: "The shaking stops, the cloud clears to blue sky and the wing sits steady in sunlight.",
  },
  disruptions: [
    { id: "chime", label: "A chime", minRung: 1, audio: "A cabin chime." },
    { id: "baby", label: "A baby cries", minRung: 1, audio: "A baby crying a few rows back." },
    {
      id: "bin",
      label: "A bin pops open",
      minRung: 2,
      prompt: "An overhead bin pops open and a bag slides out.",
      audio: "A bin latch snapping open and a bag thudding down.",
    },
    {
      id: "engine",
      label: "The engine note changes",
      minRung: 2,
      audio: "The engine pitch dropping suddenly, then whining back up.",
    },
  ],
};

export const HORROR: Ladder = {
  id: "horror",
  title: "The dark",
  rooms: [
    {
      id: "hallway",
      label: "A hallway at night",
      anchor: "/anchors/hallway.jpg",
      world:
        "POV in a dark house hallway at night, a flashlight beam on the floorboards, a door standing ajar at the far end, faded wallpaper and a mirror on the wall",
    },
  ],
  rungs: [
    {
      level: 0,
      label: "Quiet",
      summary: "Still. The flashlight on the far door.",
      action: "The hallway falls still, the flashlight beam steady on the far door.",
      state: "still and quiet, the flashlight steady on the door ajar at the far end",
    },
    {
      level: 1,
      label: "A creak",
      summary: "Something shifts upstairs.",
      action: "The flashlight beam trembles slightly.",
      audio: "A slow creak from the floor above.",
      state: "the flashlight beam trembling, a creak from the floor above",
    },
    {
      level: 2,
      label: "The door moves",
      summary: "The far door swings open onto darkness.",
      action: "The door at the far end swings slowly open, revealing darkness.",
      calm: "The far door drifts shut.",
      audio: "A long slow creak of old hinges.",
      state: "the far door hanging open onto darkness",
    },
    {
      level: 3,
      label: "The flashlight flickers",
      summary: "The beam stutters and dims.",
      action: "The flashlight flickers and dims, the hallway sinking into shadow.",
      calm: "The flashlight steadies and brightens.",
      state: "the flashlight flickering, the hallway in shadow",
    },
    {
      level: 4,
      label: "A shadow",
      summary: "Something moves in the doorway.",
      action: "A shadow moves across the open doorway at the far end.",
      audio: "A floorboard creaking somewhere ahead.",
      state: "a shadow moving in the far doorway",
    },
    {
      level: 5,
      label: "In the mirror",
      summary: "A pale face behind you. Then gone.",
      action: "In the mirror on the wall a pale face appears for a moment, then is gone.",
      audio: "A whisper very close by.",
      state: "a pale face flickering in the mirror on the wall",
    },
    {
      level: 6,
      label: "It steps out",
      summary: "A tall figure stands in the doorway, facing you.",
      action: "A tall figure steps out of the far doorway and stands still, facing down the hallway.",
      calm: "The figure steps back into the darkness of the doorway.",
      audio: "Slow heavy footsteps on old floorboards, then silence.",
      state: "a tall figure standing still in the far doorway",
    },
  ],
  safePlace: {
    label: "Safe place",
    action: "The hallway lights come on warm and bright and the far door is closed.",
  },
  disruptions: [
    { id: "knock", label: "A knock", minRung: 1, audio: "Three slow knocks from somewhere in the house." },
    { id: "whisper", label: "A whisper", minRung: 2, audio: "A whisper close behind, words too soft to make out." },
    { id: "steps", label: "Footsteps above", minRung: 1, audio: "Footsteps crossing the floor above, then stopping." },
    {
      id: "slam",
      label: "A door slams",
      minRung: 2,
      prompt: "The far door slams shut.",
      audio: "A door slamming hard, the echo dying in the house.",
    },
  ],
};

export const REJECTION: Ladder = {
  id: "rejection",
  title: "Asking someone out",
  rooms: [
    {
      id: "cafe",
      label: "A café table",
      anchor: "/anchors/cafe.jpg",
      world:
        "POV across a small café table from a young woman with dark hair in a green sweater, smiling, two coffee cups between us, the café busy behind her",
    },
  ],
  // One person is the whole scene here, so naming her is the point.
  rungs: [
    {
      level: 0,
      label: "Warm",
      summary: "She is smiling, leaning in, listening.",
      action: "She smiles and leans in, listening.",
      state: "smiling and leaning in, listening",
    },
    {
      level: 1,
      label: "A glance away",
      summary: "She checks her phone. The smile comes back smaller.",
      action: "She glances down at her phone, then back up with a smaller smile.",
      calm: "She puts the phone away and smiles again.",
      state: "glancing at her phone, her smile smaller",
    },
    {
      level: 2,
      label: "The smile fades",
      summary: "She looks down at her coffee.",
      action: "Her smile fades and she looks down at her coffee.",
      calm: "She looks up and smiles.",
      state: "her smile gone, looking down at her coffee",
    },
    {
      level: 3,
      label: "Checking the time",
      summary: "A glance at her watch. A small sigh.",
      action: "She checks her watch and lets out a small sigh.",
      state: "checking her watch and sighing",
    },
    {
      level: 4,
      label: "The head shake",
      summary: "Slowly, no. She looks away.",
      action: "She shakes her head slowly and looks away.",
      calm: "She looks back and gives a small nod.",
      state: "shaking her head slowly, looking away",
    },
    {
      level: 5,
      label: "Standing up",
      summary: "A short sentence. She stands and picks up her bag.",
      action: "She says something short, stands up and picks up her bag.",
      calm: "She sits back down.",
      audio: "A chair scraping back on a café floor over the murmur of the room.",
      state: "standing with her bag in hand",
    },
    {
      level: 6,
      label: "Gone",
      summary: "She walks out of frame. The chair is empty.",
      action: "She turns and walks out of frame, leaving the chair across the table empty.",
      calm: "She walks back into frame and sits down.",
      state: "the chair across the table empty, her cup left behind",
    },
  ],
  safePlace: {
    label: "Safe place",
    action: "She sits back down, smiles and picks up her coffee.",
  },
  disruptions: [
    {
      id: "buzz",
      label: "Her phone buzzes",
      minRung: 1,
      prompt: "Her phone buzzes on the table and she glances at it.",
      audio: "A phone buzzing against a wooden table.",
    },
    { id: "laugh", label: "A laugh nearby", minRung: 1, audio: "A burst of laughter from another table." },
    { id: "order", label: "An order is called", minRung: 1, audio: "A barista calling out an order over the espresso machine." },
  ],
};

export const SPIDERS: Ladder = {
  id: "spiders",
  title: "Spiders",
  rooms: [
    {
      id: "desk",
      label: "A desk",
      anchor: "/anchors/desk.jpg",
      world:
        "POV at a wooden desk in a bright room, a large brown house spider sitting on the desk a hand-width from the keyboard, its legs spread",
    },
  ],
  rungs: [
    {
      level: 0,
      label: "Still",
      summary: "It sits there. Not moving.",
      action: "The spider sits motionless on the desk.",
      state: "sitting motionless on the desk",
    },
    {
      level: 1,
      label: "It moves",
      summary: "A few slow steps across the desk.",
      action: "The spider takes a few slow steps across the desk.",
      calm: "The spider stops.",
      state: "walking slowly across the desk",
    },
    {
      level: 2,
      label: "Closer",
      summary: "It walks to the front edge of the desk.",
      action: "The spider walks toward the front edge of the desk, closer.",
      calm: "The spider backs away across the desk.",
      state: "at the front edge of the desk, close",
    },
    {
      level: 3,
      label: "Legs up",
      summary: "The front legs rise.",
      action: "The spider raises its front legs.",
      calm: "The spider lowers its legs.",
      state: "front legs raised",
    },
    {
      level: 4,
      label: "Onto the keyboard",
      summary: "It climbs onto the keys.",
      action: "The spider climbs onto the keyboard.",
      calm: "The spider climbs off the keyboard.",
      state: "standing on the keyboard",
    },
    {
      level: 5,
      label: "Filling the frame",
      summary: "It walks right up to the front. Huge.",
      action: "The spider walks right up to the front of the frame until it fills it.",
      calm: "The spider walks back along the desk.",
      state: "right at the front of the frame, filling it",
    },
    {
      level: 6,
      label: "The jump",
      summary: "It leaps forward.",
      action: "The spider leaps forward off the desk toward the front of the frame.",
      state: "leaping forward off the desk",
    },
  ],
  safePlace: {
    label: "Safe place",
    action: "The spider turns and walks away across the desk to the far wall.",
  },
  disruptions: [
    { id: "twitch", label: "A leg twitches", minRung: 0, prompt: "One of the spider legs twitches.", audio: "Silence." },
    { id: "fly", label: "A fly lands", minRung: 1, prompt: "A fly lands on the desk near the spider.", audio: "A fly buzzing, then landing." },
    { id: "hide", label: "It hides", minRung: 2, prompt: "The spider darts under a sheet of paper on the desk.", audio: "A faint scuttle on wood." },
  ],
};

export const CLAUSTROPHOBIA: Ladder = {
  id: "claustrophobia",
  title: "Small spaces",
  rooms: [
    {
      id: "elevator",
      label: "An old elevator",
      anchor: "/anchors/elevator.jpg",
      world:
        "POV inside a small old elevator, its doors closed, scratched metal walls close on every side, a dim ceiling light, a panel of worn buttons",
    },
  ],
  rungs: [
    {
      level: 0,
      label: "Moving",
      summary: "Humming along. Doors closed.",
      action: "The elevator hums and moves smoothly.",
      audio: "An old elevator humming as it moves.",
      state: "humming, moving smoothly",
    },
    {
      level: 1,
      label: "The jolt",
      summary: "A bang. It stops.",
      action: "The elevator jolts and stops with a bang.",
      calm: "The elevator starts moving again.",
      audio: "A loud bang and the hum cutting out to silence.",
      state: "stopped and silent",
    },
    {
      level: 2,
      label: "Flicker",
      summary: "The ceiling light stutters.",
      action: "The ceiling light flickers.",
      calm: "The light steadies.",
      audio: "A fluorescent light buzzing and ticking.",
      state: "the ceiling light flickering",
    },
    {
      level: 3,
      label: "Dark",
      summary: "Only a red emergency glow.",
      action: "The light goes out, leaving only a dim red emergency glow.",
      calm: "The light comes back on.",
      state: "dark except for a dim red emergency glow",
    },
    {
      level: 4,
      label: "The walls",
      summary: "They creep inward.",
      action: "The metal walls creep inward, the space shrinking.",
      calm: "The walls ease back.",
      audio: "Metal groaning under strain.",
      state: "the walls closer, the space smaller",
    },
    {
      level: 5,
      label: "Dust and heat",
      summary: "Dust falls. The walls sweat.",
      action: "Dust drifts down from the ceiling and the walls sweat with heat.",
      state: "dust falling from the ceiling, the walls sweating",
    },
    {
      level: 6,
      label: "The cables",
      summary: "It drops and swings.",
      action: "The elevator drops a few feet and swings, the cables screaming.",
      calm: "The elevator steadies.",
      audio: "Cables screaming and the car banging against the shaft.",
      state: "swinging, the cables straining",
    },
  ],
  safePlace: {
    label: "Safe place",
    action: "The light comes on bright, the elevator hums and the doors slide open onto a wide bright lobby.",
  },
  disruptions: [
    { id: "creak", label: "A creak", minRung: 1, audio: "A long metallic creak from above." },
    { id: "bell", label: "The alarm bell", minRung: 1, audio: "An old alarm bell ringing, then stopping." },
    { id: "intercom", label: "The intercom", minRung: 1, audio: "A crackling intercom voice, too distorted to understand." },
    { id: "buttons", label: "The buttons flicker", minRung: 2, prompt: "The button panel flickers and goes dark.", audio: "An electrical click." },
  ],
};

export const LADDERS: Ladder[] = [PUBLIC_SPEAKING, HEIGHTS, FLYING, HORROR, REJECTION, SPIDERS, CLAUSTROPHOBIA];

/** The opening prompt: the world once, what the audience is doing, the camera. */
export function openingPrompt(room: Room, rung: Rung) {
  return `${room.world}, ${rung.state}. ${CAMERA}`;
}
