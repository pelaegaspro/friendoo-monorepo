# Friendoo Monorepo

Friendoo is a native Android Kotlin app with React/Vite user-facing web code,
Next.js admin/CRM apps, and Firebase Cloud Functions. It is not a Flutter
project.

| Folder        | Stack                    | Deployment          |
|---------------|--------------------------|---------------------|
| `Friendoo/`   | Native Android (Kotlin)  | APK / Play Store    |
| `admin/`      | Next.js + Tailwind       | Vercel              |
| `crm/`        | Next.js + Tailwind       | Vercel              |
| `docs/`       | Static HTML              | Vercel / GitHub Pages |
| `functions/`  | Firebase Cloud Functions | Firebase            |
| `src/`        | Vite + React + Tailwind  | -                   |
| `scripts/`    | Node.js utilities        | Run locally         |

**Shared Firebase project:** `friendoo-v1`

## Scripts

```bash
# Seed Firestore coin packs (run from repo root after npm install in functions/)
node scripts/seed-coinpacks.cjs
```
