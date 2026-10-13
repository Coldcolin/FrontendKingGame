# DiffArena — frontend

Web app for DiffArena, a 1v1 frontend duel. Two contenders rebuild the same 600 × 400 target in HTML with Tailwind or plain CSS (a `<style>` block), and a pixel diff scores every render.

Next.js (App Router, Tailwind v4): setup, lobby, arena, spectator and results screens. It talks to the DiffArena backend (separate repo) over HTTP and Socket.IO.

## Run it

Start the backend first (http://localhost:4000), then:

```bash
npm install
cp .env.example .env.local
npm run dev     # http://localhost:3000
```

Open http://localhost:3000 and choose **Set up a match**.

`npm run dev` and `npm run build` first copy the Tailwind browser runtime and html-to-image into `public/sandbox/` so the sandboxed preview frame can load them without a CDN.

## Deploy (Vercel)

1. Deploy the backend to Render first and copy its URL.
2. Import this repo into Vercel. It's detected as Next.js, and the repo root is the app.
3. Add `NEXT_PUBLIC_API_URL=https://<your-service>.onrender.com`. The value is baked in at build time, so redeploy after changing it.
4. Put the Vercel URL in the backend's `WEB_ORIGIN` on Render.
