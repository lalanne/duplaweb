# Dupla Consulting — Web

Website for **Dupla Consulting**. Currently serves a "Sitio en construcción" (under construction) page, with the goal of growing into a platform where clients log in and take employability tests.

Built with [Next.js](https://nextjs.org) (App Router, TypeScript, Tailwind CSS).

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view it. Edit the homepage at `src/app/page.tsx` — it auto-reloads on save.

```bash
npm run build   # production build
npm run lint    # lint
```

## Infrastructure

Three separate providers, each with a distinct role. **Keep them straight** — mixing them up is what once broke the site.

| Component | Provider | Notes |
|---|---|---|
| **Website** | **Vercel** | Auto-deploys from the `main` branch of this repo. |
| **Email** (`@duplaconsulting.cl`) | **Microsoft 365** | Mailboxes live here. |
| **DNS hosting** | **DaleHosting** (cPanel) | Holds the DNS zone for `duplaconsulting.cl`. Nameservers: `dns1/dns2.dalehosting.cl`. |

> DaleHosting's cPanel **web hosting is unused** — only its DNS is used. The domain (`duplaconsulting.cl`) is registered at **NIC Chile**, with nameservers delegated to DaleHosting.

### DNS records (managed in DaleHosting cPanel → Zone Editor)

**Website → Vercel:**

| Type | Name | Value |
|---|---|---|
| `A` | `@` | `216.198.79.1` |
| `CNAME` | `www` | `db47e443952b377d.vercel-dns-017.com` |

**Email → Microsoft 365 — ⚠️ DO NOT MODIFY OR DELETE:**

| Type | Name | Value |
|---|---|---|
| `MX` | `@` | `duplaconsulting-cl.mail.protection.outlook.com` (priority 0) |
| `TXT` | `@` | `v=spf1 include:spf.protection.outlook.com -all` (SPF) |
| `TXT` | `@` | `MS=ms21387971` (domain verification) |
| `CNAME` | `autodiscover` | `autodiscover.outlook.com` |
| `CNAME` | `selector1._domainkey` | `selector1-duplaconsulting-cl._domainkey.DuplaConsulting2026.r-v1.dkim.mail.microsoft` (DKIM) |
| `CNAME` | `selector2._domainkey` | `selector2-duplaconsulting-cl._domainkey.DuplaConsulting2026.r-v1.dkim.mail.microsoft` (DKIM) |

### Deploying

Push to `main` → Vercel builds and deploys automatically. No manual steps.

### Notes / gotchas

- **Editing DNS:** change only the two **website** records above. Touching the email records will break Microsoft 365 mail delivery.
- **Don't host the website on cPanel.** This is a Next.js app and belongs on Vercel; DaleHosting shared hosting can't run it.
- **Possible future cleanup:** DNS could be consolidated onto Vercel (re-creating the Microsoft 365 records there) and the DaleHosting account retired, since its hosting is unused.
