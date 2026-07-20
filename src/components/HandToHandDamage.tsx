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
    <div className="mb-3 mt-5 text-xs font-semibold uppercase tracking-widest text-gray-500 first:mt-0">
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
  const [isPowerAttack, setIsPowerAttack] = useState(false);
  const [powerAttackType, setPowerAttackType] = useState<'normal' | 'standing'>('normal');

  const rawResult = useMemo(
    () =>
      calcHandToHandDamage({
        strength,
        skill,
        luck,
        // Remastered: fatigue doesn't affect damage
        currentFatigue: isRemastered ? 1 : currentFatigue,
        maxFatigue: isRemastered ? 1 : Math.max(1, maxFatigue),
        isPowerAttack,
        powerAttackType,
      }),
    [strength, skill, luck, isRemastered, currentFatigue, maxFatigue, isPowerAttack, powerAttackType],
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
      label: `Power Attack Multiplier${!isPowerAttack ? ' (none)' : ''}`,
      value: rawResult.powerAttackMultiplier,
      tooltip: 'Normal: 2.5×, Standing (Apprentice+): 3×',
    },
    {
      label: 'Pre-difficulty Health Damage',
      value: rawResult.finalHealthDamage,
      tooltip: 'Health damage before difficulty multiplier',
    },
    {
      label: `Difficulty Multiplier${difficultyMultiplier === 1 ? ' (default)' : ''}`,
      value: difficultyMultiplier,
      tooltip: `Adjustable in Settings. Formula: 5^(−difficulty/100). ×${difficultyMultiplier.toFixed(3)}`,
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
            Hand to Hand skill (modified by Luck), fatigue, and power attacks.
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

        <div className="mt-4 rounded border border-[#2e2e2e] bg-[#1e1e1e] px-3 py-2 text-xs text-gray-500">
          <strong className="text-gray-400">Formula:</strong>
          <br />
          Health Damage = 1 + 10.5 × (Strength / 100) × (ModifiedSkill / 100)
          <br />
          Fatigue Damage = 1 + 0.5 × Health Damage
          <br />
          <span className="mt-1 block text-gray-600">
            {isRemastered
              ? '(Modified by power attack multiplier only — fatigue has no effect in Remastered)'
              : '(Both are then modified by the fatigue modifier and power attack multiplier)'}
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
