# Editing content — Mihurić rebuild

The original mihuric.hr is a WordPress + Enfold site where the owner edits each page through the WordPress admin. This rebuild uses the closest file-based equivalent: **Markdown / MDX content collections inside git**. A future lightweight headless-CMS (Decap, TinaCMS, etc.) can sit on top of these files without any template changes.

## Where copy lives

| URL                           | Where the copy comes from                             | Kind             |
|-------------------------------|--------------------------------------------------------|------------------|
| `/`                           | `src/pages/index.astro` (inline)                       | Template-inline  |
| `/about/`                     | `src/pages/about/index.astro` (inline)                 | Template-inline  |
| `/plan-a-trip/`               | `src/pages/plan-a-trip.astro` (inline)                 | Template-inline  |
| `/contact/`                   | `src/pages/contact.astro` + `src/lib/site.ts` (for address/phone) | Template-inline  |
| `/dive-sites/<slug>/`         | `src/content/dive-sites/<slug>.en.mdx`                 | **MDX** (editable) |
| `/courses/<slug>/`            | `src/content/courses/<slug>.en.mdx`                    | **MDX** (editable) |
| `/faq/<topic>/`               | `src/content/faq/<topic>.en.mdx`                       | **MDX** (editable) |
| `/what-we-offer/`             | `src/content/pages/what-we-offer.en.mdx`               | **MDX** (editable) |
| `/what-we-offer/diving/`      | `src/content/pages/what-we-offer-diving.en.mdx`        | **MDX** (editable) |
| `/media/`                     | `src/content/pages/media.en.mdx`                       | **MDX** (editable) |
| `/webcam/`                    | `src/content/pages/webcam.en.mdx`                      | **MDX** (editable) |

> **Note.** The four rich templates (home, about, plan-a-trip, contact) currently inline their copy because the design is structured (hero, grids, price tables). Moving that text into MDX is planned — the templates already accept a clean input, so the migration is mechanical. Until then, see `PUNCH-LIST.md` for the exact lines that need owner input.

## Field names on dive-site MDX

```yaml
title: "Shipwreck Peltastis"
slug: "shipwreck-peltastis"
locale: "en"
summary: "Min. depth: 8 m / 26 feet"
depth:
  min: 8
  max: 31
certification: "Advanced Open Water"
category: "wreck"
marineLife: []
hero: "../../assets/dive-sites/shipwreck-peltastis/MIH-2014_pozicija_A_01.jpg"
```

## Single-source facts

Site-wide facts (phone, email, address, GPS, PADI rating) live in **one file only**: `src/lib/site.ts`. Editing that file updates every page that references it.

## Translation / localisation

Every MDX file is locale-tagged in its filename: `shipwreck-peltastis.en.mdx` is English, `.hr.mdx` is Croatian. Add a new locale by copying the file and translating the body.

## Adding a new dive site

1. Drop hero image into `src/assets/dive-sites/<slug>/`.
2. Create `src/content/dive-sites/<slug>.en.mdx` following the field schema in `src/content.config.ts`.
3. `npm run build` — the page is live at `/dive-sites/<slug>/` with no template changes needed.
