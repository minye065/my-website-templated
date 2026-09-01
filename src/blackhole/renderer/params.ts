export type Params =
{
  hue: number; //deg
  saturation: number;
  drift: number;
  exposure: number;
  contrast: number;
  innerRadius: number;
  outerRadius: number;
  spin: number;
  density: number;
  detail: number;
  doppler: number;
  diskGlow: number;
  inclination: number;
  azimuth: number;
  distance: number;
  roll: number;
  focalLength: number;
  autoRotate: number;
  starAmount: number;
  starBrightness: number;
  nebulosity: number;
  quality: number;
  bloom: number;
};

export const DEFAULTS: Params =
{
  hue: 27,
  saturation: 1.0,
  drift: 8,
  exposure: 1.0,
  contrast: 1.0,
  innerRadius: 2.7,
  outerRadius: 12.5,
  spin: 1.0,
  density: 0.55,
  detail: 1.0,
  doppler: 0.35,
  diskGlow: 0.18,
  inclination: 7,
  azimuth: 20,
  distance: 15,
  roll: -26,
  focalLength: 1.7,
  autoRotate: 0.35,
  starAmount: 0.55,
  starBrightness: 0.85,
  nebulosity: 0.25,
  quality: 0.6,
  bloom: 0.45,
};

export type Preset =
{
  name: string;
  hue: number;
  sat: number;
  drift: number;
  swatch: string;
};

export const PRESETS: Preset[] =
[
  { name: "Amber", hue: 27, sat: 1.0, drift: 8, swatch: "#e07a1f" },
  { name: "Carmine", hue: 340, sat: 1.0, drift: 12, swatch: "#c2103f" },
  { name: "Ember", hue: 8, sat: 1.05, drift: 14, swatch: "#d63a17" },
  { name: "Solar", hue: 46, sat: 1.0, drift: 6, swatch: "#e8b021" },
  { name: "Verdant", hue: 142, sat: 0.9, drift: -14, swatch: "#17a85e" },
  { name: "Cyan", hue: 188, sat: 0.95, drift: -12, swatch: "#12aec4" },
  { name: "Ion", hue: 268, sat: 0.9, drift: 22, swatch: "#8a4fd8" },
  { name: "Bone", hue: 32, sat: 0.14, drift: 0, swatch: "#cfc4b6" },
];