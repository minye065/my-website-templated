/* ------------------------------------------------------------------ *
 * SITE CONTENT — edit everything here.                                 *
 * Add / remove / reorder items in these arrays and the page updates.   *
 * ------------------------------------------------------------------ */

export interface Project {
  name: string;
  desc: string;
  href: string;
}

export const PROJECTS: Project[] = [
  {
    name: 'this site :/',
    desc: 'some random site',
    href: 'https://github.com/minye065/my-website-templated',
  },
  {
      name: 'aud',
      desc: 'in progress audio player of sorts',
      href: 'https://github.com/minye065/Aud',
  },
];

export interface Contact {
  label: string;
  href: string;
}

export const CONTACTS: Contact[] = [
  { label: 'github', href: 'https://github.com/minye065' },
];
