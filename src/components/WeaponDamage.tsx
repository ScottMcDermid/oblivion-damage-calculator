'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import {
  Divider,
  FormControl,
  FormControlLabel,
  ListSubheader,
  MenuItem,
  Select,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from '@mui/material';

import StatInput from '@/components/StatInput';
import ResultDisplay from '@/components/ResultDisplay';
import { calcWeaponDamage, type WeaponType } from '@/utils/damageFormulas';
import {
  BASE_MATERIALS,
  AMBER_MATERIALS,
  MADNESS_MATERIALS,
  getAvailableBladeSubtypes,
  getAvailableBluntSubtypes,
  getPreset,
  getBowPreset,
  getArrowPreset,
  subtypeIsTwoHanded,
  materialBypassesResistance,
  isSIMaterial,
  type WeaponMaterial,
  type WeaponSubtype,
} from '@/utils/weaponPresets';

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 mt-8 border-t border-[#2e2e2e] pt-4 text-xs font-semibold uppercase tracking-widest text-gray-500 first:mt-0 first:border-0 first:pt-0">
      {children}
    </div>
  );
}

const DEFAULT_BLADE_SUBTYPE: WeaponSubtype = 'Longsword';
const DEFAULT_BLUNT_SUBTYPE: WeaponSubtype = 'Mace';
const DEFAULT_MATERIAL: WeaponMaterial = 'Iron';

interface WeaponDamageProps {
  weaponType: WeaponType;
  // eslint-disable-next-line no-unused-vars
  onWeaponTypeChange: (newType: WeaponType) => void;
  isRemastered: boolean;
  difficultyMultiplier: number;
  isSneaking: boolean;
  // eslint-disable-next-line no-unused-vars
  onSneakingChange: (v: boolean) => void;
  sneakSkill: number;
  // eslint-disable-next-line no-unused-vars
  onSneakSkillChange: (v: number) => void;
  // Shared character stats
  strength: number;
  // eslint-disable-next-line no-unused-vars
  onStrengthChange: (v: number) => void;
  luck: number;
  // eslint-disable-next-line no-unused-vars
  onLuckChange: (v: number) => void;
  currentFatigue: number;
  // eslint-disable-next-line no-unused-vars
  onCurrentFatigueChange: (v: number) => void;
  maxFatigue: number;
  // eslint-disable-next-line no-unused-vars
  onMaxFatigueChange: (v: number) => void;
  // Shared opponent stats
  combinedArmorRating: number;
  // eslint-disable-next-line no-unused-vars
  onCombinedArmorRatingChange: (v: number) => void;
  normalWeaponResistance: number;
  // eslint-disable-next-line no-unused-vars
  onNormalWeaponResistanceChange: (v: number) => void;
}

export default function WeaponDamage({
  weaponType,
  onWeaponTypeChange,
  isRemastered,
  difficultyMultiplier,
  isSneaking,
  onSneakingChange,
  sneakSkill,
  onSneakSkillChange,
  strength,
  onStrengthChange,
  luck,
  onLuckChange,
  currentFatigue,
  onCurrentFatigueChange,
  maxFatigue,
  onMaxFatigueChange,
  combinedArmorRating,
  onCombinedArmorRatingChange,
  normalWeaponResistance,
  onNormalWeaponResistanceChange,
}: WeaponDamageProps) {

  // ── Melee preset state ──
  const [presetSubtype, setPresetSubtype] = useLocalStorage<WeaponSubtype | ''>('odc_presetSubtype', DEFAULT_BLADE_SUBTYPE);
  const [presetMaterial, setPresetMaterial] = useLocalStorage<WeaponMaterial | ''>('odc_presetMaterial', DEFAULT_MATERIAL);

  // ── Bow/arrow preset state ──
  const [presetBowMaterial, setPresetBowMaterial] = useLocalStorage<WeaponMaterial | ''>('odc_presetBowMaterial', DEFAULT_MATERIAL);
  const [presetArrowMaterial, setPresetArrowMaterial] = useLocalStorage<WeaponMaterial | ''>('odc_presetArrowMaterial', DEFAULT_MATERIAL);

  // ── Weapon stats ──
  const [baseWeaponDamage, setBaseWeaponDamage] = useLocalStorage('odc_baseWeaponDamage', getPreset(DEFAULT_MATERIAL, DEFAULT_BLADE_SUBTYPE)?.baseDamage ?? 10);
  const [baseArrowDamage, setBaseArrowDamage] = useLocalStorage('odc_baseArrowDamage', getArrowPreset(DEFAULT_MATERIAL).baseDamage);
  const [weaponConditionPct, setWeaponConditionPct] = useLocalStorage('odc_weaponConditionPct', 100);

  // ── Attacker stats ──
  // strength and luck are shared props (same character); agility is bow-only and stays local
  const [agility, setAgility] = useLocalStorage('odc_agility', 50);
  const [skill, setSkill] = useLocalStorage('odc_weaponSkill', 25);

  // ── Attack modifiers ──
  const [isPowerAttack, setIsPowerAttack] = useLocalStorage('odc_weaponIsPowerAttack', false);
  const [powerAttackType, setPowerAttackType] = useLocalStorage<'normal' | 'standing'>('odc_weaponPowerAttackType', 'normal');

  // ── Opponent ──
  const [isSilverDaedricOrEnchanted, setIsSilverDaedricOrEnchanted] = useLocalStorage('odc_weaponBypassesResistance', false);

  // ── Preset application helpers ──

  const applyMeleePreset = (subtype: WeaponSubtype | '', material: WeaponMaterial | '', resetCondition = true) => {
    // If an SI material is chosen, the subtype may not be valid for it — auto-pick the first valid one
    let resolvedSubtype = subtype;
    if (material && subtype) {
      const availableBlade = getAvailableBladeSubtypes(material);
      const availableBlunt = getAvailableBluntSubtypes(material);
      const allAvailable = [...availableBlade, ...availableBlunt];
      if (allAvailable.length > 0 && !allAvailable.includes(subtype as WeaponSubtype)) {
        // Pick first available subtype for the current weapon type tab
        const isCurBlunt = weaponType === 'Blunt';
        resolvedSubtype = isCurBlunt && availableBlunt.length > 0
          ? availableBlunt[0]
          : availableBlade.length > 0
            ? availableBlade[0]
            : availableBlunt[0] ?? '';
      }
    }
    setPresetSubtype(resolvedSubtype);
    setPresetMaterial(material);
    if (!resolvedSubtype || !material) return;
    const p = getPreset(material, resolvedSubtype as WeaponSubtype);
    if (!p) return;
    setBaseWeaponDamage(p.baseDamage);
    if (resetCondition) setWeaponConditionPct(100);
    onWeaponTypeChange(p.weaponType);
    setIsSilverDaedricOrEnchanted(p.bypassesResistance);
  };

  const applyBowPreset = (
    bowMat: WeaponMaterial,
    arrowMat: WeaponMaterial,
    resetCondition = true,
  ) => {
    const bow = getBowPreset(bowMat);
    const arrow = getArrowPreset(arrowMat);
    setBaseWeaponDamage(bow.baseDamage);
    if (resetCondition) setWeaponConditionPct(100);
    setBaseArrowDamage(arrow.baseDamage);
    // Bypass resistance if either the bow or arrow material is Silver or Daedric
    setIsSilverDaedricOrEnchanted(
      materialBypassesResistance(bowMat) || materialBypassesResistance(arrowMat),
    );
  };

  // ── Reset presets when weaponType prop changes from the top-bar ──
  const prevWeaponType = useRef<WeaponType>(
    (() => {
      if (typeof window === 'undefined') return weaponType;
      try {
        const tab = JSON.parse(
          window.localStorage.getItem('odc_lastWeaponTab') ?? '"blade"',
        ) as 'blade' | 'blunt' | 'bow';
        if (tab === 'blunt') return 'Blunt';
        if (tab === 'bow') return 'Bow';
        return 'Blade';
      } catch {
        return weaponType;
      }
    })()
  );
  useEffect(() => {
    if (weaponType === prevWeaponType.current) return;
    prevWeaponType.current = weaponType;
    if (weaponType === 'Bow') {
      setPresetBowMaterial(DEFAULT_MATERIAL);
      setPresetArrowMaterial(DEFAULT_MATERIAL);
      applyBowPreset(DEFAULT_MATERIAL, DEFAULT_MATERIAL, false);
      setIsSilverDaedricOrEnchanted(false);
    } else {
      const defaultSubtype = weaponType === 'Blunt' ? DEFAULT_BLUNT_SUBTYPE : DEFAULT_BLADE_SUBTYPE;
      setPresetSubtype(defaultSubtype);
      setPresetMaterial(DEFAULT_MATERIAL);
      applyMeleePreset(defaultSubtype, DEFAULT_MATERIAL, false);
    }
  // applyBowPreset and applyMeleePreset are stable (defined in render, but deps are stable state setters)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weaponType]);

  const isBow = weaponType === 'Bow';
  // Two-handed when a preset is active; defaults to false (one-handed) in Custom mode
  const isTwoHanded = !isBow && !!presetSubtype && subtypeIsTwoHanded(presetSubtype as WeaponSubtype);
  // Master Sneak perk (armor bypass) is granted at Sneak = 100
  const hasMasterSneakPerk = isSneaking && sneakSkill >= 100;
  // Use the shared strength prop for melee, local agility for bows
  const attribute = isBow ? agility : strength;
  const attributeLabel = isBow ? 'Agility' : 'Strength';
  const skillLabel =
    weaponType === 'Blade' ? 'Blade Skill' : weaponType === 'Blunt' ? 'Blunt Skill' : 'Marksman Skill';

  const effectiveBaseDamage = isBow ? baseWeaponDamage + baseArrowDamage : baseWeaponDamage;

  const rawResult = useMemo(
    () =>
      calcWeaponDamage({
        weaponType,
        baseWeaponDamage: effectiveBaseDamage,
        attribute,
        skill,
        luck,
        weaponHealth: weaponConditionPct,
        baseWeaponHealth: 100,
        // Remastered: fatigue doesn't affect damage — pass equal values so modifier = 1.0
        currentFatigue: isRemastered ? 1 : currentFatigue,
        maxFatigue: isRemastered ? 1 : Math.max(1, maxFatigue),
        isSneaking,
        sneakSkill,
        isTwoHanded,
        isPowerAttack: isBow ? false : isPowerAttack,
        powerAttackType,
        hasMasterSneakPerk,
        combinedArmorRating,
        normalWeaponResistance,
        isSilverDaedricOrEnchanted,
      }),
    [
      isBow, isTwoHanded, weaponType, effectiveBaseDamage, attribute, skill, luck,
      weaponConditionPct, isRemastered, currentFatigue, maxFatigue,
      isSneaking, sneakSkill, hasMasterSneakPerk, isPowerAttack, powerAttackType,
      combinedArmorRating, normalWeaponResistance, isSilverDaedricOrEnchanted,
    ],
  );

  // Apply difficulty multiplier post-calculation
  const result = useMemo(() => ({
    ...rawResult,
    finalDamage: rawResult.finalDamage * difficultyMultiplier,
  }), [rawResult, difficultyMultiplier]);

  const breakdown = [
    {
      label: 'Modified Skill',
      value: result.modifiedSkill,
      tooltip: 'Skill + 0.4 × (Luck − 50), clamped 0–100',
    },
    {
      label: 'Weapon Rating (WR)',
      value: result.weaponRating,
      tooltip:
        'BaseDamage × (150 + Attribute) × (40 + ModifiedSkill × 3) × (Condition% / 100 + 1) / 160000',
    },
    {
      label: `Fatigue Modifier${isRemastered ? ' (disabled)' : ''}`,
      value: result.fatigueModifier,
      tooltip: isRemastered
        ? 'Fatigue does not affect damage in Oblivion Remastered'
        : '(CurrentFatigue / MaxFatigue + 1) / 2 — minimum 0.5, no upper cap. Current fatigue above max fatigue yields a multiplier > 1.',
    },
    {
      label: `Sneak Multiplier${!isSneaking ? ' (not sneaking)' : ''}`,
      value: result.sneakMultiplier,
      tooltip: isBow
        ? 'Bow: 2× (Sneak 0–24) or 3× (Sneak 25+) while sneaking undetected'
        : isTwoHanded
          ? 'Two-handed weapons receive no sneak attack bonus (always 1×)'
          : 'One-handed: 4× (Sneak 0–24) or 6× (Sneak 25+) while sneaking undetected',
    },
    ...(!isBow ? [
      {
        label: `Power Attack Multiplier${!isPowerAttack ? ' (no power attack)' : ''}`,
        value: result.powerAttackMultiplier,
        tooltip: 'Normal: 2.5×, Standing (Apprentice+): 3×',
      },
      {
        label: 'Applied Multiplier (max of above)',
        value: result.appliedMultiplier,
        tooltip: 'Only the higher of sneak or power attack multiplier applies',
      },
    ] : []),
    {
      label: 'Opponent Armor Rating',
      value: result.opponentArmorRating,
      tooltip:
        hasMasterSneakPerk
          ? 'Sneak = 100 (Master perk) bypasses opponent armor while sneaking (= 1)'
          : '(100 − CombinedArmorRating) / 100, AR capped at 85',
    },
    {
      label: `Weapon Resistance${isSilverDaedricOrEnchanted ? ' (bypassed)' : ''}`,
      value: result.opponentWeaponResistance,
      tooltip:
        'Silver, Daedric, and enchanted weapons bypass Resist Normal Weapons (= 1). Otherwise: (100 − NormalWeaponResistance%) / 100',
    },
    {
      label: `Pre-difficulty Damage`,
      value: rawResult.finalDamage,
      tooltip: 'Damage before difficulty multiplier is applied',
    },
    {
      label: `Difficulty Multiplier${difficultyMultiplier === 1 ? ' (default)' : ''}`,
      value: difficultyMultiplier,
      tooltip: `Adjustable in Settings. ×${difficultyMultiplier.toFixed(3)}`,
    },
    {
      label: 'Final Damage',
      value: result.finalDamage,
      highlight: true,
    },
  ];

  // ── Preset summary helpers ──

  // Shivering Isles weapons have lore names that differ from the generic subtype labels
  const getSIWeaponName = (material: WeaponMaterial, subtype: WeaponSubtype): string => {
    if (isSIMaterial(material)) {
      // Amber: Longsword → Sword, Warhammer → Hammer
      if ((AMBER_MATERIALS as string[]).includes(material)) {
        if (subtype === 'Longsword') return 'Sword';
        if (subtype === 'Warhammer') return 'Hammer';
      }
      // Madness: subtype names match in-game (Longsword, Claymore, War Axe)
    }
    return subtype;
  };

  const meleeSummary = (() => {
    if (!presetSubtype || !presetMaterial) return null;
    const p = getPreset(presetMaterial, presetSubtype as WeaponSubtype);
    if (!p) return null;
    const weaponName = getSIWeaponName(presetMaterial, presetSubtype as WeaponSubtype);
    return {
      label: `${presetMaterial} ${weaponName}`,
      detail: `Base damage: ${p.baseDamage}`,
      warn: p.bypassesResistance,
    };
  })();

  const bowSummary = (() => {
    if (!presetBowMaterial || !presetArrowMaterial) return null;
    const bow = getBowPreset(presetBowMaterial);
    const arrow = getArrowPreset(presetArrowMaterial);
    return {
      label: `${presetBowMaterial} Bow + ${presetArrowMaterial} Arrow`,
      detail: `Base: ${bow.baseDamage} + ${arrow.baseDamage} = ${bow.baseDamage + arrow.baseDamage} combined`,
      isSI: isSIMaterial(presetBowMaterial) || isSIMaterial(presetArrowMaterial),
    };
  })();

  return (
    <div className="flex flex-col gap-0 lg:flex-row lg:gap-8">
      {/* ── Inputs ── */}
      <div className="min-w-0 flex-1 space-y-1">

        <SectionHeading>Weapon</SectionHeading>

        {/* ── Preset selector — melee ── */}
        {!isBow && (
          <>
            <div className="flex flex-wrap items-start gap-3">
              <div>
                <div className="mb-1 text-xs text-gray-500">Weapon</div>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <Select
                    value={presetSubtype}
                    displayEmpty
                    onChange={(e) => applyMeleePreset(e.target.value as WeaponSubtype | '', presetMaterial)}
                    sx={{ fontSize: '0.8rem' }}
                  >
                    <MenuItem value="" sx={{ fontSize: '0.8rem', fontStyle: 'italic', color: 'text.secondary' }}>
                      Custom
                    </MenuItem>
                    <Divider />
                    {(weaponType === 'Blade'
                      ? getAvailableBladeSubtypes(presetMaterial || 'Iron')
                      : getAvailableBluntSubtypes(presetMaterial || 'Iron')
                    ).map((s) => (
                      <MenuItem key={s} value={s} sx={{ fontSize: '0.8rem' }}>{s}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>

              <div>
                <div className="mb-1 text-xs text-gray-500">Material</div>
                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <Select
                    value={presetMaterial}
                    displayEmpty
                    onChange={(e) => applyMeleePreset(presetSubtype, e.target.value as WeaponMaterial | '')}
                    sx={{ fontSize: '0.8rem' }}
                  >
                    <MenuItem value="" sx={{ fontSize: '0.8rem', fontStyle: 'italic', color: 'text.secondary' }}>
                      Custom
                    </MenuItem>
                    <Divider />
                    {BASE_MATERIALS.map((m) => (
                      <MenuItem key={m} value={m} sx={{ fontSize: '0.8rem' }}>{m}</MenuItem>
                    ))}
                    <ListSubheader sx={{ fontSize: '0.7rem', lineHeight: '2rem', color: 'text.disabled' }}>
                      Shivering Isles — Amber
                    </ListSubheader>
                    {AMBER_MATERIALS.map((m) => (
                      <MenuItem key={m} value={m} sx={{ fontSize: '0.8rem' }}>{m}</MenuItem>
                    ))}
                    <ListSubheader sx={{ fontSize: '0.7rem', lineHeight: '2rem', color: 'text.disabled' }}>
                      Shivering Isles — Madness
                    </ListSubheader>
                    {MADNESS_MATERIALS.map((m) => (
                      <MenuItem key={m} value={m} sx={{ fontSize: '0.8rem' }}>{m}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>

              {meleeSummary && (
                <div className="flex flex-col">
                  <div className="mb-1 text-xs text-gray-500 opacity-0 select-none">_</div>
                  <span className="text-xs font-semibold text-yellow-300">{meleeSummary.label}</span>
                  <span className="text-xs text-gray-500">
                    {meleeSummary.detail}
                    {meleeSummary.warn && (
                      <span className="ml-1 text-amber-400">· bypasses resist</span>
                    )}
                  </span>
                </div>
              )}
            </div>
            <Divider sx={{ my: 1.5, borderColor: '#2e2e2e' }} />
          </>
        )}

        {/* ── Preset selector — bow + arrow ── */}
        {isBow && (
          <>
            <div className="flex flex-wrap items-start gap-3">
              <div>
                <div className="mb-1 text-xs text-gray-500">Bow</div>
                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <Select
                    value={presetBowMaterial}
                    displayEmpty
                    onChange={(e) => {
                      const mat = e.target.value as WeaponMaterial | '';
                      setPresetBowMaterial(mat);
                      if (mat && presetArrowMaterial) applyBowPreset(mat, presetArrowMaterial);
                    }}
                    sx={{ fontSize: '0.8rem' }}
                  >
                    <MenuItem value="" sx={{ fontSize: '0.8rem', fontStyle: 'italic', color: 'text.secondary' }}>
                      Custom
                    </MenuItem>
                    <Divider />
                    {BASE_MATERIALS.map((m) => (
                      <MenuItem key={m} value={m} sx={{ fontSize: '0.8rem' }}>{m} Bow</MenuItem>
                    ))}
                    <ListSubheader sx={{ fontSize: '0.7rem', lineHeight: '2rem', color: 'text.disabled' }}>
                      Shivering Isles — Amber
                    </ListSubheader>
                    {AMBER_MATERIALS.map((m) => (
                      <MenuItem key={m} value={m} sx={{ fontSize: '0.8rem' }}>{m} Bow</MenuItem>
                    ))}
                    <ListSubheader sx={{ fontSize: '0.7rem', lineHeight: '2rem', color: 'text.disabled' }}>
                      Shivering Isles — Madness
                    </ListSubheader>
                    {MADNESS_MATERIALS.map((m) => (
                      <MenuItem key={m} value={m} sx={{ fontSize: '0.8rem' }}>{m} Bow</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>

              <div>
                <div className="mb-1 text-xs text-gray-500">Arrow</div>
                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <Select
                    value={presetArrowMaterial}
                    displayEmpty
                    onChange={(e) => {
                      const mat = e.target.value as WeaponMaterial | '';
                      setPresetArrowMaterial(mat);
                      if (presetBowMaterial && mat) applyBowPreset(presetBowMaterial, mat);
                    }}
                    sx={{ fontSize: '0.8rem' }}
                  >
                    <MenuItem value="" sx={{ fontSize: '0.8rem', fontStyle: 'italic', color: 'text.secondary' }}>
                      Custom
                    </MenuItem>
                    <Divider />
                    {BASE_MATERIALS.map((m) => (
                      <MenuItem key={m} value={m} sx={{ fontSize: '0.8rem' }}>{m} Arrow</MenuItem>
                    ))}
                    <ListSubheader sx={{ fontSize: '0.7rem', lineHeight: '2rem', color: 'text.disabled' }}>
                      Shivering Isles — Amber
                    </ListSubheader>
                    {AMBER_MATERIALS.map((m) => (
                      <MenuItem key={m} value={m} sx={{ fontSize: '0.8rem' }}>{m} Arrow</MenuItem>
                    ))}
                    <ListSubheader sx={{ fontSize: '0.7rem', lineHeight: '2rem', color: 'text.disabled' }}>
                      Shivering Isles — Madness
                    </ListSubheader>
                    {MADNESS_MATERIALS.map((m) => (
                      <MenuItem key={m} value={m} sx={{ fontSize: '0.8rem' }}>{m} Arrow</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>

              {bowSummary && (
                <div className="flex flex-col">
                  <div className="mb-1 text-xs text-gray-500 opacity-0 select-none">_</div>
                  <span className="text-xs font-semibold text-yellow-300">{bowSummary.label}</span>
                  <span className="text-xs text-gray-500">{bowSummary.detail}</span>
                </div>
              )}
            </div>
            <Divider sx={{ my: 1.5, borderColor: '#2e2e2e' }} />
          </>
        )}

        {!isBow && (
          <StatInput
            label="Base Weapon Damage"
            value={baseWeaponDamage}
            min={0}
            max={200}
            onChange={(v) => { setBaseWeaponDamage(v); setPresetSubtype(''); setPresetMaterial(''); }}
            showSlider={false}
            tooltip="The damage value shown on the UESP wiki for this weapon"
          />
        )}

        {isBow && (
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            <StatInput
              label="Base Bow Damage"
              value={baseWeaponDamage}
              min={0}
              max={200}
              onChange={(v) => { setBaseWeaponDamage(v); setPresetBowMaterial(''); }}
              showSlider={false}
              tooltip="The damage value shown on the UESP wiki for this bow"
            />
            <StatInput
              label="Base Arrow Damage"
              value={baseArrowDamage}
              min={0}
              max={100}
              onChange={(v) => { setBaseArrowDamage(v); setPresetArrowMaterial(''); }}
              showSlider={false}
              tooltip="For bows, WeaponRating = Bow WR + Arrow WR. Enter the base damage of the arrow separately."
            />
          </div>
        )}

        <StatInput
          label="Weapon Condition"
          value={weaponConditionPct}
          min={0}
          max={125}
          onChange={setWeaponConditionPct}
          suffix="%"
          tooltip="Weapon condition as a percentage of maximum. 100% = full condition. Can exceed 100% (up to 125%) if repaired above base. Affects damage as (condition% / 100 + 1) / 4 within the weapon rating formula."
        />

        <SectionHeading>Attacker Stats</SectionHeading>

        <StatInput
          label={attributeLabel}
          value={isBow ? agility : strength}
          min={0}
          max={100}
          onChange={isBow ? setAgility : onStrengthChange}
          tooltip={
            isBow
              ? 'Agility is the governing attribute for bows'
              : 'Strength is the governing attribute for melee weapons'
          }
        />
        <StatInput
          label={skillLabel}
          value={skill}
          min={0}
          max={100}
          onChange={setSkill}
          tooltip="Includes any Fortify/Damage/Absorb Skill effects from spells, potions, and enchantments"
        />
        <StatInput
          label="Luck"
          value={luck}
          min={0}
          max={100}
          onChange={onLuckChange}
          tooltip="Luck modifies your effective skill: ModifiedSkill = Skill + 0.4 × (Luck − 50)"
        />
        {isRemastered ? (
          <div className="rounded border border-[#2e2e2e] bg-[#1e1e1e] px-3 py-2 text-xs text-gray-500">
            Fatigue does not affect damage in Oblivion Remastered.
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              <StatInput
                label="Current Fatigue"
                value={currentFatigue}
                min={0}
                max={9999}
                onChange={onCurrentFatigueChange}
                showSlider={false}
                tooltip="Your current fatigue. Fatigue modifier = (Fatigue / MaxFatigue + 1) / 2"
              />
              <StatInput
                label="Max Fatigue"
                value={maxFatigue}
                min={1}
                max={9999}
                onChange={onMaxFatigueChange}
                showSlider={false}
                tooltip="Your maximum fatigue (can be buffed above base). A higher max fatigue reduces the fatigue modifier."
              />
            </div>
          </>
        )}

        <SectionHeading>Attack Modifiers</SectionHeading>

        <div className="flex flex-wrap gap-x-6 gap-y-1">
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={isSneaking}
                onChange={(e) => onSneakingChange(e.target.checked)}
                color="secondary"
              />
            }
            label={<span className="text-xs text-gray-300">Sneak Attack</span>}
          />
          {!isBow && (
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={isPowerAttack}
                  onChange={(e) => setIsPowerAttack(e.target.checked)}
                  color="secondary"
                />
              }
              label={<span className="text-xs text-gray-300">Power Attack</span>}
            />
          )}
        </div>

        {isSneaking && (
          <div className="ml-1 mt-2 space-y-2 rounded border border-[#2e2e2e] bg-[#1e1e1e] p-3">
            <StatInput
              label="Sneak Skill"
              value={sneakSkill}
              min={0}
              max={100}
              onChange={onSneakSkillChange}
              tooltip="Determines sneak attack tier (25+ = Apprentice) and the Master Sneak perk (100 = bypasses opponent armor while sneaking)"
            />
            {!isTwoHanded && (
              <div className="text-xs text-gray-500">
                Sneak attack multiplier{!isBow && ' (only highest of sneak/power attack applies)'}:
                <span className="ml-2 font-semibold text-gray-300">
                  {isBow ? (sneakSkill >= 25 ? '3×' : '2×') : sneakSkill >= 25 ? '6×' : '4×'}
                </span>
              </div>
            )}
            {isTwoHanded && (
              <div className="text-xs text-gray-500">
                Two-handed weapons receive no damage bonus from sneak attacks.
              </div>
            )}
            {sneakSkill >= 100 && (
              <div className="text-xs text-yellow-400">
                Master Sneak perk active — opponent armor bypassed while sneaking.
              </div>
            )}
          </div>
        )}

        {!isBow && isPowerAttack && (
          <div className="ml-1 mt-2 rounded border border-[#2e2e2e] bg-[#1e1e1e] p-3">
            <div className="mb-2 text-xs text-gray-500">
              Power attack type (only highest of sneak/power attack applies):
            </div>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={powerAttackType}
              onChange={(_, v) => { if (v) setPowerAttackType(v); }}
            >
              <ToggleButton value="normal" sx={{ fontSize: '0.7rem' }}>
                Normal (2.5×)
              </ToggleButton>
              <ToggleButton value="standing" sx={{ fontSize: '0.7rem' }}>
                Standing (3×, Apprentice+)
              </ToggleButton>
            </ToggleButtonGroup>
          </div>
        )}

        {!isBow && !isTwoHanded && isSneaking && isPowerAttack && (
          <div className="rounded border border-amber-800/50 bg-amber-900/10 px-3 py-2 text-xs text-amber-400">
            Note: only the higher multiplier applies — a sneak power attack uses only the sneak
            multiplier ({isBow ? (sneakSkill >= 25 ? '3×' : '2×') : sneakSkill >= 25 ? '6×' : '4×'})
            or the power attack multiplier ({powerAttackType === 'standing' ? '3×' : '2.5×'}),
            whichever is greater.
          </div>
        )}

        <SectionHeading>Opponent</SectionHeading>

        <StatInput
          label="Combined Armor Rating"
          value={combinedArmorRating}
          min={0}
          max={85}
          onChange={onCombinedArmorRatingChange}
          tooltip="Sum of all armor pieces (each scaled by armor skill and condition). Hard-capped at 85."
        />

        <StatInput
          label="Normal Weapon Resistance"
          value={normalWeaponResistance}
          min={0}
          max={100}
          onChange={onNormalWeaponResistanceChange}
          suffix="%"
          tooltip="Opponent's Resist Normal Weapons %. Has no effect when Bypasses Resistance is enabled."
        />

        <div className="mt-2 space-y-1">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={isSilverDaedricOrEnchanted}
                  onChange={(e) => setIsSilverDaedricOrEnchanted(e.target.checked)}
                  color="secondary"
                />
              }
              label={
                <Tooltip
                  title="Silver, Daedric, and enchanted weapons (or arrows) bypass Resist Normal Weapons. Enable for any enchanted weapon regardless of material."
                  arrow
                >
                  <span className="cursor-help text-xs text-gray-300">Bypasses Resistance</span>
                </Tooltip>
              }
            />
            {isBow ? (
              <span className="text-xs text-gray-600">
                {presetBowMaterial && materialBypassesResistance(presetBowMaterial as WeaponMaterial)
                  ? `${presetBowMaterial} bow bypasses resistance`
                  : presetArrowMaterial && materialBypassesResistance(presetArrowMaterial as WeaponMaterial)
                    ? `${presetArrowMaterial} arrow bypasses resistance`
                    : (presetBowMaterial || presetArrowMaterial)
                      ? 'Neither bow nor arrow bypasses resistance'
                      : null}
              </span>
            ) : (
              presetMaterial && (
                <span className="text-xs text-gray-600">
                  {materialBypassesResistance(presetMaterial as WeaponMaterial)
                    ? `${presetMaterial} bypasses resistance`
                    : `${presetMaterial} does not bypass resistance`}
                </span>
              )
            )}
          </div>
        </div>
      </div>

      {/* ── Result ── */}
      <div className="mt-6 w-full lg:mt-0 lg:w-80 lg:shrink-0">
        <div className="sticky top-4">
          <ResultDisplay
            primaryLabel="Weapon Damage"
            primaryValue={result.finalDamage}
            breakdown={breakdown}
          />
          <div className="mt-3 text-xs text-gray-600">
            Enchantment damage and poison effects are not included here — they are treated as spells
            and applied separately.
          </div>
        </div>
      </div>
    </div>
  );
}
