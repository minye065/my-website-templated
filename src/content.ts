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
  {
    name: 'spi math slave',
    desc: 'a chip designed from the tiny tapeout template',
    href: 'https://github.com/minye065/firstAsic',
  },
  {
    name: 'insatiate',
    desc: 'a game? (not even close to working)',
    href: 'https://github.com/minye065/insatiate',
  },
];

export interface Contact {
  label: string;
  href: string;
}

export const CONTACTS: Contact[] = [
  { label: 'github', href: 'https://github.com/minye065' },
];
