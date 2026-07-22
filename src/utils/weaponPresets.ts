/**
 * Weapon preset data sourced from the UESP wiki.
 * https://en.uesp.net/wiki/Oblivion:Weapons
 * https://en.uesp.net/wiki/Shivering:Amber_Weapons
 * https://en.uesp.net/wiki/Shivering:Madness_Weapons
 *
 * Each entry contains:
 *   baseDamage  — the BaseWeaponDamage value used in the damage formula
 *   baseHealth  — the maximum weapon condition (BaseWeaponHealth)
 */

import { type WeaponType } from '@/utils/damageFormulas';

export type WeaponMaterial =
  // Base game materials
  | 'Iron'
  | 'Steel'
  | 'Silver'
  | 'Dwarven'
  | 'Elven'
  | 'Glass'
  | 'Ebony'
  | 'Daedric'
  // Shivering Isles — Amber (Manic, levels 1-2 through 23+)
  | 'Amber (Impure)'
  | 'Amber (Unpolished)'
  | 'Amber (Lesser)'
  | 'Amber'
  | 'Amber (Fine)'
  | 'Amber (Very Fine)'
  | 'Amber (Grand)'
  | 'Amber (Perfect)'
  // Shivering Isles — Madness (Demented, levels 1-2 through 23+)
  | 'Madness (Impure)'
  | 'Madness (Unpolished)'
  | 'Madness (Lesser)'
  | 'Madness'
  | 'Madness (Fine)'
  | 'Madness (Very Fine)'
  | 'Madness (Grand)'
  | 'Madness (Perfect)';

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
  /** Silver and Daedric bypass Resist Normal Weapons; Amber/Madness do not */
  bypassesResistance: boolean;
}

export const BASE_MATERIALS: WeaponMaterial[] = [
  'Iron',
  'Steel',
  'Silver',
  'Dwarven',
  'Elven',
  'Glass',
  'Ebony',
  'Daedric',
];

export const AMBER_MATERIALS: WeaponMaterial[] = [
  'Amber (Impure)',
  'Amber (Unpolished)',
  'Amber (Lesser)',
  'Amber',
  'Amber (Fine)',
  'Amber (Very Fine)',
  'Amber (Grand)',
  'Amber (Perfect)',
];

export const MADNESS_MATERIALS: WeaponMaterial[] = [
  'Madness (Impure)',
  'Madness (Unpolished)',
  'Madness (Lesser)',
  'Madness',
  'Madness (Fine)',
  'Madness (Very Fine)',
  'Madness (Grand)',
  'Madness (Perfect)',
];

export const MATERIALS: WeaponMaterial[] = [
  ...BASE_MATERIALS,
  ...AMBER_MATERIALS,
  ...MADNESS_MATERIALS,
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

// Amber weapons: Sword (Longsword), Mace, Hammer (Warhammer)
export const AMBER_BLADE_SUBTYPES: WeaponSubtype[] = ['Longsword'];
export const AMBER_BLUNT_SUBTYPES: WeaponSubtype[] = ['Mace', 'Warhammer'];

// Madness weapons: Longsword, Claymore, War Axe
export const MADNESS_BLADE_SUBTYPES: WeaponSubtype[] = ['Longsword', 'Claymore'];
export const MADNESS_BLUNT_SUBTYPES: WeaponSubtype[] = ['War Axe'];

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

/** Returns true for any Amber (Shivering Isles — Manic) material */
export function isAmberMaterial(material: WeaponMaterial): boolean {
  return (AMBER_MATERIALS as string[]).includes(material);
}

/** Returns true for any Madness (Shivering Isles — Demented) material */
export function isMadnessMaterial(material: WeaponMaterial): boolean {
  return (MADNESS_MATERIALS as string[]).includes(material);
}

/** Returns true for any Shivering Isles material (Amber or Madness) */
export function isSIMaterial(material: WeaponMaterial): boolean {
  return isAmberMaterial(material) || isMadnessMaterial(material);
}

/**
 * Returns the valid melee WeaponSubtypes for a given material.
 * Base game materials support all subtypes; Amber/Madness are limited.
 */
export function getAvailableBladeSubtypes(material: WeaponMaterial): WeaponSubtype[] {
  if (isAmberMaterial(material)) return AMBER_BLADE_SUBTYPES;
  if (isMadnessMaterial(material)) return MADNESS_BLADE_SUBTYPES;
  return BLADE_SUBTYPES;
}

export function getAvailableBluntSubtypes(material: WeaponMaterial): WeaponSubtype[] {
  if (isAmberMaterial(material)) return AMBER_BLUNT_SUBTYPES;
  if (isMadnessMaterial(material)) return MADNESS_BLUNT_SUBTYPES;
  return BLUNT_SUBTYPES;
}

// ---------------------------------------------------------------------------
// Data table — (material, subtype) → { baseDamage, baseHealth }
// Base game values verified against https://en.uesp.net/wiki/Oblivion:Weapons
// SI values verified against https://en.uesp.net/wiki/Shivering:Amber_Weapons
//                        and https://en.uesp.net/wiki/Shivering:Madness_Weapons
// ---------------------------------------------------------------------------

type PresetData = Record<WeaponMaterial, Partial<Record<WeaponSubtype, { baseDamage: number; baseHealth: number }>>>;

export const PRESET_DATA: PresetData = {
  Iron: {
    Dagger:        { baseDamage:  5, baseHealth:  70 },
    Shortsword:    { baseDamage:  7, baseHealth:  98 },
    Longsword:     { baseDamage: 10, baseHealth: 140 },
    Claymore:      { baseDamage: 12, baseHealth: 138 },
    Mace:          { baseDamage: 10, baseHealth: 140 },
    'War Axe':     { baseDamage:  8, baseHealth: 112 },
    'Battle Axe':  { baseDamage: 12, baseHealth: 168 },
    Warhammer:     { baseDamage: 14, baseHealth: 196 },
  },
  Steel: {
    Dagger:        { baseDamage:  7, baseHealth: 112 },
    Shortsword:    { baseDamage:  9, baseHealth: 144 },
    Longsword:     { baseDamage: 12, baseHealth: 192 },
    Claymore:      { baseDamage: 14, baseHealth: 224 },
    Mace:          { baseDamage: 12, baseHealth: 192 },
    'War Axe':     { baseDamage: 10, baseHealth: 160 },
    'Battle Axe':  { baseDamage: 14, baseHealth: 224 },
    Warhammer:     { baseDamage: 16, baseHealth: 256 },
  },
  Silver: {
    Dagger:        { baseDamage:  9, baseHealth: 162 },
    Shortsword:    { baseDamage: 11, baseHealth: 198 },
    Longsword:     { baseDamage: 14, baseHealth: 252 },
    Claymore:      { baseDamage: 16, baseHealth: 288 },
    Mace:          { baseDamage: 14, baseHealth: 252 },
    'War Axe':     { baseDamage: 12, baseHealth: 216 },
    'Battle Axe':  { baseDamage: 16, baseHealth: 288 },
    Warhammer:     { baseDamage: 18, baseHealth: 324 },
  },
  Dwarven: {
    Dagger:        { baseDamage: 11, baseHealth: 220 },
    Shortsword:    { baseDamage: 13, baseHealth: 260 },
    Longsword:     { baseDamage: 16, baseHealth: 320 },
    Claymore:      { baseDamage: 18, baseHealth: 360 },
    Mace:          { baseDamage: 16, baseHealth: 320 },
    'War Axe':     { baseDamage: 14, baseHealth: 280 },
    'Battle Axe':  { baseDamage: 18, baseHealth: 360 },
    Warhammer:     { baseDamage: 20, baseHealth: 400 },
  },
  Elven: {
    Dagger:        { baseDamage: 13, baseHealth: 286 },
    Shortsword:    { baseDamage: 15, baseHealth: 330 },
    Longsword:     { baseDamage: 18, baseHealth: 396 },
    Claymore:      { baseDamage: 20, baseHealth: 440 },
    Mace:          { baseDamage: 18, baseHealth: 396 },
    'War Axe':     { baseDamage: 16, baseHealth: 352 },
    'Battle Axe':  { baseDamage: 20, baseHealth: 440 },
    Warhammer:     { baseDamage: 22, baseHealth: 484 },
  },
  Glass: {
    Dagger:        { baseDamage: 15, baseHealth: 360 },
    Shortsword:    { baseDamage: 17, baseHealth: 408 },
    Longsword:     { baseDamage: 20, baseHealth: 480 },
    Claymore:      { baseDamage: 22, baseHealth: 528 },
    Mace:          { baseDamage: 20, baseHealth: 480 },
    'War Axe':     { baseDamage: 18, baseHealth: 432 },
    'Battle Axe':  { baseDamage: 22, baseHealth: 528 },
    Warhammer:     { baseDamage: 24, baseHealth: 576 },
  },
  Ebony: {
    Dagger:        { baseDamage: 17, baseHealth: 442 },
    Shortsword:    { baseDamage: 19, baseHealth: 494 },
    Longsword:     { baseDamage: 22, baseHealth: 572 },
    Claymore:      { baseDamage: 24, baseHealth: 624 },
    Mace:          { baseDamage: 22, baseHealth: 572 },
    'War Axe':     { baseDamage: 20, baseHealth: 520 },
    'Battle Axe':  { baseDamage: 24, baseHealth: 624 },
    Warhammer:     { baseDamage: 26, baseHealth: 676 },
  },
  Daedric: {
    Dagger:        { baseDamage: 19, baseHealth: 532 },
    Shortsword:    { baseDamage: 21, baseHealth: 588 },
    Longsword:     { baseDamage: 24, baseHealth: 672 },
    Claymore:      { baseDamage: 26, baseHealth: 728 },
    Mace:          { baseDamage: 24, baseHealth: 672 },
    'War Axe':     { baseDamage: 22, baseHealth: 616 },
    'Battle Axe':  { baseDamage: 26, baseHealth: 728 },
    Warhammer:     { baseDamage: 28, baseHealth: 784 },
  },

  // ---------------------------------------------------------------------------
  // Shivering Isles — Amber weapons (Manic faction)
  // Subtypes: Longsword (Amber Sword), Mace (Amber Mace), Warhammer (Amber Hammer)
  // Source: https://en.uesp.net/wiki/Shivering:Amber_Weapons
  // ---------------------------------------------------------------------------
  'Amber (Impure)': {
    Longsword:  { baseDamage: 11, baseHealth: 165 },
    Mace:       { baseDamage: 11, baseHealth: 165 },
    Warhammer:  { baseDamage: 15, baseHealth: 225 },
  },
  'Amber (Unpolished)': {
    Longsword:  { baseDamage: 13, baseHealth: 220 },
    Mace:       { baseDamage: 13, baseHealth: 220 },
    Warhammer:  { baseDamage: 17, baseHealth: 290 },
  },
  'Amber (Lesser)': {
    Longsword:  { baseDamage: 15, baseHealth: 285 },
    Mace:       { baseDamage: 15, baseHealth: 285 },
    Warhammer:  { baseDamage: 19, baseHealth: 360 },
  },
  Amber: {
    Longsword:  { baseDamage: 17, baseHealth: 360 },
    Mace:       { baseDamage: 17, baseHealth: 360 },
    Warhammer:  { baseDamage: 21, baseHealth: 440 },
  },
  'Amber (Fine)': {
    Longsword:  { baseDamage: 19, baseHealth: 440 },
    Mace:       { baseDamage: 19, baseHealth: 440 },
    Warhammer:  { baseDamage: 23, baseHealth: 530 },
  },
  'Amber (Very Fine)': {
    Longsword:  { baseDamage: 21, baseHealth: 525 },
    Mace:       { baseDamage: 21, baseHealth: 525 },
    Warhammer:  { baseDamage: 25, baseHealth: 625 },
  },
  'Amber (Grand)': {
    Longsword:  { baseDamage: 23, baseHealth: 620 },
    Mace:       { baseDamage: 23, baseHealth: 620 },
    Warhammer:  { baseDamage: 27, baseHealth: 730 },
  },
  'Amber (Perfect)': {
    Longsword:  { baseDamage: 25, baseHealth: 720 },
    Mace:       { baseDamage: 25, baseHealth: 720 },
    Warhammer:  { baseDamage: 29, baseHealth: 840 },
  },

  // ---------------------------------------------------------------------------
  // Shivering Isles — Madness weapons (Demented faction)
  // Subtypes: Longsword (Madness Longsword), Claymore (Madness Claymore), War Axe (Madness War Axe)
  // Source: https://en.uesp.net/wiki/Shivering:Madness_Weapons
  // ---------------------------------------------------------------------------
  'Madness (Impure)': {
    Longsword:  { baseDamage: 11, baseHealth: 165 },
    Claymore:   { baseDamage: 13, baseHealth: 195 },
    'War Axe':  { baseDamage:  9, baseHealth: 135 },
  },
  'Madness (Unpolished)': {
    Longsword:  { baseDamage: 13, baseHealth: 220 },
    Claymore:   { baseDamage: 15, baseHealth: 255 },
    'War Axe':  { baseDamage: 11, baseHealth: 190 },
  },
  'Madness (Lesser)': {
    Longsword:  { baseDamage: 15, baseHealth: 285 },
    Claymore:   { baseDamage: 17, baseHealth: 325 },
    'War Axe':  { baseDamage: 13, baseHealth: 250 },
  },
  Madness: {
    Longsword:  { baseDamage: 17, baseHealth: 360 },
    Claymore:   { baseDamage: 19, baseHealth: 400 },
    'War Axe':  { baseDamage: 15, baseHealth: 315 },
  },
  'Madness (Fine)': {
    Longsword:  { baseDamage: 19, baseHealth: 440 },
    Claymore:   { baseDamage: 21, baseHealth: 485 },
    'War Axe':  { baseDamage: 17, baseHealth: 390 },
  },
  'Madness (Very Fine)': {
    Longsword:  { baseDamage: 21, baseHealth: 525 },
    Claymore:   { baseDamage: 23, baseHealth: 575 },
    'War Axe':  { baseDamage: 19, baseHealth: 475 },
  },
  'Madness (Grand)': {
    Longsword:  { baseDamage: 23, baseHealth: 620 },
    Claymore:   { baseDamage: 25, baseHealth: 675 },
    'War Axe':  { baseDamage: 21, baseHealth: 570 },
  },
  'Madness (Perfect)': {
    Longsword:  { baseDamage: 25, baseHealth: 720 },
    Claymore:   { baseDamage: 27, baseHealth: 780 },
    'War Axe':  { baseDamage: 23, baseHealth: 665 },
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
// Base game values verified against https://en.uesp.net/wiki/Oblivion:Weapons
// SI values verified against https://en.uesp.net/wiki/Shivering:Amber_Weapons
//                        and https://en.uesp.net/wiki/Shivering:Madness_Weapons
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
  // Amber bows (Shivering Isles)
  'Amber (Impure)':    { material: 'Amber (Impure)',    baseDamage:  9, baseHealth: 130 },
  'Amber (Unpolished)':{ material: 'Amber (Unpolished)',baseDamage: 10, baseHealth: 160 },
  'Amber (Lesser)':    { material: 'Amber (Lesser)',    baseDamage: 11, baseHealth: 200 },
  'Amber':             { material: 'Amber',             baseDamage: 13, baseHealth: 240 },
  'Amber (Fine)':      { material: 'Amber (Fine)',      baseDamage: 15, baseHealth: 290 },
  'Amber (Very Fine)': { material: 'Amber (Very Fine)', baseDamage: 17, baseHealth: 340 },
  'Amber (Grand)':     { material: 'Amber (Grand)',     baseDamage: 19, baseHealth: 390 },
  'Amber (Perfect)':   { material: 'Amber (Perfect)',   baseDamage: 21, baseHealth: 450 },
  // Madness bows (Shivering Isles)
  'Madness (Impure)':    { material: 'Madness (Impure)',    baseDamage:  9, baseHealth: 130 },
  'Madness (Unpolished)':{ material: 'Madness (Unpolished)',baseDamage: 10, baseHealth: 160 },
  'Madness (Lesser)':    { material: 'Madness (Lesser)',    baseDamage: 11, baseHealth: 200 },
  'Madness':             { material: 'Madness',             baseDamage: 13, baseHealth: 240 },
  'Madness (Fine)':      { material: 'Madness (Fine)',      baseDamage: 15, baseHealth: 290 },
  'Madness (Very Fine)': { material: 'Madness (Very Fine)', baseDamage: 17, baseHealth: 340 },
  'Madness (Grand)':     { material: 'Madness (Grand)',     baseDamage: 19, baseHealth: 390 },
  'Madness (Perfect)':   { material: 'Madness (Perfect)',   baseDamage: 21, baseHealth: 450 },
};

export function getBowPreset(material: WeaponMaterial): BowPreset {
  return BOW_PRESET_DATA[material];
}

// ---------------------------------------------------------------------------
// Arrow presets
// Arrows have no condition/health — they are consumed on use.
// Base game values verified against https://en.uesp.net/wiki/Oblivion:Weapons
// SI values verified against https://en.uesp.net/wiki/Shivering:Amber_Weapons
//                        and https://en.uesp.net/wiki/Shivering:Madness_Weapons
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
  // Amber arrows (Shivering Isles)
  'Amber (Impure)':    { material: 'Amber (Impure)',    baseDamage:  9 },
  'Amber (Unpolished)':{ material: 'Amber (Unpolished)',baseDamage: 10 },
  'Amber (Lesser)':    { material: 'Amber (Lesser)',    baseDamage: 11 },
  'Amber':             { material: 'Amber',             baseDamage: 12 },
  'Amber (Fine)':      { material: 'Amber (Fine)',      baseDamage: 13 },
  'Amber (Very Fine)': { material: 'Amber (Very Fine)', baseDamage: 14 },
  'Amber (Grand)':     { material: 'Amber (Grand)',     baseDamage: 15 },
  'Amber (Perfect)':   { material: 'Amber (Perfect)',   baseDamage: 16 },
  // Madness arrows (Shivering Isles)
  'Madness (Impure)':    { material: 'Madness (Impure)',    baseDamage:  9 },
  'Madness (Unpolished)':{ material: 'Madness (Unpolished)',baseDamage: 10 },
  'Madness (Lesser)':    { material: 'Madness (Lesser)',    baseDamage: 11 },
  'Madness':             { material: 'Madness',             baseDamage: 12 },
  'Madness (Fine)':      { material: 'Madness (Fine)',      baseDamage: 13 },
  'Madness (Very Fine)': { material: 'Madness (Very Fine)', baseDamage: 14 },
  'Madness (Grand)':     { material: 'Madness (Grand)',     baseDamage: 15 },
  'Madness (Perfect)':   { material: 'Madness (Perfect)',   baseDamage: 16 },
};

export function getArrowPreset(material: WeaponMaterial): ArrowPreset {
  return ARROW_PRESET_DATA[material];
}
