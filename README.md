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

| Route           | File                                     |
| --------------- | ---------------------------------------- |
| `/`             | `src/app/(site)/page.tsx`                |
| `/services`     | `src/app/(site)/services/page.tsx`       |
| `/case-studies` | `src/app/(site)/case-studies/page.tsx`   |
| `/quote`        | `src/app/(site)/quote/page.tsx`          |
| `/trust`        | `src/app/(site)/trust/page.tsx`          |
| `/remove`       | `src/app/(site)/remove/page.tsx`         |
| `/privacy`      | `src/app/(site)/privacy/page.tsx`        |
| `/terms`        | `src/app/(site)/terms/page.tsx`          |

`src/app/(site)/layout.tsx` wraps every page in the shared header, footer and cursor (`SiteShell`). `src/app/not-found.tsx` and `src/app/error.tsx` render outside that shell.

## Structure

- `src/app/layout.tsx` — root layout: self-hosted Google fonts via `next/font`, default metadata, `globals.css`.
- `src/app/globals.css` — Tailwind v4 theme tokens (oklch), base styles, `label-mono` and `grid-bg` utilities.
- `src/components/site/` — site chrome and primitives (`Layout.tsx`), home page (`Home.tsx`), mock UIs (`Mocks.tsx`), looping visuals (`Motion.tsx`), forms (`SimpleForm.tsx`, `QuoteForm.tsx`, `RemoveForm.tsx`, `forms.ts`) and fictional sample rows (`sample-data.ts`).
- `src/components/ui/` — shadcn/ui components (only `accordion` is used; add more with `npx shadcn@latest add <name>`).

## Forms

The quote and removal forms validate with zod on the client and show a success state. They do not send anything yet; wire `SimpleForm`'s `onSubmit` to a Server Action or API route when a backend exists.

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

Every later update, after pushing to `main`:

```sh
# on the server
bash /var/www/scrapex.site/deploy/deploy.sh
# or from this folder on your machine
ssh root@<server> 'bash -s' < deploy/deploy.sh
```

`deploy.sh` installs Node 22 and PM2 if missing, clones or fast-forwards the repo, runs `npm ci` and `npm run build`, and restarts the `scrapex` PM2 process. It does not touch nginx: after changing `deploy/nginx/scrapex.site.conf`, repeat step 3.
