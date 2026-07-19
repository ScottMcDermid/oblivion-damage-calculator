'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  MATERIALS,
  BLADE_SUBTYPES,
  BLUNT_SUBTYPES,
  getPreset,
  getBowPreset,
  getArrowPreset,
  subtypeIsTwoHanded,
  materialBypassesResistance,
  type WeaponMaterial,
  type WeaponSubtype,
} from '@/utils/weaponPresets';

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 mt-5 text-xs font-semibold uppercase tracking-widest text-gray-500 first:mt-0">
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
}

export default function WeaponDamage({
  weaponType,
  onWeaponTypeChange,
  isRemastered,
  difficultyMultiplier,
}: WeaponDamageProps) {

  // ── Melee preset state ──
  const [presetSubtype, setPresetSubtype] = useState<WeaponSubtype | ''>(DEFAULT_BLADE_SUBTYPE);
  const [presetMaterial, setPresetMaterial] = useState<WeaponMaterial | ''>(DEFAULT_MATERIAL);

  // ── Bow/arrow preset state ──
  const [presetBowMaterial, setPresetBowMaterial] = useState<WeaponMaterial>(DEFAULT_MATERIAL);
  const [presetArrowMaterial, setPresetArrowMaterial] = useState<WeaponMaterial>(DEFAULT_MATERIAL);

  // ── Weapon stats ──
  const [baseWeaponDamage, setBaseWeaponDamage] = useState(() => {
    const p = getPreset(DEFAULT_MATERIAL, DEFAULT_BLADE_SUBTYPE);
    return p?.baseDamage ?? 10;
  });
  const [baseArrowDamage, setBaseArrowDamage] = useState(() => getArrowPreset(DEFAULT_MATERIAL).baseDamage);
  const [weaponConditionPct, setWeaponConditionPct] = useState(100);

  // ── Attacker stats ──
  const [attribute, setAttribute] = useState(50);
  const [skill, setSkill] = useState(25);
  const [luck, setLuck] = useState(50);
  const [currentFatigue, setCurrentFatigue] = useState(200);
  const [maxFatigue, setMaxFatigue] = useState(200);

  // ── Attack modifiers ──
  const [isSneaking, setIsSneaking] = useState(false);
  const [sneakSkill, setSneakSkill] = useState(25);
  const [isPowerAttack, setIsPowerAttack] = useState(false);
  const [powerAttackType, setPowerAttackType] = useState<'normal' | 'standing'>('normal');

  // ── Opponent ──
  const [hasMasterSneakPerk, setHasMasterSneakPerk] = useState(false);
  const [combinedArmorRating, setCombinedArmorRating] = useState(0);
  const [normalWeaponResistance, setNormalWeaponResistance] = useState(0);
  const [isSilverDaedricOrEnchanted, setIsSilverDaedricOrEnchanted] = useState(false);

  // ── Preset application helpers ──

  const applyMeleePreset = (subtype: WeaponSubtype | '', material: WeaponMaterial | '', resetCondition = true) => {
    setPresetSubtype(subtype);
    setPresetMaterial(material);
    if (!subtype || !material) return;
    const p = getPreset(material, subtype);
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
  };

  // ── Reset presets when weaponType prop changes from the top-bar ──
  const prevWeaponType = useRef(weaponType);
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
      isSneaking, sneakSkill, isPowerAttack, powerAttackType,
      hasMasterSneakPerk, combinedArmorRating, normalWeaponResistance, isSilverDaedricOrEnchanted,
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
        : '(CurrentFatigue / MaxFatigue + 1) / 2 — ranges 0.5 to 1.0',
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
        hasMasterSneakPerk && isSneaking
          ? 'Master Sneak perk bypasses armor (= 1)'
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
      tooltip: `Adjustable in Settings. Formula: 5^(−difficulty/100). ×${difficultyMultiplier.toFixed(3)}`,
    },
    {
      label: 'Final Damage',
      value: result.finalDamage,
      highlight: true,
    },
  ];

  // ── Preset summary helpers ──

  const meleeSummary = (() => {
    if (!presetSubtype || !presetMaterial) return null;
    const p = getPreset(presetMaterial, presetSubtype);
    if (!p) return null;
    return {
      label: `${presetMaterial} ${presetSubtype}`,
      detail: `Base damage: ${p.baseDamage}`,
      warn: p.bypassesResistance,
    };
  })();

  const bowSummary = (() => {
    const bow = getBowPreset(presetBowMaterial);
    const arrow = getArrowPreset(presetArrowMaterial);
    return {
      label: `${presetBowMaterial} Bow + ${presetArrowMaterial} Arrow`,
      detail: `Base: ${bow.baseDamage} + ${arrow.baseDamage} = ${bow.baseDamage + arrow.baseDamage} combined`,
    };
  })();

  return (
    <div className="flex flex-col gap-0 lg:flex-row lg:gap-8">
      {/* ── Inputs ── */}
      <div className="min-w-0 flex-1 space-y-1">

        {/* ── Preset selector — melee ── */}
        {!isBow && (
          <>
            <SectionHeading>Weapon Preset</SectionHeading>
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
                    <ListSubheader sx={{ fontSize: '0.7rem', lineHeight: '2rem' }}>Blade</ListSubheader>
                    {BLADE_SUBTYPES.map((s) => (
                      <MenuItem key={s} value={s} sx={{ fontSize: '0.8rem' }}>{s}</MenuItem>
                    ))}
                    <Divider />
                    <ListSubheader sx={{ fontSize: '0.7rem', lineHeight: '2rem' }}>Blunt</ListSubheader>
                    {BLUNT_SUBTYPES.map((s) => (
                      <MenuItem key={s} value={s} sx={{ fontSize: '0.8rem' }}>{s}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>

              <div>
                <div className="mb-1 text-xs text-gray-500">Material</div>
                <FormControl size="small" sx={{ minWidth: 130 }}>
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
                    {MATERIALS.map((m) => (
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
          </>
        )}

        {/* ── Preset selector — bow + arrow ── */}
        {isBow && (
          <>
            <SectionHeading>Bow &amp; Arrow Preset</SectionHeading>
            <div className="flex flex-wrap items-start gap-3">
              <div>
                <div className="mb-1 text-xs text-gray-500">Bow</div>
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <Select
                    value={presetBowMaterial}
                    onChange={(e) => {
                      const mat = e.target.value as WeaponMaterial;
                      setPresetBowMaterial(mat);
                      applyBowPreset(mat, presetArrowMaterial);
                    }}
                    sx={{ fontSize: '0.8rem' }}
                  >
                    {MATERIALS.map((m) => (
                      <MenuItem key={m} value={m} sx={{ fontSize: '0.8rem' }}>{m} Bow</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>

              <div>
                <div className="mb-1 text-xs text-gray-500">Arrow</div>
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <Select
                    value={presetArrowMaterial}
                    onChange={(e) => {
                      const mat = e.target.value as WeaponMaterial;
                      setPresetArrowMaterial(mat);
                      applyBowPreset(presetBowMaterial, mat);
                    }}
                    sx={{ fontSize: '0.8rem' }}
                  >
                    {MATERIALS.map((m) => (
                      <MenuItem key={m} value={m} sx={{ fontSize: '0.8rem' }}>{m} Arrow</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>

              <div className="flex flex-col">
                <div className="mb-1 text-xs text-gray-500 opacity-0 select-none">_</div>
                <span className="text-xs font-semibold text-yellow-300">{bowSummary.label}</span>
                <span className="text-xs text-gray-500">{bowSummary.detail}</span>
              </div>
            </div>
            <p className="mt-1 text-xs text-gray-600">
              All bows bypass Resist Normal Weapons regardless of material.
            </p>
          </>
        )}

        {/* ── Weapon stats ── */}
        <SectionHeading>Weapon</SectionHeading>

        <StatInput
          label={isBow ? 'Base Bow Damage' : 'Base Weapon Damage'}
          value={baseWeaponDamage}
          min={0}
          max={200}
          onChange={(v) => {
            setBaseWeaponDamage(v);
            if (!isBow) { setPresetSubtype(''); setPresetMaterial(''); }
          }}
          showSlider={false}
          tooltip="The damage value shown on the UESP wiki for this weapon"
        />

        {isBow && (
          <StatInput
            label="Base Arrow Damage"
            value={baseArrowDamage}
            min={0}
            max={100}
            onChange={setBaseArrowDamage}
            showSlider={false}
            tooltip="For bows, WeaponRating = Bow WR + Arrow WR. Enter the base damage of the arrow separately."
          />
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
          value={attribute}
          min={0}
          max={100}
          onChange={setAttribute}
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
          onChange={setLuck}
          tooltip="Luck modifies your effective skill: ModifiedSkill = Skill + 0.4 × (Luck − 50)"
        />
        {isRemastered ? (
          <div className="rounded border border-[#2e2e2e] bg-[#1e1e1e] px-3 py-2 text-xs text-gray-500">
            Fatigue does not affect damage in Oblivion Remastered.
          </div>
        ) : (
          <>
            <StatInput
              label="Current Fatigue"
              value={currentFatigue}
              min={0}
              max={9999}
              onChange={setCurrentFatigue}
              showSlider={false}
              tooltip="Your current fatigue. Fatigue modifier = (Fatigue / MaxFatigue + 1) / 2"
            />
            <StatInput
              label="Max Fatigue"
              value={maxFatigue}
              min={1}
              max={9999}
              onChange={setMaxFatigue}
              showSlider={false}
              tooltip="Your maximum fatigue (can be buffed above base). A higher max fatigue reduces the fatigue modifier."
            />
          </>
        )}

        <SectionHeading>Attack Modifiers</SectionHeading>

        <div className="flex flex-wrap gap-x-6 gap-y-1">
          {isTwoHanded ? (
            <span className="text-xs text-gray-600">
              Two-handed weapons do not receive a sneak attack bonus.
            </span>
          ) : (
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={isSneaking}
                  onChange={(e) => setIsSneaking(e.target.checked)}
                  color="secondary"
                />
              }
              label={<span className="text-xs text-gray-300">Sneak Attack</span>}
            />
          )}
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

        {isSneaking && !isTwoHanded && (
          <div className="ml-1 mt-2 space-y-1 rounded border border-[#2e2e2e] bg-[#1e1e1e] p-3">
            <div className="mb-2 text-xs text-gray-500">
              Sneak attack multiplier{!isBow && ' (only highest of sneak/power attack applies)'}:
              <span className="ml-2 font-semibold text-gray-300">
                {isBow ? (sneakSkill >= 25 ? '3×' : '2×') : sneakSkill >= 25 ? '6×' : '4×'}
              </span>
            </div>
            <StatInput
              label="Sneak Skill"
              value={sneakSkill}
              min={0}
              max={100}
              onChange={setSneakSkill}
              tooltip="Determines sneak attack tier: 0–24 (Novice) or 25+ (Apprentice+)"
            />
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
          onChange={setCombinedArmorRating}
          tooltip="Sum of all armor pieces (each scaled by armor skill and condition). Hard-capped at 85."
        />

        <div className="flex flex-wrap gap-x-6 gap-y-1">
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={hasMasterSneakPerk}
                onChange={(e) => setHasMasterSneakPerk(e.target.checked)}
                color="secondary"
              />
            }
            label={
              <Tooltip
                title="Attacker has Master (100) Sneak perk — opponent armor rating becomes 1 when sneaking"
                arrow
              >
                <span className="cursor-help text-xs text-gray-300">Attacker has Master Sneak perk</span>
              </Tooltip>
            }
          />
        </div>

        {!isBow && (
          <div className="mt-2 space-y-1">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
              <StatInput
                label="Normal Weapon Resistance"
                value={normalWeaponResistance}
                min={0}
                max={100}
                onChange={setNormalWeaponResistance}
                showSlider={false}
                suffix="%"
                tooltip="Opponent's Resist Normal Weapons %. Has no effect when Bypasses Resistance is enabled."
              />
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
                    title="Silver, Daedric, and enchanted weapons bypass Resist Normal Weapons. Enable for any enchanted weapon regardless of material."
                    arrow
                  >
                    <span className="cursor-help text-xs text-gray-300">Bypasses Resistance</span>
                  </Tooltip>
                }
              />
              {presetMaterial && (
                <span className="text-xs text-gray-600">
                  {materialBypassesResistance(presetMaterial as WeaponMaterial)
                    ? `${presetMaterial} bypasses resistance`
                    : `${presetMaterial} does not bypass resistance`}
                </span>
              )}
            </div>
          </div>
        )}
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
