# Placeholder punch-list — needs owner input

This file lists every placeholder, stand-in, or "Lorem ipsum" string currently live in the rebuild. Nothing in this list was invented as a claim of fact; everything is marked visibly as a placeholder so it cannot accidentally read as real.

Work top-to-bottom with the owner. When each item is filled, delete the row.

**Conventions**
- *File* = path to the file to edit.
- *Field / section* = which heading or element to find.
- *Current placeholder* = exactly what it says today.
- *Needs* = what to replace it with.

---

## 1 · Site-wide facts (`src/lib/site.ts`)

| Field | Current placeholder | Needs |
|---|---|---|
| `hours.season` | `"Apr–Oct (placeholder)"` | Actual seasonal opening date range. |
| `hours.weekday` | `"Lorem ipsum"` | Weekday opening hours (e.g. `08:00–19:00`). |
| `hours.sunday` | `"Lorem ipsum"` | Sunday opening hours (if different). |

> Until these are real, the `/contact/` hero shows an "Opening hours — placeholder" banner.

---

## 2 · Home page (`src/pages/index.astro`)

| Section | Current placeholder | Needs |
|---|---|---|
| Hero meta cells | "Water on a sunny day · up to 30 m transparency" | Verify this number still matches the owner's experience (taken from the original Weather page, 30 m). |
| Hero meta cells | "Summer sea temp · 20–25 °C · Jul–Sep" | Verified from the original Weather page; flag only if the owner wants to update. |
| Sites grid | "Shipwreck SS Regolo · Depth Lorem · Level Lorem" | Real min/max depth and required cert for SS Regolo. |
| Sites grid | "Shipwreck Jakljan · Depth Lorem" | Real min/max depth. |
| Sites grid | "Yellow coral · Depth Lorem" | Real min/max depth. |
| Team section | `"Lorem ipsum dolor sit amet — this is the space we'd put a quote from the owner."` | A single-line pull quote the owner is happy to have attributed. |

---

## 3 · About page (`src/pages/about/index.astro`)

| Section | Current placeholder | Needs |
|---|---|---|
| The shop panel | `"Lorem ipsum · placeholder"` pronunciation line + `"Lorem ipsum dolor sit amet — a short paragraph about the shop itself"` body | Two-sentence description of the physical shop — classroom, rental, compressor, courtyard. |
| The shop panel · Hours spec | `"Lorem ipsum"` | Same hours as site.ts above. |
| Boat panel · Season | `"Lorem ipsum"` | Dates the boat runs (e.g. April to early November). |
| Boat panel · Capacity | `"Lorem ipsum"` | Max divers + crew on board. |
| Wider area panel · Deepest | `"Lorem ipsum"` | Deepest regularly-dived site in the area. |
| Wider area panel · Season | `"Lorem ipsum"` | Diving season dates. |
| Philosophy quote | `"Lorem ipsum dolor sit amet — a pull quote from the owner belongs here."` | A 1–2 line credo the owner is happy to attribute. |
| Team cards (both) | Portraits + names + bios all marked `"Placeholder — to be confirmed"` / `"Lorem Ipsum"` | Photos, real names (with consent), one-paragraph bios, experience years, languages spoken. Delete either card if only one featured person is desired; add more if the crew is bigger. |
| Timeline entry 2 (year) | `"Lorem"` year, `"Lorem ipsum milestone."` | Real early milestone — e.g. year shop moved into its current building. |
| Timeline entry 3 (year) | `"Lorem"` year for PADI 5★ IDC upgrade | Year the shop achieved 5★ IDC Resort status. |
| Timeline entry 4 (year) | `"Lorem"` year for Technical diving | Year technical diving was added. |

---

## 4 · Plan-a-trip page (`src/pages/plan-a-trip.astro`)

| Section | Current placeholder | Needs |
|---|---|---|
| All three package cards | `"Pricing on request"` | Decision: publish prices or keep "on request"? Original mihuric.hr has no prices. If publishing, add €-amounts to each card (discovery, boat dive, night dive) and remove the placeholder styling. |
| Getting-here routes — all four | `"Lorem ipsum — placeholder"` bodies | Owner's preferred airport recommendations (Rijeka? Zagreb? Venice/Trieste?), typical driving directions, parking notes. Four cards max; fewer is fine. |
| Getting-here · Nearest airport | `"Lorem"` duration / transport cost | Typical ground-transfer time and whether taxi/bus cost is worth publishing. |

---

## 5 · Contact page (`src/pages/contact.astro`)

| Section | Current placeholder | Needs |
|---|---|---|
| Status bar sub-line | `"Real hours will replace this line once the owner confirms them."` | Replace with seasonal hours (or delete the status bar entirely if the owner prefers). |
| Address block · Sub-line | `"Placeholder · location hint (parking, landmark) to be confirmed"` | A single-line visual landmark (e.g. "opposite the harbour office") if useful. |

---

## 6 · Contact form (environment variable)

The `/contact/` page renders a contact form **only if** the environment variable `PUBLIC_WEB3FORMS_KEY` is set during build. Right now the form is omitted. The owner needs to either:

- Create a free Web3Forms account → drop the key into Cloudflare Pages env vars as `PUBLIC_WEB3FORMS_KEY`, or
- Decide they are happy with email-and-phone-only (current state), or
- Ask for a Formspree / different-provider integration instead.

---

## 7 · Asset stand-ins

Several placeholder images shipped from Claude Design are still used while we wait for real photography:

| File | Location | Needs |
|---|---|---|
| `src/assets/design/home-assets/above-aerial.jpg` | Plan-a-trip hero bg | Real aerial of Selce harbour / DC Mihurić. |
| `src/assets/design/home-assets/above-harbor.jpg` | About page "wide-image" | Real aerial of Selce harbour. |
| `src/assets/design/home-assets/team-portrait.jpg` | About team card 1 | Real instructor portrait (with consent). |
| `src/assets/design/home-assets/team-briefing.jpg` | About team card 2, home page team block | Real crew photo (with consent). |
| `src/assets/design/home-assets/site-*.jpg` | Home page dive-site grid | Real site photography for SS Regolo, Jakljan, Yellow coral. |

---

## 8 · Dive-site content collections (30 files in `src/content/dive-sites/`)

All 30 MDX files are scraped from the original site verbatim. They share the same limitations as the original:

- `depth.min` and `depth.max` are **`0` in the schema for many entries** because the original paragraphs encode "8 m / 26 feet" in prose rather than structured fields. Parse them over into the frontmatter when doing a content pass.
- `marineLife` is an **empty array** on every entry — the original never structured it.
- `gps` is **missing** — dive-site GPS would be nice for the map/Google Maps link but was never published.
- `entry` (boat / shore / boat-or-shore), `difficulty`, `visibility`, `currents` are **optional and mostly empty**.

None of this is broken — the template renders around missing fields — but filling them in raises the site quality considerably.

---

## 9 · Pre-existing content-collection warnings (pre-existing, not blocking)

`npm run build` logs four warnings:

```
Entry pages → media.en was not found.
Entry pages → webcam.en was not found.
Entry pages → what-we-offer.en was not found.
Entry pages → what-we-offer-diving.en was not found.
```

The MDX files exist on disk; Astro's `getEntry('pages', 'media.en')` just isn't resolving their ids correctly. Needs a 15-minute fix to align the getEntry lookup with the file layout. Not user-visible; pages render, just without their MDX body.

---

## Quickest order of operations

1. Fill in opening hours (`site.ts`) — 1 field, unblocks 3 pages.
2. Decide pricing policy (publish vs. "on request") for plan-a-trip.
3. Confirm team roster + get portraits — unblocks entire About team section.
4. Add 3 × real site depths for the home page grid (SS Regolo, Jakljan, Yellow coral).
5. Fill in Getting-here routes on plan-a-trip.
6. Replace design-kit hero/aerial photos with real photography.
7. Optional: enrich dive-site frontmatter (depth numbers, marine life) for all 30 files.
