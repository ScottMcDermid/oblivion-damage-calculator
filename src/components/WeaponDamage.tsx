'use client';

import React, { useMemo, useState } from 'react';
import {
  FormControlLabel,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from '@mui/material';
import { GiCrossedSwords, GiPocketBow, GiSwordman } from 'react-icons/gi';

import StatInput from '@/components/StatInput';
import ResultDisplay from '@/components/ResultDisplay';
import {
  calcWeaponDamage,
  type WeaponType,
} from '@/utils/damageFormulas';

const WEAPON_TYPES: WeaponType[] = ['Blade', 'Blunt', 'Bow'];

const weaponTypeIcons: Record<WeaponType, React.ReactNode> = {
  Blade: <GiCrossedSwords className="text-base" />,
  Blunt: <GiSwordman className="text-base" />,
  Bow: <GiPocketBow className="text-base" />,
};

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 mt-5 text-xs font-semibold uppercase tracking-widest text-gray-500 first:mt-0">
      {children}
    </div>
  );
}

export default function WeaponDamage() {
  // Attacker
  const [weaponType, setWeaponType] = useState<WeaponType>('Blade');
  const [baseWeaponDamage, setBaseWeaponDamage] = useState(15);
  const [baseArrowDamage, setBaseArrowDamage] = useState(0);
  const [attribute, setAttribute] = useState(50);
  const [skill, setSkill] = useState(25);
  const [luck, setLuck] = useState(50);
  const [weaponHealth, setWeaponHealth] = useState(100);
  const [baseWeaponHealth, setBaseWeaponHealth] = useState(100);
  const [currentFatigue, setCurrentFatigue] = useState(200);
  const [maxFatigue, setMaxFatigue] = useState(200);

  // Attack modifiers
  const [isSneaking, setIsSneaking] = useState(false);
  const [sneakSkill, setSneakSkill] = useState(25);
  const [isPowerAttack, setIsPowerAttack] = useState(false);
  const [powerAttackType, setPowerAttackType] = useState<'normal' | 'standing'>('normal');

  // Opponent
  const [hasMasterSneakPerk, setHasMasterSneakPerk] = useState(false);
  const [combinedArmorRating, setCombinedArmorRating] = useState(0);
  const [normalWeaponResistance, setNormalWeaponResistance] = useState(0);
  const [isSilverDaedricOrEnchanted, setIsSilverDaedricOrEnchanted] = useState(false);

  const isBow = weaponType === 'Bow';
  const attributeLabel = isBow ? 'Agility' : 'Strength';
  const skillLabel = weaponType === 'Blade' ? 'Blade Skill' : weaponType === 'Blunt' ? 'Blunt Skill' : 'Marksman Skill';

  // For bows, base damage is bow + arrow combined
  const effectiveBaseDamage = isBow ? baseWeaponDamage + baseArrowDamage : baseWeaponDamage;

  const result = useMemo(
    () =>
      calcWeaponDamage({
        weaponType,
        baseWeaponDamage: effectiveBaseDamage,
        attribute,
        skill,
        luck,
        weaponHealth,
        baseWeaponHealth: Math.max(1, baseWeaponHealth),
        currentFatigue,
        maxFatigue: Math.max(1, maxFatigue),
        isSneaking,
        sneakSkill,
        isPowerAttack,
        powerAttackType,
        hasMasterSneakPerk,
        combinedArmorRating,
        normalWeaponResistance,
        isSilverDaedricOrEnchanted,
      }),
    [
      weaponType, effectiveBaseDamage, attribute, skill, luck,
      weaponHealth, baseWeaponHealth, currentFatigue, maxFatigue,
      isSneaking, sneakSkill, isPowerAttack, powerAttackType,
      hasMasterSneakPerk, combinedArmorRating, normalWeaponResistance, isSilverDaedricOrEnchanted,
    ],
  );

  const breakdown = [
    {
      label: 'Modified Skill',
      value: result.modifiedSkill,
      tooltip: 'Skill + 0.4 × (Luck − 50), clamped 0–100',
    },
    {
      label: 'Weapon Rating (WR)',
      value: result.weaponRating,
      tooltip: 'BaseDamage × (150 + Attribute) × (40 + ModifiedSkill × 3) × (WeaponHealth/MaxHealth + 1) / 160000',
    },
    {
      label: 'Fatigue Modifier',
      value: result.fatigueModifier,
      tooltip: '(CurrentFatigue / MaxFatigue + 1) / 2 — ranges 0.5 to 1.0',
    },
    {
      label: `Sneak Multiplier${!isSneaking ? ' (not sneaking)' : ''}`,
      value: result.sneakMultiplier,
      tooltip: isBow
        ? 'Bow: 2× (Sneak 0–24) or 3× (Sneak 25+) while sneaking undetected'
        : 'Melee: 4× (Sneak 0–24) or 6× (Sneak 25+) while sneaking undetected',
    },
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
    {
      label: 'Opponent Armor Rating',
      value: result.opponentArmorRating,
      tooltip: hasMasterSneakPerk && isSneaking
        ? 'Master Sneak perk bypasses armor (= 1)'
        : '(100 − CombinedArmorRating) / 100, AR capped at 85',
    },
    {
      label: `Weapon Resistance${isSilverDaedricOrEnchanted ? ' (bypassed)' : ''}`,
      value: result.opponentWeaponResistance,
      tooltip: 'Silver/Daedric/Enchanted weapons always bypass resistance. Otherwise: (100 − NormalWeaponResistance%) / 100',
    },
    {
      label: 'Final Damage',
      value: result.finalDamage,
      highlight: true,
    },
  ];

  return (
    <div className="flex flex-col gap-0 lg:flex-row lg:gap-8">
      {/* ── Inputs ── */}
      <div className="min-w-0 flex-1 space-y-1">

        {/* Weapon type */}
        <SectionHeading>Weapon</SectionHeading>
        <div className="mb-4">
          <ToggleButtonGroup
            exclusive
            size="small"
            value={weaponType}
            onChange={(_, v) => { if (v) setWeaponType(v); }}
          >
            {WEAPON_TYPES.map((t) => (
              <ToggleButton key={t} value={t} sx={{ gap: 0.75, px: 1.5, fontSize: '0.75rem' }}>
                {weaponTypeIcons[t]}
                {t}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </div>

        <StatInput
          label={isBow ? 'Base Bow Damage' : 'Base Weapon Damage'}
          value={baseWeaponDamage}
          min={0}
          max={200}
          onChange={setBaseWeaponDamage}
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
          value={weaponHealth}
          min={0}
          max={9999}
          onChange={setWeaponHealth}
          showSlider={false}
          tooltip="Current weapon health / condition"
        />
        <StatInput
          label="Max Weapon Condition"
          value={baseWeaponHealth}
          min={1}
          max={9999}
          onChange={setBaseWeaponHealth}
          showSlider={false}
          tooltip="Maximum (base) weapon health. Ratio = WeaponHealth / BaseWeaponHealth"
        />

        <SectionHeading>Attacker Stats</SectionHeading>

        <StatInput
          label={attributeLabel}
          value={attribute}
          min={0}
          max={100}
          onChange={setAttribute}
          tooltip={isBow ? 'Agility is the governing attribute for bows' : 'Strength is the governing attribute for melee weapons'}
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

        <SectionHeading>Attack Modifiers</SectionHeading>

        <div className="flex flex-wrap gap-x-6 gap-y-1">
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
        </div>

        {isSneaking && (
          <div className="ml-1 mt-2 space-y-1 rounded border border-[#2e2e2e] bg-[#1e1e1e] p-3">
            <div className="mb-2 text-xs text-gray-500">
              Sneak attack multiplier (only highest of sneak/power attack applies):
              <span className="ml-2 font-semibold text-gray-300">
                {isBow
                  ? sneakSkill >= 25 ? '3×' : '2×'
                  : sneakSkill >= 25 ? '6×' : '4×'}
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

        {isPowerAttack && (
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

        {isSneaking && isPowerAttack && (
          <div className="rounded border border-amber-800/50 bg-amber-900/10 px-3 py-2 text-xs text-amber-400">
            Note: only the higher multiplier applies — a sneak power attack uses only the sneak multiplier
            ({isBow ? (sneakSkill >= 25 ? '3×' : '2×') : (sneakSkill >= 25 ? '6×' : '4×')}) or the power
            attack multiplier ({powerAttackType === 'standing' ? '3×' : '2.5×'}), whichever is greater.
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
              <Tooltip title="Attacker has Master (100) Sneak perk — opponent armor rating becomes 1 when sneaking" arrow>
                <span className="cursor-help text-xs text-gray-300">Attacker has Master Sneak perk</span>
              </Tooltip>
            }
          />
        </div>

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
              tooltip="Opponent's Resist Normal Weapons %. Has no effect for silver, Daedric, or enchanted weapons."
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
                <Tooltip title="Silver, Daedric, and enchanted weapons bypass Resist Normal Weapons entirely (resistance = 1)" arrow>
                  <span className="cursor-help text-xs text-gray-300">Silver / Daedric / Enchanted</span>
                </Tooltip>
              }
            />
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
            Enchantment damage and poison effects are not included here — they are treated as spells and applied separately.
          </div>
        </div>
      </div>
    </div>
  );
}
