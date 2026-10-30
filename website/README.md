# Friendoo Official Website (`friendoo.in`)

This directory contains the production source code for Friendoo's public marketing website hosted at **[https://friendoo.in](https://friendoo.in)**.

---

## 📁 Structure

- `index.html` — Standalone, high-performance responsive landing page with:
  - Space Grotesk typography & Friendoo neon brand theme
  - Interactive 3D call-story canvas animation
  - 8-language switcher (`English`, `हिंदी`, `தமிழ்`, `తెలుగు`, `ಕನ್ನಡ`, `മലയാളം`, `বাংলা`, `اردو`)
  - Live animated hero headline cycles
  - Host program tiers and real earnings calculator
  - Host application form with instant Supabase lead submission
  - Official Safety, Privacy Policy, Terms of Service, Refund Policy, and Grievance Officer notices
- `call-story-3d.js` — Three.js interactive canvas particle & avatar 3D visual experience
- `server.js` — Lightweight zero-dependency HTTP server with static file serving and Cashfree UPI payment checkout redirect support (`/checkout`)
- `package.json` — Local developer run scripts

---

## 🚀 Running Locally

```bash
cd website
npm start
```

Open `http://localhost:8080` in your browser.

---

## 🌐 Production Architecture & Deployment

The live site at `friendoo.in` is backed by:
1. **Cloudflare CDN / DNS**: Handles SSL, caching, and custom domain routing.
2. **Supabase Edge Function (`supabase/functions/website/index.ts`)**: Serves the website HTML and `/checkout` redirect handlers directly on Supabase's edge network.
3. **Static Hosting**: Because `website/` is fully static, it can also be deployed to Cloudflare Pages, Vercel, Netlify, or any standard web server without modification.

