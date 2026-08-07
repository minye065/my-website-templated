/* ------------------------------------------------------------------ *
 * SITE CONTENT — edit everything here.                                 *
 * Add / remove / reorder items in these arrays and the page updates.   *
 * ------------------------------------------------------------------ */


export interface Project {
  name: string;
  desc: string;
  tag: string;
  href: string;
}

/** Rendered as a 2-per-row grid of cards. Add as many as you like. */
export const PROJECTS: Project[] = [
  {
    name: 'skysweep',
    desc: 'This star map. Canvas renderer over a bundled bright-star + Messier catalogue, with photos pulled live from the NASA image library.',
    tag: 'typescript · canvas',
    href: 'https://github.com',
  },
  {
    name: 'ledgerline',
    desc: 'A plain-text accounting viewer that turns beancount files into monthly burn charts.',
    tag: 'rust · cli',
    href: 'https://github.com',
  },
  {
    name: 'quietfeed',
    desc: 'RSS reader that batches everything into one daily digest. No unread counts, on purpose.',
    tag: 'go · sqlite',
    href: 'https://github.com',
  },
  {
    name: 'tideglass',
    desc: 'A tiny menu-bar app showing the next high and low tide for your saved coastline.',
    tag: 'swift · macos',
    href: 'https://github.com',
  },
  {
    name: 'foldmark',
    desc: 'Markdown notes that collapse into an outline. Keyboard-first, plain files on disk.',
    tag: 'typescript · tauri',
    href: 'https://github.com',
  },
  {
    name: 'lantern',
    desc: 'Self-hosted status page that pings your services and posts a daily uptime digest.',
    tag: 'go · htmx',
    href: 'https://github.com',
  },
];

/** Simple bulleted list of what you are working on now. */
export const NOW: string[] = [
  'Rewriting the skysweep renderer to cull off-screen labels properly',
  'Reading through the SQLite btree source, taking notes',
  'Slowly learning celestial navigation the analog way',
];

export interface Contact {
  label: string;
  href: string;
}

/** Links in the CONTACT row. Use mailto: for email. */
export const CONTACTS: Contact[] = [
  { label: 'jonas@herrera.dev', href: 'mailto:jonas@herrera.dev' },
  { label: 'github ↗', href: 'https://github.com' },
  { label: 'bluesky ↗', href: 'https://bsky.app' },
];
