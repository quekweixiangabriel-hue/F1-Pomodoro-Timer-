# RACEFOCUS

A premium F1-inspired focus timer with a real-time 3D garage and cockpit experience.

## Run

```bash
npm install
npm start
```

Open `http://localhost:3000`.

## Deploy

Use a Node web service such as Render.

- Build: `npm install`
- Start: `npm start`

The server serves the app, provides a WebSocket endpoint for multiplayer rooms, and proxies OpenF1 requests under `/api/f1/*`.

## Notes

The 3D scene is generated with Three.js geometry and PBR-style materials in the browser. It does not depend on generated images or copyrighted car/driver renders. Team colors, lighting and cockpit accents change with the selected team.
