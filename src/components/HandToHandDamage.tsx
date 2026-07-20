'use client';

import React, { useMemo, useState } from 'react';
import {
  FormControlLabel,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { GiFist } from 'react-icons/gi';

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
}

export default function HandToHandDamage({ isRemastered, difficultyMultiplier }: HandToHandDamageProps) {
  const [strength, setStrength] = useState(50);
  const [skill, setSkill] = useState(25);
  const [luck, setLuck] = useState(50);
  const [currentFatigue, setCurrentFatigue] = useState(200);
  const [maxFatigue, setMaxFatigue] = useState(200);
  const [isSneaking, setIsSneaking] = useState(false);
  const [sneakSkill, setSneakSkill] = useState(25);
  const [isPowerAttack, setIsPowerAttack] = useState(false);
  const [powerAttackType, setPowerAttackType] = useState<'normal' | 'standing'>('normal');

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
      }),
    [strength, skill, luck, isRemastered, currentFatigue, maxFatigue,
     isSneaking, sneakSkill, isPowerAttack, powerAttackType],
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
      label: 'Pre-difficulty Health Damage',
      value: rawResult.finalHealthDamage,
      tooltip: 'Health damage before difficulty multiplier',
    },
    {
      label: `Difficulty Multiplier${difficultyMultiplier === 1 ? ' (default)' : ''}`,
      value: difficultyMultiplier,
      tooltip: `Adjustable in Settings. Formula: 6^(−difficulty/100). ×${difficultyMultiplier.toFixed(3)}`,
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

        <div className="mb-4 flex items-center gap-2 text-sm text-gray-400">
          <GiFist className="text-xl text-yellow-400" />
          <span>
            Hand to Hand attacks deal health and fatigue damage. Damage scales with Strength, the
            Hand to Hand skill (modified by Luck), fatigue, sneak attacks, and power attacks.
          </span>
        </div>

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
          </>
        )}

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
          <div className="ml-1 mt-2 space-y-2 rounded border border-[#2e2e2e] bg-[#1e1e1e] p-3">
            <StatInput
              label="Sneak Skill"
              value={sneakSkill}
              min={0}
              max={100}
              onChange={setSneakSkill}
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

        <div className="mt-4 rounded border border-[#2e2e2e] bg-[#1e1e1e] px-3 py-2 text-xs text-gray-500">
          <strong className="text-gray-400">Formula:</strong>
          <br />
          Health Damage = 1 + 10.5 × (Strength / 100) × (ModifiedSkill / 100)
          <br />
          Fatigue Damage = 1 + 0.5 × Health Damage
          <br />
          <span className="mt-1 block text-gray-600">
            {isRemastered
              ? '(Modified by sneak/power attack multiplier only — fatigue has no effect in Remastered)'
              : '(Both are then modified by the fatigue modifier and sneak/power attack multiplier)'}
          </span>
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
          <div className="mt-3 text-xs text-gray-600">
            Hand to Hand attacks are also presumably affected by opponent armor rating (same as weapon attacks).
          </div>
        </div>
      </div>
    </div>
  );
}
