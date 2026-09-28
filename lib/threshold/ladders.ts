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
  // Tested live: anything about where the audience is LOOKING ("turns
  // forward", "stares", "glares") makes the model invent a speaker at the
  // lectern, and anything about the stage or its lights swings the camera
  // round to face the stage. Every rung here is a crowd doing something
  // physical, with no target named.
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
      summary: "Every phone goes down at once. Silence.",
      action: "The whole audience puts their phones down at the same moment and goes silent and still.",
      state: "sitting silent and still, phones down",
    },
    {
      level: 2,
      label: "They whisper",
      summary: "Heads lean together. Whispering behind hands. Heads shake.",
      action:
        "People all over the audience lean to their neighbours, whispering behind their hands and shaking their heads.",
      calm: "The whispering stops.",
      state: "leaning together, whispering behind their hands and shaking their heads",
    },
    {
      level: 3,
      label: "Being filmed",
      summary: "Phones come up. The room is recording you.",
      action: "The audience raises their phones and films, faces lit by the screens.",
      calm: "The phones go down.",
      state: "holding up phones, filming",
    },
    {
      level: 4,
      label: "They laugh",
      summary: "Laughter spreads. Heads shake.",
      action: "The audience bursts out laughing, shaking their heads.",
      calm: "The laughter stops.",
      audio: "Loud mocking laughter spreading across a large hall.",
      state: "laughing and shaking their heads",
    },
    {
      level: 5,
      label: "They boo",
      summary: "Booing. Arms waving. Fists in the air.",
      action: "The audience boos, waving their arms and shaking their fists.",
      calm: "The booing dies down and the arms come down.",
      audio: "A large crowd booing and jeering in a hall.",
      state: "booing, waving their arms and shaking their fists",
    },
    {
      level: 6,
      label: "They walk out",
      summary: "People stand up and leave.",
      action: "Several people in the back rows stand up, gather their coats and climb the steps out of the hall.",
      calm: "The people who stood up sit back down.",
      audio: "Seats flipping up and footsteps on hard steps.",
      state: "several people in the back rows climbing the steps out of the hall",
    },
    {
      level: 7,
      label: "The heckler",
      summary: "A man stands up and shouts at you.",
      action: "A man in the middle rows stands up, points forward and shouts.",
      calm: "The man sits back down.",
      audio: "A man's angry voice shouting in a silent hall.",
      state: "a man in the middle rows standing, pointing forward and shouting",
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
  // Tested live: the beam is the one change that always shows. Weather,
  // bending steel and crumbling concrete never rendered, and after five or
  // six prompts the view wanders, so the ladder stays short and the biggest
  // move comes early.
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
      label: "Out on the beam",
      summary: "Forward along the beam, the drop on both sides.",
      action: "The view moves forward out along the narrow beam, the drop on both sides.",
      calm: "The view moves back along the beam onto the roof.",
      state: "out on the narrow beam over the drop, the street far below on both sides",
    },
    {
      level: 3,
      label: "Straight down",
      summary: "Only the street, hundreds of feet below the beam.",
      action: "The view tilts straight down past the beam until only the street far below, with its tiny cars, fills the frame.",
      calm: "The view tilts back up along the beam to the skyline.",
      state: "out on the beam, tilted straight down, only the street far below filling the frame",
    },
    {
      level: 4,
      label: "The wind",
      summary: "A hard gust hits the beam. Grit skitters off it and falls.",
      action: "A hard gust hits the beam and loose grit skitters off it and falls away into the drop.",
      calm: "The wind dies down.",
      audio: "A hard gust of wind on a high rooftop, grit scattering.",
      state: "out on the beam in hard wind, grit blowing off it into the drop",
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
  // Tested live: things that happen to the whole cabin show (bags spilling,
  // masks dropping, lights going out, a flash through the window). A sign
  // lighting up or the wing flexing does not.
  // Tested live: things that happen to the whole cabin show (bags spilling,
  // masks dropping, lights going out, a flash through the window). A sign
  // lighting up, the wing flexing or cloud outside the window does not.
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
      label: "Light chop",
      summary: "A chime. The cabin starts to shake.",
      action: "The seatbelt sign lights up and the cabin begins to shake, the wing flexing outside the window.",
      calm: "The shaking stops.",
      audio: "A soft cabin chime, then a low rumble and rattling through the cabin.",
      state: "the seatbelt sign lit, the cabin shaking lightly",
    },
    {
      level: 2,
      label: "The drop",
      summary: "The floor falls away. Bags spill out of the bins.",
      action: "The cabin lurches downward and bags spill out of the overhead bins onto the floor.",
      calm: "The cabin levels out.",
      audio: "Overhead bins banging open and a gasp through the cabin.",
      state: "the cabin lurching, bags spilled out of the overhead bins",
    },
    {
      level: 3,
      label: "Lightning",
      summary: "A white flash outside. The whole cabin shakes.",
      action: "Lightning flashes white outside the window and the whole cabin shakes.",
      audio: "A crack of thunder over the engines.",
      state: "lightning flashing white outside the window, the cabin shaking",
    },
    {
      level: 4,
      label: "The masks",
      summary: "Yellow oxygen masks drop over every seat.",
      action: "Yellow oxygen masks drop from the ceiling and dangle over every seat.",
      calm: "The oxygen masks retract into the ceiling.",
      audio: "A bang, then a hiss and a chime through the cabin.",
      state: "yellow oxygen masks dangling from the ceiling over every seat",
    },
    {
      level: 5,
      label: "Lights out",
      summary: "The cabin goes dark. Only the flashes outside.",
      action: "The cabin lights flicker and go out, leaving the cabin dark except for the window.",
      calm: "The cabin lights come back on.",
      state: "the cabin dark, lit only by flashes outside the window",
    },
  ],
  safePlace: {
    label: "Safe place",
    action: "The shaking stops, the cabin lights come on bright, the cloud clears and the wing sits steady in sunlight.",
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
  // Every rung is a change you can see from across the room: the light,
  // the door, the colour of the hall, then something in the doorway.
  // Tested live: small things (a trembling beam, a shadow, fog) never show.
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
      label: "Lights out",
      summary: "The light dies. Only a thin flashlight beam is left.",
      action:
        "The ceiling light goes out and the hallway goes black, only a thin flashlight beam left on the floor.",
      calm: "The ceiling light comes back on.",
      state: "black except for a thin flashlight beam on the floor",
    },
    {
      level: 2,
      label: "Red light",
      summary: "Red light floods out of the far doorway and fills the hall.",
      action: "Red light floods out of the far doorway and fills the whole hallway.",
      calm: "The red light fades.",
      state: "lit red by a glow from the far end",
    },
    {
      level: 3,
      label: "The door opens",
      summary: "The far door swings wide open. Red light pours out.",
      action: "The far door swings wide open and red light pours out of it.",
      calm: "The far door drifts shut.",
      audio: "A long slow creak of old hinges.",
      state: "lit red, the far door standing wide open with red light pouring out",
    },
    {
      level: 4,
      label: "A face",
      summary: "A dead white face leans out of the doorway and stares at you.",
      action:
        "A dead white face with long black hair leans out of the far doorway and stares down the hallway.",
      calm: "The face pulls back into the doorway.",
      audio: "A whisper very close by.",
      state: "a dead white face with long black hair leaning out of the far doorway, staring",
    },
    {
      level: 5,
      label: "It steps out",
      summary: "A tall figure in a torn black robe stands in the doorway, facing you.",
      action:
        "A tall gaunt figure in a torn black robe steps out of the far doorway, long black hair over a dead white face, and stands still facing down the hallway.",
      calm: "The figure steps back through the far door and it closes behind it.",
      audio: "Slow heavy footsteps on old floorboards, then silence.",
      state: "a tall gaunt figure in a torn black robe standing still in the far doorway, long black hair over a dead white face",
    },
    {
      level: 6,
      label: "It comes closer",
      summary: "It walks toward you, slowly, head tilted, and stops close.",
      action:
        "The figure walks slowly down the hallway toward the front of the frame, head tilted, hair over its face.",
      calm: "The figure turns, walks back down the hallway and out through the far door.",
      audio: "Slow footsteps on old floorboards, coming closer.",
      state: "the tall figure in the torn black robe standing close, filling the frame, head tilted, hair over its dead white face",
    },
  ],
  safePlace: {
    label: "Safe place",
    action:
      "The ceiling lights come on warm and bright down the whole hallway and the far door is closed.",
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
      label: "Arms crossed",
      summary: "A frown. Arms crossed. She leans back in her chair.",
      action: "She frowns, crosses her arms and leans back in her chair.",
      calm: "She uncrosses her arms and leans in again.",
      state: "frowning, arms crossed, leaning back in her chair",
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
  // Tested live: the spider climbing, a second spider arriving and the
  // spider coming at the frame all show. "Closer" pulled the camera back
  // instead, and a swarm of small spiders never rendered.
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
      label: "Onto the keyboard",
      summary: "It climbs onto the keys.",
      action: "The spider climbs onto the keyboard.",
      calm: "The spider climbs off the keyboard.",
      state: "standing on the keyboard",
    },
    {
      level: 3,
      label: "Another one",
      summary: "A second spider crawls up over the edge of the desk.",
      action: "A second big spider crawls up over the far edge of the desk.",
      calm: "The second spider crawls back over the far edge of the desk and is gone.",
      state: "a second big spider on the desk beside the first",
    },
    {
      level: 4,
      label: "Fangs",
      summary: "It rears up on its back legs, fangs bared.",
      action: "The spider rears up on its back legs with its fangs bared.",
      calm: "The spider lowers itself back down.",
      state: "reared up on its back legs, fangs bared",
    },
    {
      level: 5,
      label: "Filling the frame",
      summary: "It walks right up to the front. Huge.",
      action: "The biggest spider walks straight at the front of the frame until it fills it.",
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
  // Tested live: the red glow, smoke and water all fill the frame and show
  // at once. "It drops and swings" made the model open the car out into a
  // corridor, the opposite of small, so the drop is gone.
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
      summary: "The ceiling light stutters and dims.",
      action: "The ceiling light flickers and dims.",
      calm: "The light steadies.",
      audio: "A fluorescent light buzzing and ticking.",
      state: "the ceiling light flickering and dim",
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
      summary: "They creep inward. Metal groans.",
      action: "The metal walls creep inward, the space shrinking.",
      calm: "The walls ease back.",
      audio: "Metal groaning under strain.",
      state: "the walls closer, the space smaller, lit red",
    },
    {
      level: 5,
      label: "Smoke",
      summary: "Smoke pours in from the ceiling vent and fills the car.",
      action: "Thick grey smoke pours in through the ceiling vent and fills the elevator.",
      calm: "The smoke clears out through the vent.",
      audio: "A hiss from the ceiling vent and a fire alarm far above.",
      state: "filling with thick grey smoke from the ceiling vent, lit red",
    },
    {
      level: 6,
      label: "Water",
      summary: "Water pours in through the ceiling and rises.",
      action: "Water pours in through the ceiling and rises fast across the floor.",
      calm: "The water drains away through the floor.",
      audio: "Water gushing and splashing in a metal box.",
      state: "water pouring in through the ceiling and rising across the floor",
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
