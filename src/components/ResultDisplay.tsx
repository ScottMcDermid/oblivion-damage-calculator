'use client';

import React, { useState } from 'react';
import { Collapse, Tooltip } from '@mui/material';
import { GiArrowDunk } from 'react-icons/gi';

interface BreakdownRow {
  label: string;
  value: string | number;
  tooltip?: string;
  highlight?: boolean;
}

interface ResultDisplayProps {
  /** Primary damage result shown prominently */
  primaryLabel: string;
  primaryValue: number;
  /** Additional outputs (e.g. fatigue damage for H2H) */
  secondaryResults?: { label: string; value: number }[];
  /** Step-by-step calculation rows */
  breakdown: BreakdownRow[];
  /** Optional warning/note message */
  warning?: string;
}

export default function ResultDisplay({
  primaryLabel,
  primaryValue,
  secondaryResults,
  breakdown,
  warning,
}: ResultDisplayProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  const fmt = (n: number, decimals = 4) =>
    Number.isFinite(n) ? n.toFixed(decimals) : '—';

  return (
    <div className="rounded-lg border border-[#2e2e2e] bg-[#252525] p-4">
      {/* Primary result */}
      <div className="flex items-baseline gap-3">
        <GiArrowDunk className="shrink-0 text-xl text-yellow-400" />
        <div>
          <div className="text-xs uppercase tracking-widest text-gray-500">{primaryLabel}</div>
          <div className="text-3xl font-bold text-yellow-300">
            {fmt(primaryValue, 2)}
          </div>
        </div>

        {secondaryResults && secondaryResults.length > 0 && (
          <div className="ml-4 flex gap-6 border-l border-[#2e2e2e] pl-4">
            {secondaryResults.map((r) => (
              <div key={r.label}>
                <div className="text-xs uppercase tracking-widest text-gray-500">{r.label}</div>
                <div className="text-xl font-semibold text-gray-200">{fmt(r.value, 2)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {warning && (
        <div className="mt-3 rounded border border-amber-800/60 bg-amber-900/20 px-3 py-2 text-xs text-amber-300">
          {warning}
        </div>
      )}

      {/* Breakdown toggle */}
      <div className="mt-3">
        <button
          onClick={() => setShowBreakdown((p) => !p)}
          className="text-xs text-gray-500 underline-offset-2 hover:text-gray-300 hover:underline"
        >
          {showBreakdown ? 'Hide breakdown' : 'Show breakdown'}
        </button>

        <Collapse in={showBreakdown}>
          <div className="mt-3 space-y-1 rounded border border-[#2e2e2e] bg-[#1e1e1e] p-3">
            {breakdown.map((row) => (
              <div
                key={row.label}
                className={`flex items-center justify-between gap-2 text-xs ${
                  row.highlight ? 'font-semibold text-yellow-300' : 'text-gray-400'
                }`}
              >
                {row.tooltip ? (
                  <Tooltip title={row.tooltip} placement="left" arrow>
                    <span className="cursor-help border-b border-dashed border-gray-700">
                      {row.label}
                    </span>
                  </Tooltip>
                ) : (
                  <span>{row.label}</span>
                )}
                <span className="font-mono">
                  {typeof row.value === 'number' ? fmt(row.value) : row.value}
                </span>
              </div>
            ))}
          </div>
        </Collapse>
      </div>
    </div>
  );
}
