# mihuric-v2 — modernized site for Diving Center Mihurić

Rebuild of [www.mihuric.hr](https://www.mihuric.hr) as an Astro + Tailwind
+ MDX static site, ready for visual design via Claude Design.

Ship target: free preview at `https://mihuric-v2.pages.dev`, cutover to
`mihuric.hr` once the owner approves.

---

## What's here now

- **Astro 6** scaffold, TypeScript strict, Tailwind v4, MDX, sitemap.
- **shadcn/ui convention** in `components.json` — primitives live in
  `src/components/ui/` as Astro components (zero-JS). The `cn()` helper
  is at `src/lib/utils.ts`. Claude Design's "Your brand, built in"
  feature reads this exact layout.
- **Content collections** at `src/content/` — 35 dive sites, 5 courses,
  6 FAQ topics, 9 pages — scraped from the live WordPress site.
- **SEO baseline** — per-page title/description, Open Graph, Twitter
  Card, JSON-LD (`LocalBusiness`, `TouristAttraction`, `Course`),
  `hreflang` (en + hr), auto-generated sitemap, canonical URLs.
- **Inquiry form** at `/contact/` — POSTs to Web3Forms; set
  `PUBLIC_WEB3FORMS_KEY` in `.env` or Cloudflare Pages env vars.
- **Redirect map** at `public/_redirects` covering every live WordPress
  URL → new route, so the owner's Google authority flows through on
  DNS cutover.
- **Design tokens are empty placeholders** in `src/styles/globals.css`.
  This is intentional — Claude Design owns the visual layer.

---

## Running it

```sh
npm install
npm run dev          # localhost:4321
npm run build        # static output to dist/
npm run preview      # serve dist/ locally

# Re-scrape content from the live WordPress site (rarely needed):
node scripts/scrape.mjs
```

Node 22.12+ required.

---

## Deploying to Cloudflare Pages (first time)

1. **GitHub:** push this repo to a fresh GitHub repository, e.g.
   `nikola-fijan/mihuric-v2`.
2. **Cloudflare dash:** Pages → Create application → Connect to Git →
   pick the repo.
3. **Build settings:**
   - Framework preset: **Astro**
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: *(leave blank — repo root is `web/`; if the repo
     has a parent folder, set root to `web`)*
   - Environment variables: `PUBLIC_WEB3FORMS_KEY` = *<your key>*
4. Save & deploy. First build ≈ 2 minutes. Preview URL comes back as
   `mihuric-v2.pages.dev` (or whatever project name you picked).

Every push to `main` auto-redeploys. PR branches get their own preview
URLs automatically.

---

## Cutting over to mihuric.hr (when the owner approves)

1. In Cloudflare Pages → the project → Custom domains → add `mihuric.hr`
   and `www.mihuric.hr`.
2. Point DNS at the provided Cloudflare targets (or move the domain to
   Cloudflare DNS outright).
3. The `public/_redirects` file is already wired to forward every old
   WordPress URL (`/house-reef/`, `/padi-pro/`, `/shipwreck-peltastis/`,
   etc.) to its new route with 301s — no SEO authority lost.
4. After 48 hours, submit `https://mihuric.hr/sitemap-index.xml` in
   Google Search Console.
5. Decommission the old WordPress hosting.

---

## Working with Claude Design

See `/Users/nikola/.claude/plans/so-this-is-a-soft-hedgehog.md`
(the "Claude Design playbook" section) for the full workflow. Short
version:

1. Gather assets: logo, 15–30 photos from `@dc_mihuric` Instagram, the
   PADI 5★ badge, reference sites.
2. In Claude Design, new project → enable *"Your brand, built in"* →
   connect this GitHub repo. It will read `tailwind.config`,
   `src/components/ui/`, `src/styles/globals.css`.
3. Prompt the *design system first* (palette, type, spacing), not a
   whole page. Iterate until locked.
4. Then templates in this order: dive-site detail, course detail,
   header+footer, homepage, contact, FAQ, about.
5. Export each handoff bundle and feed to Claude Code with:
   "Apply this to `src/pages/…`. Reuse `src/components/ui/` primitives.
   Do not change content — only presentation."

---

## Directory map

```
web/
├── public/
│   ├── _redirects        ← 301s from old WP URLs
│   ├── favicon.svg
│   └── robots.txt
├── scripts/
│   └── scrape.mjs        ← one-shot WP → MDX scraper
├── src/
│   ├── assets/           ← scraped images (→ optimized by Astro)
│   ├── components/
│   │   ├── ui/           ← shadcn-convention primitives
│   │   ├── SiteHeader.astro
│   │   ├── SiteFooter.astro
│   │   ├── SEO.astro
│   │   └── Schema.astro
│   ├── content/
│   │   ├── dive-sites/   ← 35 MDX files
│   │   ├── courses/      ← 5 MDX files
│   │   ├── faq/          ← 6 MDX files
│   │   └── pages/        ← 9 MDX files
│   ├── layouts/
│   │   └── BaseLayout.astro
│   ├── lib/
│   │   ├── site.ts       ← canonical site-wide facts
│   │   └── utils.ts      ← cn() helper
│   ├── pages/            ← routes (see feature-parity map in plan)
│   ├── styles/
│   │   └── globals.css   ← design tokens as placeholders
│   └── content.config.ts
├── astro.config.mjs
├── components.json       ← shadcn/ui convention
├── package.json
└── tsconfig.json         ← @/* → src/*
```

---

## Known follow-ups (deliberately deferred)

- **Depth parsing** — the scrape only catches `X–Y meters` ranges;
  many pages use the `Min. depth: 8 m / Max. depth: 31 m` format.
  Either improve the regex or hand-edit frontmatter.
- **Croatian translations** — content is English-only today. Add
  `.hr.mdx` sibling files for at least home / what-we-offer /
  contact / dive sites before sharing with the owner.
- **Missing dive-site specs** — marine life, visibility, currents,
  entry type, GPS per site. Either ask the owner or research each.
- **Real photography** — scrape has ~50 images but many are small or
  cropped; the owner likely has full-res originals.
- **Design** — everything visual is intentionally unstyled; Claude
  Design owns this.
