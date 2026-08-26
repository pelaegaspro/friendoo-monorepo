# Friendoo CRM

Dedicated customer intelligence and operations console for Friendoo, built as a separate Next.js 14 app and connected to Friendoo's operational Supabase project.

## Stack

- Next.js 14 App Router + TypeScript
- Supabase server client with service-role access for protected operational actions
- Recharts (dashboard analytics)
- Tailwind CSS + local UI primitives
- Zustand (page state)
- date-fns, Papa Parse

## Features Implemented

- Password-protected CRM auth with secure session cookie
- `/crm` live dashboard with KPIs + charts + fraud alert feed
- `/crm/users` segmentation table, custom segment builder, journey sheet, offer + message actions
- `/crm/hosts` leaderboard, host table, pending applications, availability heatmap
- `/crm/revenue` KPI deck, package/city/daily charts, top spenders, alerts
- `/crm/support` ticket list, ticket detail thread, reply + refund flow
- `/crm/campaigns` campaign wizard, launch flow, campaign analytics table
- `/crm/fraud` live alert feed with dismiss/warn/refund/ban/escalate actions + threshold config
- `/crm/funnel` conversion funnel, cohort heatmap, drop-off analysis
- `/crm/settings` CRM config editor (`crmConfig/revenue`, `crmConfig/segments`)

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill values:

```bash
ADMIN_PASSWORD=friendoo_crm_2025
SUPABASE_URL=https://<operational-project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<server-only-key>
NEXT_PUBLIC_APP_URL=https://crm.friendoo.in
CRM_SESSION_SECRET=<long-random-secret>
```

Notes:
- `SUPABASE_SERVICE_ROLE_KEY` must remain server-side and must never be exposed
  to browser code.

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), then login at `/login`.

## Production Build Check

```bash
npm run build
```

The project was validated with a successful production build.

## API Surface (`/app/api/crm/*`)

- Auth: `auth/login`, `auth/logout`
- Dashboard: `stats/live`
- Users: `users/list`, `users/journey/[uid]`, `users/addCoins`, `users/ban`, `users/message`, `users/sendOffer`
- Hosts: `hosts/list`, `hosts/approve`
- Campaigns: `campaigns/create`, `campaigns/list`, `campaigns/send`
- Support: `support/tickets`, `support/tickets/[ticketId]`, `support/tickets/update`, `support/reply`, `support/refund`
- Fraud: `fraud/alerts`, `fraud/action`
- Revenue: `revenue/stats`
- Config docs: `config/[docId]`

## Database

CRM reads and writes the operational Supabase PostgreSQL database through the
server-only Supabase client and protected admin RPCs.

## Deploy to Vercel

1. Install and login:
```bash
npm i -g vercel
vercel login
```
2. From `D:\Friendoo\crm` run:
```bash
vercel
```
3. For production deploy:
```bash
vercel --prod
```
4. Set environment variables in Vercel Project Settings:
- `ADMIN_PASSWORD`
- `NEXT_PUBLIC_APP_URL=https://crm.friendoo.in`
- `CRM_SESSION_SECRET`

## Connect Domain (`crm.friendoo.in`)

Use Vercel CLI (from project root):

```bash
vercel domains add crm.friendoo.in <project-name>
```

Then update DNS records at your domain provider to the Vercel target shown by CLI.
Vercel auto-provisions SSL after DNS propagation.

## Important Operational Rules

- Keep all coin balance mutations in server-side Supabase RPCs/transactions only.
- Keep service-role reads server-side only; do not expose admin credentials to client code.
- Main app minimum-call-coins checks belong in Supabase RPC/Edge Function server flow.
