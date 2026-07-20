/**
 * Oblivion Damage Formulas
 * Based on: https://en.uesp.net/wiki/Oblivion:The_Complete_Damage_Formula
 */

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** Clamp a value between min and max (inclusive). */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ---------------------------------------------------------------------------
// Weapon Damage
// ---------------------------------------------------------------------------

export type WeaponType = 'Blade' | 'Blunt' | 'Bow';

export interface WeaponDamageInputs {
  weaponType: WeaponType;
  baseWeaponDamage: number;
  /** Bow: add bow WR + arrow WR — handled externally; just pass base of each */
  /** For bows this is the sum of bow + arrow base damage. */
  attribute: number; // Strength (melee) or Agility (bows), clamped 0–100
  skill: number; // Blade / Blunt / Marksman, clamped 0–100 (includes fortify effects)
  luck: number; // clamped 0–100 (includes fortify effects)
  weaponHealth: number; // current weapon condition (0–max)
  baseWeaponHealth: number; // max weapon condition (must be > 0)
  currentFatigue: number; // current fatigue (0–maxFatigue)
  maxFatigue: number; // max fatigue (must be > 0)
  isSneaking: boolean;
  sneakSkill: number; // 0–100, used for sneak multiplier tier
  isTwoHanded: boolean; // two-handed weapons receive no sneak attack bonus
  isPowerAttack: boolean;
  powerAttackType: 'normal' | 'standing'; // standing = apprentice perk, 3×
  hasMasterSneakPerk: boolean; // bypasses opponent armor rating
  combinedArmorRating: number; // 0–85 (capped at 85)
  normalWeaponResistance: number; // 0–100 %
  isSilverDaedricOrEnchanted: boolean; // if true, weapon resistance = 1
}

export interface WeaponDamageResult {
  modifiedSkill: number;
  weaponRating: number;
  fatigueModifier: number;
  sneakMultiplier: number;
  powerAttackMultiplier: number;
  appliedMultiplier: number; // max(sneak, power)
  opponentArmorRating: number;
  opponentWeaponResistance: number;
  finalDamage: number;
}

/** ModifiedSkill = Skill + 0.4 * (Luck - 50), clamped 0–100 */
export function calcModifiedSkill(skill: number, luck: number): number {
  return clamp(skill + 0.4 * (luck - 50), 0, 100);
}

/**
 * WeaponRating = BaseWeaponDamage * (150 + Attribute) *
 *               (40 + ModifiedSkill * 3) * (WeaponHealth / BaseWeaponHealth + 1) / 160000
 */
export function calcWeaponRating(
  baseWeaponDamage: number,
  attribute: number,
  modifiedSkill: number,
  weaponHealth: number,
  baseWeaponHealth: number,
): number {
  const attr = clamp(attribute, 0, 100);
  const ms = clamp(modifiedSkill, 0, 100);
  const conditionRatio = baseWeaponHealth > 0 ? weaponHealth / baseWeaponHealth : 1;
  return (baseWeaponDamage * (150 + attr) * (40 + ms * 3) * (conditionRatio + 1)) / 160000;
}

/**
 * FatigueModifier = (Fatigue / MaxFatigue + 1) / 2
 * Minimum 0.5 (fatigue = 0). No upper cap — if Fatigue > MaxFatigue the modifier exceeds 1.0.
 * This is intentional: reducing MaxFatigue below current fatigue increases damage output.
 */
export function calcFatigueModifier(currentFatigue: number, maxFatigue: number): number {
  if (maxFatigue <= 0) return 0.5;
  return (Math.max(0, currentFatigue) / maxFatigue + 1) / 2;
}

/**
 * SneakMultiplier for weapon attacks.
 * Only applies when sneaking and undetected.
 * One-handed melee / H2H: 4 (skill 0-24) or 6 (skill 25+)
 * Bow:                    2 (skill 0-24) or 3 (skill 25+)
 * Two-handed melee:       1 (no sneak bonus)
 * Returns 1 if not sneaking.
 */
export function calcSneakMultiplier(
  isSneaking: boolean,
  sneakSkill: number,
  isBow: boolean,
  isTwoHanded = false,
): number {
  if (!isSneaking) return 1;
  if (isTwoHanded) return 1;
  if (isBow) return sneakSkill >= 25 ? 3 : 2;
  return sneakSkill >= 25 ? 6 : 4;
}

/**
 * PowerAttackMultiplier:
 * normal power attack = 2.5
 * standing power attack (apprentice+) = 3
 * Returns 1 if not a power attack.
 */
export function calcPowerAttackMultiplier(
  isPowerAttack: boolean,
  attackType: 'normal' | 'standing',
): number {
  if (!isPowerAttack) return 1;
  return attackType === 'standing' ? 3 : 2.5;
}

/**
 * OpponentArmorRating:
 * = 1 if attacker has Master Sneak perk and is sneaking undetected,
 * otherwise (100 - CombinedArmorRating) / 100
 * CombinedArmorRating is capped at 85.
 */
export function calcOpponentArmorRating(
  combinedArmorRating: number,
  hasMasterSneakPerk: boolean,
  isSneaking: boolean,
): number {
  if (hasMasterSneakPerk && isSneaking) return 1;
  const cappedAR = clamp(combinedArmorRating, 0, 85);
  return (100 - cappedAR) / 100;
}

/**
 * OpponentWeaponResistance:
 * = 1 if Silver/Daedric/Enchanted weapon,
 * otherwise (100 - NormalWeaponResistance) / 100
 */
export function calcOpponentWeaponResistance(
  normalWeaponResistance: number,
  isSilverDaedricOrEnchanted: boolean,
): number {
  if (isSilverDaedricOrEnchanted) return 1;
  return (100 - clamp(normalWeaponResistance, 0, 100)) / 100;
}

/**
 * Final weapon damage:
 * Damage = WeaponRating * FatigueModifier * max(SneakMultiplier, PowerAttackMultiplier)
 *          * OpponentArmorRating * OpponentWeaponResistance
 */
export function calcWeaponDamage(inputs: WeaponDamageInputs): WeaponDamageResult {
  const modifiedSkill = calcModifiedSkill(
    clamp(inputs.skill, 0, 100),
    clamp(inputs.luck, 0, 100),
  );

  const weaponRating = calcWeaponRating(
    inputs.baseWeaponDamage,
    inputs.attribute,
    modifiedSkill,
    inputs.weaponHealth,
    inputs.baseWeaponHealth,
  );

  const fatigueModifier = calcFatigueModifier(inputs.currentFatigue, inputs.maxFatigue);

  const sneakMultiplier = calcSneakMultiplier(
    inputs.isSneaking,
    inputs.sneakSkill,
    inputs.weaponType === 'Bow',
    inputs.isTwoHanded,
  );

  const powerAttackMultiplier = calcPowerAttackMultiplier(
    inputs.isPowerAttack,
    inputs.powerAttackType,
  );

  // Only the higher multiplier applies (sneak vs power attack)
  const appliedMultiplier = Math.max(sneakMultiplier, powerAttackMultiplier);

  const opponentArmorRating = calcOpponentArmorRating(
    inputs.combinedArmorRating,
    inputs.hasMasterSneakPerk,
    inputs.isSneaking,
  );

  const opponentWeaponResistance = calcOpponentWeaponResistance(
    inputs.normalWeaponResistance,
    inputs.isSilverDaedricOrEnchanted,
  );

  const finalDamage =
    weaponRating * fatigueModifier * appliedMultiplier * opponentArmorRating * opponentWeaponResistance;

  return {
    modifiedSkill,
    weaponRating,
    fatigueModifier,
    sneakMultiplier,
    powerAttackMultiplier,
    appliedMultiplier,
    opponentArmorRating,
    opponentWeaponResistance,
    finalDamage,
  };
}

// ---------------------------------------------------------------------------
// Hand to Hand Damage
// ---------------------------------------------------------------------------

export interface HandToHandInputs {
  strength: number; // 0–100
  skill: number; // Hand to Hand skill, 0–100 (includes fortify effects)
  luck: number; // 0–100 (includes fortify effects)
  currentFatigue: number;
  maxFatigue: number;
  isSneaking: boolean;
  sneakSkill: number; // 0–100, determines sneak multiplier tier
  isPowerAttack: boolean;
  powerAttackType: 'normal' | 'standing';
}

export interface HandToHandResult {
  modifiedSkill: number;
  baseHealthDamage: number;
  fatigueModifier: number;
  sneakMultiplier: number;
  powerAttackMultiplier: number;
  appliedMultiplier: number; // max(sneak, power) — only the higher applies
  finalHealthDamage: number;
  finalFatigueDamage: number;
}

/**
 * Health_Damage = 1 + 10.5 * (Strength / 100) * (ModifiedSkill / 100)
 * (vanilla game formula with fHandHealthMin=1, fHandHealthMax=15,
 *  fHandDamageStrengthBase=0, fHandDamageStrengthMult=0.75,
 *  fHandDamageSkillBase=0, fHandDamageSkillMult=1 applied)
 *
 * Full form: 1 + (15-1) * (0 + Strength/100 * 0.75) * (0 + ModifiedSkill/100 * 1)
 *          = 1 + 14 * 0.75 * Strength/100 * ModifiedSkill/100
 *          = 1 + 10.5 * (Strength/100) * (ModifiedSkill/100)
 */
export function calcHandToHandDamage(inputs: HandToHandInputs): HandToHandResult {
  const modifiedSkill = calcModifiedSkill(
    clamp(inputs.skill, 0, 100),
    clamp(inputs.luck, 0, 100),
  );

  const str = clamp(inputs.strength, 0, 100);
  const baseHealthDamage = 1 + 10.5 * (str / 100) * (modifiedSkill / 100);

  const fatigueModifier = calcFatigueModifier(inputs.currentFatigue, inputs.maxFatigue);

  // H2H gets the same sneak multiplier as one-handed weapons (4× Novice, 6× Apprentice+)
  const sneakMultiplier = calcSneakMultiplier(
    inputs.isSneaking,
    inputs.sneakSkill,
    false, // not a bow
    false, // not two-handed
  );

  const powerAttackMultiplier = calcPowerAttackMultiplier(
    inputs.isPowerAttack,
    inputs.powerAttackType,
  );

  // Only the higher of sneak or power attack applies
  const appliedMultiplier = Math.max(sneakMultiplier, powerAttackMultiplier);

  // Damage is modified by fatigue and the applied attack multiplier
  const finalHealthDamage = baseHealthDamage * fatigueModifier * appliedMultiplier;

  // Fatigue_Damage = 1 + 0.5 * Health_Damage
  const finalFatigueDamage = 1 + 0.5 * finalHealthDamage;

  return {
    modifiedSkill,
    baseHealthDamage,
    fatigueModifier,
    sneakMultiplier,
    powerAttackMultiplier,
    appliedMultiplier,
    finalHealthDamage,
    finalFatigueDamage,
  };
}

// ---------------------------------------------------------------------------
// Spell Damage
// ---------------------------------------------------------------------------

export interface SpellDamageInputs {
  originalMagnitude: number; // base magnitude from spell
  magicResistance: number; // 0–100 %
  magicWeakness: number; // 0–100 %
  isElemental: boolean;
  elementalResistance: number; // 0–100 % (fire/frost/shock resist)
  elementalWeakness: number; // 0–100 % (fire/frost/shock weakness)
}

export interface SpellDamageResult {
  afterMagicResist: number; // intermediate after magic resist/weakness
  elementalMultiplier: number | null; // null if not elemental
  finalMagnitude: number;
  isResisted: boolean; // true if elemental multiplier <= 0
}

/**
 * Spell magnitude after magic resistance/weakness:
 * OriginalEffectMagnitude * (100 - MagicResistance + MagicWeakness) / 100
 *
 * Then for elemental effects, multiply by:
 * (100 - ElementalResistance + ElementalWeakness) / 100
 * If this multiplier <= 0, the effect is resisted.
 */
export function calcSpellDamage(inputs: SpellDamageInputs): SpellDamageResult {
  const magicFactor =
    (100 - clamp(inputs.magicResistance, 0, 100) + clamp(inputs.magicWeakness, 0, 100)) / 100;

  const afterMagicResist = inputs.originalMagnitude * magicFactor;

  if (!inputs.isElemental) {
    return {
      afterMagicResist,
      elementalMultiplier: null,
      finalMagnitude: afterMagicResist,
      isResisted: false,
    };
  }

  const elementalMultiplier =
    (100 - clamp(inputs.elementalResistance, 0, 100) + clamp(inputs.elementalWeakness, 0, 100)) /
    100;

  const isResisted = elementalMultiplier <= 0;
  const finalMagnitude = isResisted ? 0 : afterMagicResist * elementalMultiplier;

  return {
    afterMagicResist,
    elementalMultiplier,
    finalMagnitude,
    isResisted,
  };
}
