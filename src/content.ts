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

export const PROJECTS: Project[] = [
  {
    name: 'placeholder',
    desc: '',
    tag: 'go · htmx',
    href: 'https://github.com',
  },
];

export const NOW: string[] = [
  'Rewriting the skysweep renderer to cull off-screen labels properly',
  'Reading through the SQLite btree source, taking notes',
  'Slowly learning celestial navigation the analog way',
];

export interface Contact {
  label: string;
  href: string;
}

export const CONTACTS: Contact[] = [
  { label: 'github ↗', href: 'https://github.com/minye065' },
];
