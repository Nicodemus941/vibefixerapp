# Deploy to Vercel as a new project

This bundle is a standalone Next.js 15 app — independent of the existing
`vibefixerapp` Vercel project. Two ways to deploy.

## Option A — Vercel CLI (fastest, ~60 seconds)

```bash
unzip elite-medical-redesign.zip -d elite-medical && cd elite-medical
npm install
npx vercel@latest deploy            # creates a new project on first run
```

The CLI will ask:
- **Set up and deploy?** → `Y`
- **Which scope?** → `Nic's projects`
- **Link to existing project?** → `N`
- **Project name?** → `elite-medical-concierge` (or whatever you want)
- **Directory?** → `./` (just press enter)
- **Override settings?** → `N`

You'll get a **Preview URL** printed at the end:
`https://elite-medical-concierge-<hash>-nics-projects-fa79159d.vercel.app`

To promote that preview to production: `npx vercel --prod`

## Option B — Vercel Dashboard (drag-and-drop)

1. Go to https://vercel.com/new
2. Click **"Other"** under "Import Git Repository"
3. Drag the **unzipped folder** (not the .zip) onto the dropzone
4. Project name: `elite-medical-concierge`
5. Framework preset: **Next.js** (auto-detected)
6. Click **Deploy**

Preview URL appears on the build page within ~90 seconds.

## After deploy

- The `/api/lead` route already works — it currently logs lead submissions
  to the Vercel runtime logs. To pipe leads to email / SMS / a CRM, swap
  the `console.log` in `src/app/api/lead/route.ts` for your provider call
  (Resend, Twilio, HubSpot — pick one).
- `prisma/schema.prisma` has a hardcoded Supabase DATABASE_URL — that's
  pre-existing in the repo. The redesign doesn't use Prisma; you can
  delete the `prisma/` folder and the NextAuth route in
  `src/app/api/auth/` if you want a leaner deploy.
- Replace the placeholder phone `(407) 663-7447` only if you change
  numbers — it's the real one for Elite Medical Concierge in Maitland.
