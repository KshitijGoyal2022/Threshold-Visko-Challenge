# Threshold

Threshold turns the thing you're scared of into a live scene. Visko Orbis generates it in real time, and your therapist steers it while you watch. It gets harder as you settle and easier the second you need it.

Built for the Visko Orbis Online Challenge.

**Try it:** <https://threshold-visko-challenge.vercel.app/>

Pick a fear, create a session, and open the two links on two screens (or two tabs). Live sessions run on our Orbis credits while they last, so if the patient screen says live sessions are switched off, add `&live=0` to the link to walk through the app on saved frames instead.

## Why we built it

About 301 million people have an anxiety disorder, and only one in four of them get any treatment. The treatment that works best for phobias is exposure therapy. Around 80 to 90% of people get better with it, and yet only 10 to 30% of therapists actually use it.

That's not because they don't know it works. It's because it's a pain to do. You can't book a lecture hall every week, and you can't tell a real crowd to back off when your patient starts panicking. VR was supposed to fix this, but the headsets are expensive and the scenes come from a fixed library. You pick a clip from a menu. You can't turn a dial.

Orbis is the missing piece. It's a video model that keeps running instead of rendering a clip, so the scene can change while the patient is looking at it.

## What it does

A therapist creates a session and gets two links.

The patient opens one and sees their fear as a live scene: a dark auditorium from the lectern, the edge of a roof with no railing, a tarantula on their desk, a woman across a cafe table. They rate how anxious they feel on a 0 to 100 slider, which is the scale therapists already use.

The therapist opens the other link and sees and hears exactly what the patient sees. From there they run the room. They can jump to any step of the fear ladder with one click, type something that isn't in the presets, throw in an interruption like a phone ringing, or restart the scene from its anchor frame if the camera has wandered. Both screens have a Safe place button that backs the room off in one step.

There's also an automatic mode that follows the rule therapists use: hold a step until anxiety drops to half of its peak, then go harder. If it goes over 85, ease off. It's off by default, so the therapist is always in charge.

When the session ends, both sides get a report: peak anxiety, where it ended, how far it dropped, the highest step reached, and how long they spent on each one.

Seven fears are in right now, and every step of every one was checked on a live stream.

| Fear | Scene |
| --- | --- |
| Public speaking | An auditorium seen from the lectern |
| Heights | The open edge of a skyscraper roof, a beam out over the drop |
| Flying | A window seat at cruising altitude |
| The dark | A house hallway at night, a door ajar at the far end |
| Asking someone out | Across a cafe table |
| Spiders | A tarantula on your desk |
| Small spaces | An old elevator |

## How to run it

You need Node.js 20.9 or newer and a Reactor API key with access to Visko Orbis Stable.

```bash
git clone <this repo>
cd orbis-online-hackathon-starter
npm install
cp .env.example .env.local
```

Put your key in `.env.local`:

```dotenv
REACTOR_API_KEY=your_reactor_api_key
```

Then start it and open <http://localhost:3000>:

```bash
npm run dev
```

The key never leaves the server. The browser only gets a short lived Reactor token, and each token allows one session of up to 15 minutes. `npm run dev` also cleans up any dev session left over from a previous run, so a restart can't quietly keep burning credits.

To run a session:

1. Pick a fear on the home page and click **Create a session**. You get a four letter code and two links.
2. Open the **Patient** link on the screen the patient will watch and click **Begin session**. Orbis takes about ten seconds to start.
3. Open the **Clinician** link on the other screen. It connects to the same code and shows the patient's stream next to the console.
4. The patient moves the slider as they feel. The therapist clicks steps, types directions, or turns on **Adapt automatically**.
5. **End session** shows the report on both screens.

If you just want one screen with the console beside the scene, go to `http://localhost:3000/session?fear=horror` (any ladder id from `lib/threshold/ladders.ts` works). Add `&live=0` to run the whole UI on saved frames without spending any credits.

## Putting it online

It deploys to Vercel as a normal Next.js app. Import the repo, add `REACTOR_API_KEY`, deploy.

Two screen sessions need one more thing there. Locally the rooms live in memory, which is fine for one server. On Vercel there can be several, so add the **Upstash for Redis** integration from the Vercel marketplace. It sets `KV_REST_API_URL` and `KV_REST_API_TOKEN`, and the app switches to shared rooms on its own. Without it the one screen mode still works.

Every visitor who starts a session spends your Reactor credits, so there's a kill switch. Set `THRESHOLD_LIVE=off` in the Vercel environment and the app stops minting Orbis sessions right away. Everything else keeps working, including the saved frame mode.

## How it's built

There are four parts.

**The world.** Each fear is one sentence that already has the scary thing in it, plus a camera line. We let Orbis generate it once, grab the first clean frame, and use that frame as the anchor for every session after. That's what keeps the scene consistent and lets us restart it.

**The ladder.** Each step is one action, about a dozen words, and it can only mention things that are already on screen. Moving to a step is a single `set_prompt`. Going back down starts with how the current step ends ("The laughter stops."). Sound is only prompted for steps that are a sound.

**The engine.** A small state machine in TypeScript that watches the patient's ratings and applies the habituation rule. The therapist can override it at any time.

**The two screens.** Next.js and React. The patient page streams Orbis over WebRTC through Reactor's SDK and posts its state every second. The server holds a four letter room code and a numbered list of commands, so a click can't get lost even if the console reloads. The console polls that, sends commands, and gets a browser to browser WebRTC relay of the patient's stream. Orbis only streams once, so a shared session costs the same as a solo one.

```
app/
  page.tsx                 home page: pick a fear, create a session
  session/                 one screen mode
  patient/                 patient screen
  therapist/               therapist console
  api/token/               mints the Reactor token
  api/room/[code]/         room state, commands, relay signalling
components/threshold/      session view, console, report, chart
hooks/
  use-orbis-session.ts     Reactor SDK: connect, start, prompts
  use-threshold-session.ts the session itself: ladder, engine, log
  use-room-sync.ts         patient side of a shared session
lib/threshold/
  ladders.ts               the seven fears, step by step, with notes on what worked
  director.ts              turns a jump into the one prompt Orbis needs
  engine.ts                the habituation rule
  protocol.ts, rtc.ts      shared session messages and the relay
lib/server/room-store.ts   in memory rooms
public/anchors/            the first frame of every scene, plus a saved frame per step
```

## What broke, and what we learned from it

Basically everything we know about Orbis came from something breaking on a real stream. It takes prompts very literally.

Saying "the camera" made it move the camera. Saying "the speaker" made it put a speaker on stage and rebuild the whole scene. Even saying where the audience was looking made it invent someone at the lectern for them to look at. Naming one person made the camera zoom in on them and never zoom back out. Repeating the scene description "just to be safe" caused a full rebuild.

The fix was never a longer prompt. It was a shorter one. One action, things already in frame, the crowd instead of a person, and the world described exactly once.

Then we walked every fear step by step and kept only what actually showed up. Lighting and colour always do. So does anything that fills the frame: smoke, water, oxygen masks, a crowd laughing. Small things like a trembling flashlight beam, fog or a shadow never made it onto the screen in time. A horror figure needs a real description too. "A tall figure" turned out to be a man in a coat.

After five or six prompts the view starts to wander, so the console has a Pull back button and a Restart scene button for that.

Real time video isn't just faster rendering. It's a different kind of interaction, and we had to design around what the model does reliably instead of what we wanted it to do. Once we did, the same recipe worked for seven very different fears.

## What's next

A pilot with a university counselling service. Letting a therapist write a new fear from a sentence. Heart rate input so the room can react without a slider. And a history across sessions, so you can see progress over weeks instead of one sitting.

## Built with

Visko Orbis through Reactor, Next.js, React, TypeScript, WebRTC. Started from the Reactor Orbis hackathon starter.
