/**
 * Weapon preset data sourced from the UESP wiki.
 * https://en.uesp.net/wiki/Oblivion:Weapons
 *
 * Each entry contains:
 *   baseDamage  — the BaseWeaponDamage value used in the damage formula
 *   baseHealth  — the maximum weapon condition (BaseWeaponHealth)
 */

import { type WeaponType } from '@/utils/damageFormulas';

export type WeaponMaterial =
  | 'Iron'
  | 'Steel'
  | 'Silver'
  | 'Dwarven'
  | 'Elven'
  | 'Glass'
  | 'Ebony'
  | 'Daedric';

export type WeaponSubtype =
  | 'Dagger'
  | 'Shortsword'
  | 'Longsword'
  | 'Claymore'
  | 'Mace'
  | 'War Axe'
  | 'Battle Axe'
  | 'Warhammer';

export interface WeaponPreset {
  material: WeaponMaterial;
  subtype: WeaponSubtype;
  weaponType: WeaponType; // 'Blade' | 'Blunt'
  baseDamage: number;
  baseHealth: number;
  /** Silver and Daedric bypass Resist Normal Weapons */
  bypassesResistance: boolean;
}

export const MATERIALS: WeaponMaterial[] = [
  'Iron',
  'Steel',
  'Silver',
  'Dwarven',
  'Elven',
  'Glass',
  'Ebony',
  'Daedric',
];

export const BLADE_SUBTYPES: WeaponSubtype[] = [
  'Dagger',
  'Shortsword',
  'Longsword',
  'Claymore',
];

export const BLUNT_SUBTYPES: WeaponSubtype[] = [
  'Mace',
  'War Axe',
  'Battle Axe',
  'Warhammer',
];

/** Two-handed subtypes do not receive a sneak attack bonus (always 1×). */
export const TWO_HANDED_SUBTYPES: WeaponSubtype[] = ['Claymore', 'Battle Axe', 'Warhammer'];

export function subtypeIsTwoHanded(subtype: WeaponSubtype): boolean {
  return TWO_HANDED_SUBTYPES.includes(subtype);
}

export const ALL_SUBTYPES: WeaponSubtype[] = [...BLADE_SUBTYPES, ...BLUNT_SUBTYPES];

export function subtypeToWeaponType(subtype: WeaponSubtype): WeaponType {
  return BLADE_SUBTYPES.includes(subtype) ? 'Blade' : 'Blunt';
}

export function materialBypassesResistance(material: WeaponMaterial): boolean {
  return material === 'Silver' || material === 'Daedric';
}

// ---------------------------------------------------------------------------
// Data table — (material, subtype) → { baseDamage, baseHealth }
// Values verified against https://en.uesp.net/wiki/Oblivion:Weapons
// ---------------------------------------------------------------------------

type PresetData = Record<WeaponMaterial, Record<WeaponSubtype, { baseDamage: number; baseHealth: number }>>;

export const PRESET_DATA: PresetData = {
  Iron: {
    Dagger:      { baseDamage:  5, baseHealth:  70 },
    Shortsword:  { baseDamage:  7, baseHealth:  98 },
    Longsword:   { baseDamage: 10, baseHealth: 140 },
    Claymore:    { baseDamage: 12, baseHealth: 138 },
    Mace:        { baseDamage: 10, baseHealth: 140 },
    'War Axe':   { baseDamage:  8, baseHealth: 112 },
    'Battle Axe':{ baseDamage: 12, baseHealth: 168 },
    Warhammer:   { baseDamage: 14, baseHealth: 196 },
  },
  Steel: {
    Dagger:      { baseDamage:  7, baseHealth: 112 },
    Shortsword:  { baseDamage:  9, baseHealth: 144 },
    Longsword:   { baseDamage: 12, baseHealth: 192 },
    Claymore:    { baseDamage: 14, baseHealth: 224 },
    Mace:        { baseDamage: 12, baseHealth: 192 },
    'War Axe':   { baseDamage: 10, baseHealth: 160 },
    'Battle Axe':{ baseDamage: 14, baseHealth: 224 },
    Warhammer:   { baseDamage: 16, baseHealth: 256 },
  },
  Silver: {
    Dagger:      { baseDamage:  9, baseHealth: 162 },
    Shortsword:  { baseDamage: 11, baseHealth: 198 },
    Longsword:   { baseDamage: 14, baseHealth: 252 },
    Claymore:    { baseDamage: 16, baseHealth: 288 },
    Mace:        { baseDamage: 14, baseHealth: 252 },
    'War Axe':   { baseDamage: 12, baseHealth: 216 },
    'Battle Axe':{ baseDamage: 16, baseHealth: 288 },
    Warhammer:   { baseDamage: 18, baseHealth: 324 },
  },
  Dwarven: {
    Dagger:      { baseDamage: 11, baseHealth: 220 },
    Shortsword:  { baseDamage: 13, baseHealth: 260 },
    Longsword:   { baseDamage: 16, baseHealth: 320 },
    Claymore:    { baseDamage: 18, baseHealth: 360 },
    Mace:        { baseDamage: 16, baseHealth: 320 },
    'War Axe':   { baseDamage: 14, baseHealth: 280 },
    'Battle Axe':{ baseDamage: 18, baseHealth: 360 },
    Warhammer:   { baseDamage: 20, baseHealth: 400 },
  },
  Elven: {
    Dagger:      { baseDamage: 13, baseHealth: 286 },
    Shortsword:  { baseDamage: 15, baseHealth: 330 },
    Longsword:   { baseDamage: 18, baseHealth: 396 },
    Claymore:    { baseDamage: 20, baseHealth: 440 },
    Mace:        { baseDamage: 18, baseHealth: 396 },
    'War Axe':   { baseDamage: 16, baseHealth: 352 },
    'Battle Axe':{ baseDamage: 20, baseHealth: 440 },
    Warhammer:   { baseDamage: 22, baseHealth: 484 },
  },
  Glass: {
    Dagger:      { baseDamage: 15, baseHealth: 360 },
    Shortsword:  { baseDamage: 17, baseHealth: 408 },
    Longsword:   { baseDamage: 20, baseHealth: 480 },
    Claymore:    { baseDamage: 22, baseHealth: 528 },
    Mace:        { baseDamage: 20, baseHealth: 480 },
    'War Axe':   { baseDamage: 18, baseHealth: 432 },
    'Battle Axe':{ baseDamage: 22, baseHealth: 528 },
    Warhammer:   { baseDamage: 24, baseHealth: 576 },
  },
  Ebony: {
    Dagger:      { baseDamage: 17, baseHealth: 442 },
    Shortsword:  { baseDamage: 19, baseHealth: 494 },
    Longsword:   { baseDamage: 22, baseHealth: 572 },
    Claymore:    { baseDamage: 24, baseHealth: 624 },
    Mace:        { baseDamage: 22, baseHealth: 572 },
    'War Axe':   { baseDamage: 20, baseHealth: 520 },
    'Battle Axe':{ baseDamage: 24, baseHealth: 624 },
    Warhammer:   { baseDamage: 26, baseHealth: 676 },
  },
  Daedric: {
    Dagger:      { baseDamage: 19, baseHealth: 532 },
    Shortsword:  { baseDamage: 21, baseHealth: 588 },
    Longsword:   { baseDamage: 24, baseHealth: 672 },
    Claymore:    { baseDamage: 26, baseHealth: 728 },
    Mace:        { baseDamage: 24, baseHealth: 672 },
    'War Axe':   { baseDamage: 22, baseHealth: 616 },
    'Battle Axe':{ baseDamage: 26, baseHealth: 728 },
    Warhammer:   { baseDamage: 28, baseHealth: 784 },
  },
};

/** Look up a preset by material + subtype. Returns null if not found. */
export function getPreset(
  material: WeaponMaterial,
  subtype: WeaponSubtype,
): WeaponPreset | null {
  const data = PRESET_DATA[material]?.[subtype];
  if (!data) return null;
  return {
    material,
    subtype,
    weaponType: subtypeToWeaponType(subtype),
    baseDamage: data.baseDamage,
    baseHealth: data.baseHealth,
    bypassesResistance: materialBypassesResistance(material),
  };
}

// ---------------------------------------------------------------------------
// Bow presets
// All bows bypass Resist Normal Weapons regardless of material (per UESP).
// Values verified against https://en.uesp.net/wiki/Oblivion:Weapons
// ---------------------------------------------------------------------------

export interface BowPreset {
  material: WeaponMaterial;
  baseDamage: number;
  baseHealth: number;
}

export const BOW_PRESET_DATA: Record<WeaponMaterial, BowPreset> = {
  Iron:    { material: 'Iron',    baseDamage:  8, baseHealth: 112 },
  Steel:   { material: 'Steel',   baseDamage:  9, baseHealth: 144 },
  Silver:  { material: 'Silver',  baseDamage: 10, baseHealth: 180 },
  Dwarven: { material: 'Dwarven', baseDamage: 12, baseHealth: 220 },
  Elven:   { material: 'Elven',   baseDamage: 14, baseHealth: 264 },
  Glass:   { material: 'Glass',   baseDamage: 16, baseHealth: 312 },
  Ebony:   { material: 'Ebony',   baseDamage: 18, baseHealth: 364 },
  Daedric: { material: 'Daedric', baseDamage: 20, baseHealth: 420 },
};

export function getBowPreset(material: WeaponMaterial): BowPreset {
  return BOW_PRESET_DATA[material];
}

// ---------------------------------------------------------------------------
// Arrow presets
// Arrows have no condition/health — they are consumed on use.
// Values verified against https://en.uesp.net/wiki/Oblivion:Weapons
// ---------------------------------------------------------------------------

export interface ArrowPreset {
  material: WeaponMaterial;
  baseDamage: number;
}

export const ARROW_PRESET_DATA: Record<WeaponMaterial, ArrowPreset> = {
  Iron:    { material: 'Iron',    baseDamage:  8 },
  Steel:   { material: 'Steel',   baseDamage:  9 },
  Silver:  { material: 'Silver',  baseDamage: 10 },
  Dwarven: { material: 'Dwarven', baseDamage: 11 },
  Elven:   { material: 'Elven',   baseDamage: 12 },
  Glass:   { material: 'Glass',   baseDamage: 13 },
  Ebony:   { material: 'Ebony',   baseDamage: 14 },
  Daedric: { material: 'Daedric', baseDamage: 15 },
};

export function getArrowPreset(material: WeaponMaterial): ArrowPreset {
  return ARROW_PRESET_DATA[material];
}
