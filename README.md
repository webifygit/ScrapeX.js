# ScrapeX — scrapex.site

Marketing site for ScrapeX, a custom web-scraping service. Minimalist, professional and playful: paper background, ink text, lime accents, Syne display type, framer-motion micro-animations.

Built with Next.js (App Router), React 19, Tailwind CSS v4 and framer-motion.

## Run it

```sh
npm install
npm run dev        # http://localhost:3000
```

Other scripts:

```sh
npm run build      # production build
npm start          # serve the production build
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm test           # vitest (jsdom)
npm run format     # prettier
```

## Pages

| Route           | File                                   |
| --------------- | -------------------------------------- |
| `/`             | `src/app/(site)/page.tsx`              |
| `/demo`         | `src/app/(site)/demo/page.tsx`         |
| `/services`     | `src/app/(site)/services/page.tsx`     |
| `/case-studies` | `src/app/(site)/case-studies/page.tsx` |
| `/quote`        | `src/app/(site)/quote/page.tsx`        |
| `/trust`        | `src/app/(site)/trust/page.tsx`        |
| `/remove`       | `src/app/(site)/remove/page.tsx`       |
| `/privacy`      | `src/app/(site)/privacy/page.tsx`      |
| `/terms`        | `src/app/(site)/terms/page.tsx`        |

`src/app/(site)/layout.tsx` wraps every page in the shared header, footer and cursor (`SiteShell`). `src/app/not-found.tsx` and `src/app/error.tsx` render outside that shell.

## Structure

- `src/app/layout.tsx` — root layout: self-hosted Google fonts via `next/font`, default metadata, `globals.css`.
- `src/app/globals.css` — Tailwind v4 theme tokens (oklch), base styles, `label-mono` and `grid-bg` utilities.
- `src/components/site/` — site chrome and primitives (`Layout.tsx`), home page (`Home.tsx`), mock UIs (`Mocks.tsx`), looping visuals (`Motion.tsx`), forms (`SimpleForm.tsx`, `QuoteForm.tsx`, `RemoveForm.tsx`, `forms.ts`) and fictional sample rows (`sample-data.ts`).
- `src/components/ui/` — shadcn/ui components (only `accordion` is used; add more with `npx shadcn@latest add <name>`).

## Forms

The quote and removal forms validate with zod on the client and show a success state. They do not send anything yet; wire `SimpleForm`'s `onSubmit` to a Server Action or API route when a backend exists. The live demo is the exception — it talks to real API routes.

## Live demo

`/demo` lets a visitor point ScrapeX at a public website and watch it pull out contact details. The flow: enter a URL and a company email (free and throwaway mailboxes are refused), optionally a WhatsApp number, receive a six-digit code by email, enter it, and the crawler reads the site while the contacts stream onto the page. It stops at `DEMO_CONTACT_LIMIT` (10) contacts, then offers them as Excel, CSV, JSON or Markdown.

It looks for email addresses and phone numbers in the markup, takes the name from the address when the address carries one (`j.reyes@` → J. Reyes, but never `sales@`), and keeps the words around each hit so a visitor can see where it came from. Pages whose URL looks like a contact, about or team page are read first.

| Piece                     | File                                                                    |
| ------------------------- | ----------------------------------------------------------------------- |
| UI, all four steps        | `src/components/site/LiveDemo.tsx`                                      |
| Shared validation         | `src/lib/demo/schema.ts`, `src/lib/demo/email-domains.ts`               |
| Session, OTP, rate limits | `src/lib/demo/store.ts`, `src/lib/demo/otp.ts`                          |
| Crawler                   | `src/lib/demo/crawl.ts`, `extract.ts`, `robots.ts`, `net-guard.ts`      |
| Downloads                 | `src/lib/demo/export.ts`, `src/lib/xlsx.ts` (no spreadsheet dependency) |
| API                       | `src/app/api/demo/{start,verify,run,download}/route.ts`                 |

What makes it safe to leave open on a public site:

- **No private targets.** Every URL and every redirect hop is resolved and checked, so loopback, private ranges and the cloud metadata address are refused — see `net-guard.ts`.
- **robots.txt first.** The crawler reads the site's rules before its first request and skips whatever they disallow, at the crawl delay they ask for.
- **Bounded.** 10 contacts, at most 20 pages, one request at a time, 8s per request, 1.5 MB per page, 75s per run. It also gives up after 8 pages without a new contact, so a site with none finishes in seconds rather than crawling to the cap.
- **Rate limited.** Six codes per IP per hour, five per address per day, three runs per address per day.
- **Verified leads only.** A run is appended to `data/demo-leads.jsonl` (gitignored) once the address is verified, and emailed to `DEMO_LEADS_EMAIL` if that is set.

Sessions live in memory in the single PM2 process, so a deploy drops any codes in flight — ten minutes of inconvenience at worst, and the reason this does not need a database yet.

### Demo environment

Mail goes out through [Resend](https://resend.com); the droplet cannot send its own. The deploy workflow writes these to `/var/www/scrapex.site/.env.local` from repository secrets of the same name, so they are set by adding a secret in GitHub rather than by touching the server.

| Variable           | Required | What it does                                                                                                     |
| ------------------ | -------- | ---------------------------------------------------------------------------------------------------------------- |
| `RESEND_API_KEY`   | yes      | Sends the verification code. Without it the demo answers "verification is not switched on yet" and nothing runs. |
| `DEMO_FROM_EMAIL`  | no       | From address, default `ScrapeX <demo@scrapex.site>`. Its domain must be verified in Resend.                      |
| `DEMO_LEADS_EMAIL` | no       | Gets a note each time someone completes a demo.                                                                  |
| `DEMO_OTP_SECRET`  | no       | Keeps codes valid across restarts. A random one is used per process when unset.                                  |
| `DEMO_LEADS_FILE`  | no       | Where leads are appended, default `data/demo-leads.jsonl` under the app.                                         |

## Deploy (Ubuntu server, nginx + PM2)

Live at https://www.scrapex.site. Plain http and the bare domain redirect there with a 301.

The app runs under PM2 as `scrapex` on 127.0.0.1:3300, behind nginx. Everything needed is in `deploy/`.

First time on a server:

```sh
# 1. Install Node 22 and PM2 if missing, clone, build and start the app
curl -fsSL https://raw.githubusercontent.com/webifygit/ScrapeX.js/main/deploy/deploy.sh | bash
# 2. Get a Let's Encrypt certificate for both names
sudo certbot certonly --nginx -d scrapex.site -d www.scrapex.site
# 3. Install the nginx config and reload
sudo cp /var/www/scrapex.site/deploy/nginx/scrapex.site.conf /etc/nginx/sites-available/scrapex.site
sudo ln -sf /etc/nginx/sites-available/scrapex.site /etc/nginx/sites-enabled/scrapex.site
sudo nginx -t && sudo systemctl reload nginx
```

`deploy.sh` installs Node 22 and PM2 if missing, clones or fast-forwards the repo, runs `npm ci` and `npm run build`, and restarts the `scrapex` PM2 process. It does not touch nginx: after changing `deploy/nginx/scrapex.site.conf`, repeat step 3.

### Continuous deployment

Pushing to `main` is the deploy. `.github/workflows/deploy.yml` runs lint, typecheck, tests and a production build; if they pass it opens SSH to the droplet, pipes this repo's `deploy/deploy.sh` to it pinned to the pushed commit, and then checks every page answers 200. A failing check means nothing ships. Pull requests run the checks only.

The deploy job reads four repository secrets:

| Secret               | Value                                                                      |
| -------------------- | -------------------------------------------------------------------------- |
| `DEPLOY_HOST`        | the droplet's address                                                      |
| `DEPLOY_USER`        | the SSH user `deploy.sh` runs as                                           |
| `DEPLOY_SSH_KEY`     | private half of a key in that user's `~/.ssh/authorized_keys`              |
| `DEPLOY_KNOWN_HOSTS` | the droplet's public host keys, so the runner verifies what it connects to |

Optional repository variables override the defaults: `DEPLOY_PORT` (22), `DEPLOY_PATH` (`/var/www/scrapex.site`), `SITE_URL` (`https://www.scrapex.site`). With the secrets unset the deploy job warns and skips instead of failing.

To deploy by hand — the same script the pipeline runs — use **Actions → CI & deploy → Run workflow**, or:

```sh
# on the server
bash /var/www/scrapex.site/deploy/deploy.sh
# or from this folder on your machine
ssh root@<server> 'bash -s' < deploy/deploy.sh
```
