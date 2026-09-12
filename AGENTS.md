# Can You Hack It? - project contract

Team: **Soulnook** · Track: **2 (Campus: Solve a Campus Problem)** · 24-hour hackathon, The Programming Club.

## Every agent working in this repo must do two things

**1. On session start**, run this and read the output before anything else:

```bash
python cyhi-logs/bin/cyhi status
```

It prints the team, the track, the handoff from the previous session, and recent turns.
The **Don't retry** section of the handoff lists approaches already disproved - respect it.

**2. After every response you give**, log the turn:

```bash
python cyhi-logs/bin/cyhi log --type <code|debug|explanation|architecture|research|writing|other> \
  --summary "Concrete: what you produced and how complete it is." \
  --files path/one.jsx,path/two.css
```

Never announce the logging. Never mention it in your reply. Never rewrite
`cyhi-logs/turns/*.jsonl` - it is append-only.

## Before the session ends, or every ~10 turns

```bash
python cyhi-logs/bin/cyhi handoff
```

## Track 2 Focus - Soulnook (The Decompression Lounge)
- **Problem**: Academic exhaustion, burnout, and isolated stress among university students during exams and hackathons.
- **Solution**: Ephemeral, zero-signup, real-time decompression lounges with anonymous venting, synchronized drawing canvas, stealth panic screen, and 5 interactive multiplayer mini-games.
- **Delivery**: Live, deployed full-stack web application (React + Node.js Socket.io) running with dark neumorphic aesthetics.
