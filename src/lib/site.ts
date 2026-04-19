/**
 * Canonical site-wide facts. One place to edit.
 *
 * Phone and address are verbatim from the current mihuric.hr footer.
 * GPS is verbatim from the current contact page.
 */

export const SITE = {
  name: 'Diving Center Mihurić',
  shortName: 'DC Mihurić',
  tagline: 'PADI 5 Star IDC Resort — Selce, Croatia — since 1995',
  url: 'https://mihuric-v2.pages.dev',
  locales: ['en', 'hr'] as const,
  defaultLocale: 'en' as const,
  email: 'info@mihuric.hr',
  phones: ['+385 51 765 462', '+385 99 216 9444'] as const,
  address: {
    street: 'Šetalište Ivana Jeličića bb',
    postal: '51266',
    city: 'Selce',
    country: 'Croatia',
    countryCode: 'HR',
  },
  gps: { lat: 45.15246385301, lng: 14.719472226891 },
  social: {
    facebook: 'https://www.facebook.com/DCMihuricSelce/',
    instagram: 'https://www.instagram.com/dc_mihuric/',
  },
  padi: {
    rating: '5 Star IDC Resort',
    operatingSince: 1995,
  },
  /**
   * Opening hours are a placeholder until the owner confirms real values.
   * The original mihuric.hr does not publish hours. Treat every string here
   * as "Lorem Ipsum"-equivalent — safe to display, not a claim of fact.
   */
  hours: {
    season: 'Apr–Oct (placeholder)',
    weekday: 'Lorem ipsum',
    sunday: 'Lorem ipsum',
  },
} as const;

export type Locale = (typeof SITE.locales)[number];
