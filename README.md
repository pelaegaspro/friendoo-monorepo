# Friendoo Monorepo

India-first anonymous audio-call social app. All projects share the Firebase project `friendoo-v1`.

## Structure

```
friendoo-monorepo/
├── src/                  Web app source (Vite + React 18)
├── components/           Shared UI components
├── hooks/                React hooks
├── services/             Service layer (auth, calls, discover, wallet)
├── store/                Zustand stores
├── public/               Static assets
├── app/                  Host dashboard (Next.js)
│
├── admin/                Admin panel (Next.js 14)
├── crm/                  CRM dashboard (Next.js 14)
├── Friendoo/             Android app (Kotlin + Jetpack + Hilt)
├── functions/            Firebase Cloud Functions (Node.js 20)
├── cashfree-mcp/         Cashfree payment MCP server
│
├── docs/                 All documentation
├── scripts/              Utility and migration scripts
├── test/                 Firestore rules tests (Jest)
├── infra/                Infrastructure docs
├── deploy/               Deployment configs
├── assets/               Static image assets
│
├── firebase.json         Firebase project config
├── firestore.rules       Firestore security rules
├── .firebaserc           Firebase project alias
│
├── package.json          Web app dependencies (Vite)
├── vite.config.ts        Vite config
├── tailwind.config.ts    Tailwind config
├── tsconfig.json         TypeScript config
├── index.html            Vite entry point
└── README.md
```

## Stacks

| App | Stack | Path |
|---|---|---|
| **Web App** | Vite + React 18 + Firebase + Agora RTC | `/` (root) |
| **Host Dashboard** | Next.js 14 + Tailwind | `/app` |
| **Admin Panel** | Next.js 14 + Firebase Admin | `/admin` |
| **CRM** | Next.js 14 + Zustand | `/crm` |
| **Android** | Kotlin + Jetpack Compose + Hilt | `/Friendoo` |
| **Functions** | Node.js 20 + TypeScript | `/functions` |
| **Cashfree MCP** | TypeScript + MCP SDK | `/cashfree-mcp` |

## Quick Start

```bash
# Web app
npm install && npm run dev

# Admin panel
cd admin && npm install && npm run dev

# CRM
cd crm && npm install && npm run dev

# Android
# Open Friendoo/ in Android Studio

# Firebase Functions
cd functions && npm install && npm run build

# Deploy
firebase deploy
```

## Firebase

- **Project:** `friendoo-v1`
- **Auth:** Phone (OTP) for users, password for admin/CRM
- **Firestore:** Users, hosts, calls, coin packages, transactions
- **Functions:** Call billing (Agora), payments (Cashfree), fraud detection
- **Hosting:** Landing page (`docs/`), admin (`admin/.next`), web app (`dist/`)

## Documentation

- [Firestore Schema](docs/FIRESTORE_SCHEMA.wallet_calls.md)
- [Security Spec](docs/security_spec.md)
- [Testing Guide](docs/TESTING.md)
- [Avatar PRD](docs/avatar-prd-and-spec.md)
- [Onboarding Flow](docs/onboarding-flow.md)

## Scripts

```bash
# Seed Firestore coin packs
node scripts/seed-coinpacks.cjs

# Backfill avatarSeed migration
cd functions && npx ts-node src/migrations/backfill-avatar-seed.ts
```
