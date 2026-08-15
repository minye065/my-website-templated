

export interface Dso {
  desig: string;
  name: string | null;
  type: string;
  mag: number;
  size: number; // arcminutes
  ra: number;
  dec: number;
  con: string;
}

export const DSO_TYPE: Record<string, string> = {
  g: 'Galaxy',
  s: 'Spiral galaxy',
  s0: 'Lenticular galaxy',
  i: 'Irregular galaxy',
  e: 'Elliptical galaxy',
  oc: 'Open cluster',
  gc: 'Globular cluster',
  bn: 'Bright nebula',
  rn: 'Reflection nebula',
  en: 'Emission nebula',
  pn: 'Planetary nebula',
  snr: 'Supernova remnant',
};

export function dsoFamily(type: string): 'galaxy' | 'cluster' | 'nebula' {
  if (['g', 's', 's0', 'i', 'e'].includes(type)) return 'galaxy';
  if (['oc', 'gc'].includes(type)) return 'cluster';
  return 'nebula';
}

export const FAMILY_COLOR: Record<string, string> = {
  galaxy: '#db1ee1',
  cluster: '#FFB300',
  nebula: '#00E676',
};

type RawDso = [string, string | null, string, number, number, number, number, string];

// desig, common name, type, magnitude, size (arcmin), RA (deg), Dec (deg), constellation
const RAW_DSOS: RawDso[] = [
  ['M1', 'Crab Nebula', 'snr', 8.4, 6, 83.63, 22.02, 'Tau'],
  ['M2', null, 'gc', 6.5, 16, 323.36, -0.82, 'Aqr'],
  ['M3', null, 'gc', 6.2, 18, 205.55, 28.38, 'CVn'],
  ['M4', null, 'gc', 5.6, 26, 245.9, -26.53, 'Sco'],
  ['M5', null, 'gc', 5.6, 23, 229.64, 2.08, 'Ser'],
  ['M6', 'Butterfly Cluster', 'oc', 4.2, 25, 265.08, -32.22, 'Sco'],
  ['M7', 'Ptolemy Cluster', 'oc', 3.3, 80, 268.45, -34.79, 'Sco'],
  ['M8', 'Lagoon Nebula', 'en', 6.0, 45, 270.9, -24.38, 'Sgr'],
  ['M9', null, 'gc', 7.7, 9, 259.8, -18.52, 'Oph'],
  ['M10', null, 'gc', 6.6, 15, 254.28, -4.1, 'Oph'],
  ['M11', 'Wild Duck Cluster', 'oc', 6.3, 14, 282.77, -6.27, 'Sct'],
  ['M13', 'Hercules Cluster', 'gc', 5.8, 20, 250.42, 36.46, 'Her'],
  ['M15', null, 'gc', 6.2, 18, 322.49, 12.17, 'Peg'],
  ['M16', 'Eagle Nebula', 'en', 6.0, 35, 274.7, -13.78, 'Ser'],
  ['M17', 'Omega Nebula', 'en', 6.0, 46, 275.2, -16.18, 'Sgr'],
  ['M19', null, 'gc', 6.8, 17, 255.65, -26.27, 'Oph'],
  ['M20', 'Trifid Nebula', 'en', 6.3, 28, 270.65, -23.03, 'Sgr'],
  ['M21', null, 'oc', 5.9, 13, 271.15, -22.5, 'Sgr'],
  ['M22', null, 'gc', 5.1, 32, 279.1, -23.9, 'Sgr'],
  ['M23', null, 'oc', 5.5, 27, 269.2, -19.02, 'Sgr'],
  ['M24', 'Sagittarius Star Cloud', 'oc', 4.6, 90, 274.2, -18.48, 'Sgr'],
  ['M27', 'Dumbbell Nebula', 'pn', 7.5, 8, 299.9, 22.72, 'Vul'],
  ['M28', null, 'gc', 6.8, 11, 276.14, -24.87, 'Sgr'],
  ['M30', null, 'gc', 7.2, 12, 325.09, -23.18, 'Cap'],
  ['M31', 'Andromeda Galaxy', 's', 3.4, 180, 10.68, 41.27, 'And'],
  ['M32', null, 'e', 8.1, 8, 10.67, 40.87, 'And'],
  ['M33', 'Triangulum Galaxy', 's', 5.7, 70, 23.46, 30.66, 'Tri'],
  ['M35', null, 'oc', 5.3, 28, 92.22, 24.33, 'Gem'],
  ['M36', null, 'oc', 6.3, 12, 84.05, 34.13, 'Aur'],
  ['M42', 'Orion Nebula', 'en', 4.0, 85, 83.82, -5.39, 'Ori'],
  ['M44', 'Beehive Cluster', 'oc', 3.7, 95, 130.05, 19.98, 'Cnc'],
  ['M45', 'Pleiades', 'oc', 1.6, 110, 56.75, 24.12, 'Tau'],
  ['M50', null, 'oc', 5.9, 16, 105.8, -8.33, 'Mon'],
  ['M51', 'Whirlpool Galaxy', 's', 8.4, 11, 202.47, 47.2, 'CVn'],
  ['M55', null, 'gc', 6.3, 19, 295.0, -30.96, 'Sgr'],
  ['M57', 'Ring Nebula', 'pn', 8.8, 3, 283.4, 33.03, 'Lyr'],
  ['M59', null, 'e', 9.6, 5, 190.51, 11.65, 'Vir'],
  ['M60', null, 'e', 8.8, 7, 190.92, 11.55, 'Vir'],
  ['M63', 'Sunflower Galaxy', 's', 8.6, 12, 198.96, 42.03, 'CVn'],
  ['M64', 'Black Eye Galaxy', 's', 8.5, 10, 194.18, 21.68, 'Com'],
  ['M74', 'Phantom Galaxy', 's', 9.4, 10, 24.17, 15.78, 'Psc'],
  ['M76', 'Little Dumbbell Nebula', 'pn', 10.1, 3, 25.58, 51.58, 'Per'],
  ['M81', "Bode's Galaxy", 's', 6.9, 26, 148.89, 69.07, 'UMa'],
  ['M82', 'Cigar Galaxy', 'i', 8.4, 11, 148.97, 69.68, 'UMa'],
  ['M83', 'Southern Pinwheel', 's', 7.5, 13, 204.25, -29.87, 'Hya'],
  ['M87', 'Virgo A', 'e', 8.6, 8, 187.71, 12.39, 'Vir'],
  ['M90', null, 's', 9.5, 9, 189.21, 13.16, 'Vir'],
  ['M94', null, 's', 8.2, 11, 192.72, 41.12, 'CVn'],
  ['M95', null, 's', 9.7, 7, 161.0, 11.7, 'Leo'],
  ['M96', null, 's', 9.2, 7, 161.69, 11.82, 'Leo'],
  ['M97', 'Owl Nebula', 'pn', 9.9, 3, 168.7, 55.02, 'UMa'],
  ['M100', null, 's', 9.3, 7, 185.73, 15.82, 'Com'],
  ['M101', 'Pinwheel Galaxy', 's', 7.9, 28, 210.8, 54.35, 'UMa'],
  ['M104', 'Sombrero Galaxy', 's', 8.0, 9, 190.0, -11.62, 'Vir'],
  ['M105', null, 'e', 9.3, 5, 161.96, 12.58, 'Leo'],
  ['NGC 869', 'Double Cluster', 'oc', 4.3, 30, 34.74, 57.13, 'Per'],
  ['NGC 7000', 'North America Nebula', 'en', 4.0, 120, 314.7, 44.33, 'Cyg'],
  ['NGC 5139', 'Omega Centauri', 'gc', 3.9, 36, 201.7, -47.48, 'Cen'],
  ['NGC 253', 'Sculptor Galaxy', 's', 7.2, 27, 11.9, -25.29, 'Scl'],
  ['NGC 3372', 'Carina Nebula', 'en', 1.0, 120, 161.26, -59.87, 'Car'],
  ['IC 434', 'Horsehead Nebula', 'en', 6.8, 30, 85.24, -2.46, 'Ori'],
  ['NGC 2237', 'Rosette Nebula', 'en', 9.0, 80, 98.4, 4.98, 'Mon'],
  ['NGC 6960', 'Veil Nebula', 'snr', 7.0, 70, 311.65, 30.72, 'Cyg'],
  ['LMC', 'Large Magellanic Cloud', 'i', 0.9, 300, 80.9, -69.75, 'Dor'],
  ['SMC', 'Small Magellanic Cloud', 'i', 2.7, 190, 13.16, -72.8, 'Tuc'],
  ['NGC 2070', 'Tarantula Nebula', 'en', 8.0, 40, 84.68, -69.1, 'Dor'],
  ['NGC 4565', 'Needle Galaxy', 's', 9.6, 16, 189.09, 25.99, 'Com'],
];

export const DSOS: Dso[] = RAW_DSOS.map(([desig, name, type, mag, size, ra, dec, con]) => ({
  desig,
  name,
  type,
  mag,
  size,
  ra,
  dec,
  con,
}));

export interface Catalog {
  dsos: Dso[];
}

export const CATALOG: Catalog = {
  dsos: DSOS,
};
