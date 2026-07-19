'use client';

import React, { useMemo, useState } from 'react';
import { FormControlLabel, Switch } from '@mui/material';
import { GiFireball } from 'react-icons/gi';

import StatInput from '@/components/StatInput';
import ResultDisplay from '@/components/ResultDisplay';
import { calcSpellDamage } from '@/utils/damageFormulas';

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 mt-5 text-xs font-semibold uppercase tracking-widest text-gray-500 first:mt-0">
      {children}
    </div>
  );
}

export default function SpellDamage() {
  const [originalMagnitude, setOriginalMagnitude] = useState(20);
  const [magicResistance, setMagicResistance] = useState(0);
  const [magicWeakness, setMagicWeakness] = useState(0);
  const [isElemental, setIsElemental] = useState(false);
  const [elementalResistance, setElementalResistance] = useState(0);
  const [elementalWeakness, setElementalWeakness] = useState(0);

  const result = useMemo(
    () =>
      calcSpellDamage({
        originalMagnitude,
        magicResistance,
        magicWeakness,
        isElemental,
        elementalResistance,
        elementalWeakness,
      }),
    [originalMagnitude, magicResistance, magicWeakness, isElemental, elementalResistance, elementalWeakness],
  );

  const magicFactor = (100 - magicResistance + magicWeakness) / 100;

  const breakdown = [
    {
      label: 'Original Magnitude',
      value: originalMagnitude,
    },
    {
      label: 'Magic Factor',
      value: magicFactor,
      tooltip: '(100 − MagicResistance + MagicWeakness) / 100',
    },
    {
      label: 'After Magic Resist/Weakness',
      value: result.afterMagicResist,
      tooltip: 'OriginalMagnitude × (100 − MagicResistance + MagicWeakness) / 100',
      highlight: !isElemental,
    },
    ...(isElemental
      ? [
          {
            label: 'Elemental Multiplier',
            value: result.elementalMultiplier ?? 1,
            tooltip: '(100 − ElementalResistance + ElementalWeakness) / 100. If ≤ 0, effect is fully resisted.',
          },
          {
            label: 'Final Magnitude',
            value: result.finalMagnitude,
            highlight: true,
          },
        ]
      : []),
  ];

  const warning = result.isResisted
    ? 'This effect is fully resisted (elemental multiplier ≤ 0). The target will see a "Resisted" message.'
    : undefined;

  return (
    <div className="flex flex-col gap-0 lg:flex-row lg:gap-8">
      {/* ── Inputs ── */}
      <div className="min-w-0 flex-1 space-y-1">

        <div className="mb-4 flex items-center gap-2 text-sm text-gray-400">
          <GiFireball className="text-xl text-orange-400" />
          <span>
            Spell magnitude is reduced by magic resistance and weakness, then by elemental
            resistance/weakness for fire, frost, and shock effects.
          </span>
        </div>

        <SectionHeading>Spell Effect</SectionHeading>

        <StatInput
          label="Original Magnitude"
          value={originalMagnitude}
          min={0}
          max={9999}
          step={1}
          onChange={setOriginalMagnitude}
          showSlider={false}
          tooltip="The base magnitude of the spell or effect before any resistances"
        />

        <SectionHeading>Opponent Magic Resistance</SectionHeading>

        <StatInput
          label="Magic Resistance"
          value={magicResistance}
          min={0}
          max={100}
          onChange={setMagicResistance}
          suffix="%"
          tooltip="Resist Magic %. Reduces all spell effects."
        />
        <StatInput
          label="Magic Weakness"
          value={magicWeakness}
          min={0}
          max={100}
          onChange={setMagicWeakness}
          suffix="%"
          tooltip="Weakness to Magic %. Increases all spell effects."
        />

        <SectionHeading>Elemental Damage</SectionHeading>

        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={isElemental}
              onChange={(e) => setIsElemental(e.target.checked)}
              color="secondary"
            />
          }
          label={
            <span className="text-xs text-gray-300">
              Elemental effect (Fire / Frost / Shock Damage)
            </span>
          }
        />

        {isElemental && (
          <div className="ml-1 mt-2 space-y-1 rounded border border-[#2e2e2e] bg-[#1e1e1e] p-3">
            <div className="mb-2 text-xs text-gray-500">
              Elemental effects apply a second multiplier after the magic resist calculation.
            </div>
            <StatInput
              label="Elemental Resistance"
              value={elementalResistance}
              min={0}
              max={100}
              onChange={setElementalResistance}
              suffix="%"
              tooltip="Resist Fire / Frost / Shock %. Stacks with magic resistance."
            />
            <StatInput
              label="Elemental Weakness"
              value={elementalWeakness}
              min={0}
              max={100}
              onChange={setElementalWeakness}
              suffix="%"
              tooltip="Weakness to Fire / Frost / Shock %. If elemental multiplier ≤ 0, effect is fully resisted."
            />
          </div>
        )}

        <div className="mt-4 rounded border border-[#2e2e2e] bg-[#1e1e1e] px-3 py-2 text-xs text-gray-500">
          <strong className="text-gray-400">Formula:</strong>
          <br />
          Magnitude = OriginalMagnitude × (100 − MagicResistance + MagicWeakness) / 100
          {isElemental && (
            <>
              <br />
              <span className="text-gray-400">× (100 − ElementalResistance + ElementalWeakness) / 100</span>
              <br />
              <span className="text-gray-600">If elemental multiplier ≤ 0 → effect is resisted</span>
            </>
          )}
          <br />
            <span className="mt-1 block text-gray-600">
                Sneak multiplier does not apply to spells, enchantments, or poisons.
              </span>
        </div>
      </div>

      {/* ── Result ── */}
      <div className="mt-6 w-full lg:mt-0 lg:w-80 lg:shrink-0">
        <div className="sticky top-4">
          <ResultDisplay
            primaryLabel="Final Magnitude"
            primaryValue={result.finalMagnitude}
            breakdown={breakdown}
            warning={warning}
          />
          <div className="mt-3 text-xs text-gray-600">
            Enter the spell&apos;s base magnitude from the game or the spell creation interface. Enchantment and poison effects use the same formula.
          </div>
        </div>
      </div>
    </div>
  );
}
