'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FormControlLabel,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from '@mui/material';
import StatInput from '@/components/StatInput';
import ResultDisplay from '@/components/ResultDisplay';
import { calcHandToHandDamage } from '@/utils/damageFormulas';

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 mt-8 border-t border-[#2e2e2e] pt-4 text-xs font-semibold uppercase tracking-widest text-gray-500 first:mt-0 first:border-0 first:pt-0">
      {children}
    </div>
  );
}

interface HandToHandDamageProps {
  isRemastered: boolean;
  difficultyMultiplier: number;
  isSneaking: boolean;
  // eslint-disable-next-line no-unused-vars
  onSneakingChange: (v: boolean) => void;
  sneakSkill: number;
  // eslint-disable-next-line no-unused-vars
  onSneakSkillChange: (v: number) => void;
}

export default function HandToHandDamage({
  isRemastered,
  difficultyMultiplier,
  isSneaking,
  onSneakingChange,
  sneakSkill,
  onSneakSkillChange,
}: HandToHandDamageProps) {
  const [strength, setStrength] = useState(50);
  const [skill, setSkill] = useState(25);
  const [luck, setLuck] = useState(50);
  const [currentFatigue, setCurrentFatigue] = useState(200);
  const [maxFatigue, setMaxFatigue] = useState(200);
  const [isPowerAttack, setIsPowerAttack] = useState(false);
  const [powerAttackType, setPowerAttackType] = useState<'normal' | 'standing'>('normal');
  const [combinedArmorRating, setCombinedArmorRating] = useState(0);
  const [normalWeaponResistance, setNormalWeaponResistance] = useState(0);
  const [isSilverDaedricOrEnchanted, setIsSilverDaedricOrEnchanted] = useState(false);
  const wasManuallyEnabled = useRef(false);

  // Auto-toggle Bypasses Resistance when H2H skill crosses the Journeyman threshold (≥ 50).
  // When skill drops back below 50, only auto-disable if the user didn't manually enable it
  // (e.g. for enchanted gauntlets/bracers).
  useEffect(() => {
    if (skill >= 50) {
      setIsSilverDaedricOrEnchanted(true);
    } else if (!wasManuallyEnabled.current) {
      setIsSilverDaedricOrEnchanted(false);
    }
  }, [skill]);

  const hasMasterSneakPerk = isSneaking && sneakSkill >= 100;

  const rawResult = useMemo(
    () =>
      calcHandToHandDamage({
        strength,
        skill,
        luck,
        // Remastered: fatigue doesn't affect damage
        currentFatigue: isRemastered ? 1 : currentFatigue,
        maxFatigue: isRemastered ? 1 : Math.max(1, maxFatigue),
        isSneaking,
        sneakSkill,
        isPowerAttack,
        powerAttackType,
        combinedArmorRating,
        hasMasterSneakPerk,
        normalWeaponResistance,
        isSilverDaedricOrEnchanted,
      }),
    [strength, skill, luck, isRemastered, currentFatigue, maxFatigue,
     isSneaking, sneakSkill, isPowerAttack, powerAttackType, combinedArmorRating,
     hasMasterSneakPerk, normalWeaponResistance, isSilverDaedricOrEnchanted],
  );

  // Apply difficulty multiplier
  const result = useMemo(() => ({
    ...rawResult,
    finalHealthDamage: rawResult.finalHealthDamage * difficultyMultiplier,
    finalFatigueDamage: rawResult.finalFatigueDamage * difficultyMultiplier,
  }), [rawResult, difficultyMultiplier]);

  const breakdown = [
    {
      label: 'Modified H2H Skill',
      value: rawResult.modifiedSkill,
      tooltip: 'HandToHandSkill + 0.4 × (Luck − 50), clamped 0–100',
    },
    {
      label: 'Base Health Damage',
      value: rawResult.baseHealthDamage,
      tooltip: '1 + 10.5 × (Strength / 100) × (ModifiedSkill / 100)',
    },
    {
      label: `Fatigue Modifier${isRemastered ? ' (disabled)' : ''}`,
      value: rawResult.fatigueModifier,
      tooltip: isRemastered
        ? 'Fatigue does not affect damage in Oblivion Remastered'
        : '(CurrentFatigue / MaxFatigue + 1) / 2 — minimum 0.5, no upper cap. Current fatigue above max fatigue yields a multiplier > 1.',
    },
    {
      label: `Sneak Multiplier${!isSneaking ? ' (not sneaking)' : ''}`,
      value: rawResult.sneakMultiplier,
      tooltip: 'H2H: 4× (Sneak 0–24) or 6× (Sneak 25+) while sneaking undetected',
    },
    {
      label: `Power Attack Multiplier${!isPowerAttack ? ' (none)' : ''}`,
      value: rawResult.powerAttackMultiplier,
      tooltip: 'Normal: 2.5×, Standing (Apprentice+): 3×',
    },
    {
      label: 'Applied Multiplier (max of above)',
      value: rawResult.appliedMultiplier,
      tooltip: 'Only the higher of sneak or power attack multiplier applies',
    },
    {
      label: 'Opponent Armor Rating',
      value: rawResult.opponentArmorRating,
      tooltip: hasMasterSneakPerk
        ? 'Sneak = 100 (Master perk) bypasses opponent armor while sneaking (= 1)'
        : '(100 − CombinedArmorRating) / 100, AR capped at 85',
    },
    {
      label: `Weapon Resistance${(skill >= 50 || isSilverDaedricOrEnchanted) ? ' (bypassed)' : ''}`,
      value: rawResult.opponentWeaponResistance,
      tooltip: 'Journeyman H2H (skill ≥ 50) or enchanted gauntlets/bracers bypass Resist Normal Weapons (= 1). Otherwise: (100 − NormalWeaponResistance%) / 100',
    },
    {
      label: 'Pre-difficulty Health Damage',
      value: rawResult.finalHealthDamage,
      tooltip: 'Health damage before difficulty multiplier',
    },
    {
      label: `Difficulty Multiplier${difficultyMultiplier === 1 ? ' (default)' : ''}`,
      value: difficultyMultiplier,
      tooltip: `Adjustable in Settings. ×${difficultyMultiplier.toFixed(3)}`,
    },
    {
      label: 'Final Health Damage',
      value: result.finalHealthDamage,
      highlight: true,
    },
    {
      label: 'Opponent Fatigue Damage',
      value: result.finalFatigueDamage,
      tooltip: '(1 + 0.5 × FinalHealthDamage) × difficultyMultiplier',
    },
  ];

  return (
    <div className="flex flex-col gap-0 lg:flex-row lg:gap-8">
      {/* ── Inputs ── */}
      <div className="min-w-0 flex-1 space-y-1">

        <SectionHeading>Attacker Stats</SectionHeading>

        <StatInput
          label="Strength"
          value={strength}
          min={0}
          max={100}
          onChange={setStrength}
          tooltip="Governs H2H health damage output"
        />
        <StatInput
          label="Hand to Hand Skill"
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
          tooltip="Modifies effective skill: ModifiedSkill = Skill + 0.4 × (Luck − 50)"
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
                tooltip="Your maximum fatigue (can be buffed). A higher max fatigue reduces the fatigue modifier."
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
          <div className="ml-1 mt-2 space-y-2 rounded border border-[#2e2e2e] bg-[#1e1e1e] p-3">
            <StatInput
              label="Sneak Skill"
              value={sneakSkill}
              min={0}
              max={100}
              onChange={onSneakSkillChange}
              tooltip="Determines sneak attack tier (25+ = Apprentice) and the Master Sneak perk (100 = bypasses opponent armor while sneaking)"
            />
            <div className="text-xs text-gray-500">
              Sneak attack multiplier (only highest of sneak/power attack applies):
              <span className="ml-2 font-semibold text-gray-300">
                {sneakSkill >= 25 ? '6×' : '4×'}
              </span>
            </div>
            {hasMasterSneakPerk && (
              <div className="text-xs text-yellow-400">
                Master Sneak perk active — opponent armor bypassed while sneaking.
              </div>
            )}
          </div>
        )}

        {isPowerAttack && (
          <div className="ml-1 mt-2 rounded border border-[#2e2e2e] bg-[#1e1e1e] p-3">
            <div className="mb-2 text-xs text-gray-500">Power attack type:</div>
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
            Note: only the higher multiplier applies — a sneak power attack uses only the sneak
            multiplier ({sneakSkill >= 25 ? '6×' : '4×'}) or the power attack
            multiplier ({powerAttackType === 'standing' ? '3×' : '2.5×'}), whichever is greater.
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

        <StatInput
          label="Normal Weapon Resistance"
          value={normalWeaponResistance}
          min={0}
          max={100}
          onChange={setNormalWeaponResistance}
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
                  disabled={skill >= 50}
                  onChange={(e) => {
                    wasManuallyEnabled.current = e.target.checked;
                    setIsSilverDaedricOrEnchanted(e.target.checked);
                  }}
                  color="secondary"
                />
              }
              label={
                <Tooltip
                  title="Enchanted gauntlets or bracers (e.g. Hands of Midnight) bypass Resist Normal Weapons regardless of skill. Also bypassed automatically at Journeyman skill (≥ 50)."
                  arrow
                >
                  <span className="cursor-help text-xs text-gray-300">Bypasses Resistance</span>
                </Tooltip>
              }
            />
            {skill >= 50 && (
              <span className="text-xs text-gray-600">Journeyman perk — bypass active</span>
            )}
          </div>
        </div>

      </div>

      {/* ── Result ── */}
      <div className="mt-6 w-full lg:mt-0 lg:w-80 lg:shrink-0">
        <div className="sticky top-4">
          <ResultDisplay
            primaryLabel="Health Damage"
            primaryValue={result.finalHealthDamage}
            secondaryResults={[
              { label: 'Fatigue Damage', value: result.finalFatigueDamage },
            ]}
            breakdown={breakdown}
          />

        </div>
      </div>
    </div>
  );
}
