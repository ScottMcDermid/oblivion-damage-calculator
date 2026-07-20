'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Slider, Tooltip } from '@mui/material';

interface StatInputProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  // eslint-disable-next-line no-unused-vars
  onChange: (n: number) => void;
  showSlider?: boolean;
  tooltip?: string;
  suffix?: string;
}

export default function StatInput({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  showSlider = true,
  tooltip,
  suffix,
}: StatInputProps) {
  const [localValue, setLocalValue] = useState(String(value));
  const isFocused = useRef(false);

  // Sync from parent (e.g. slider, preset selection) only when the input is not focused
  useEffect(() => {
    if (!isFocused.current) {
      setLocalValue(String(value));
    }
  }, [value]);

  const commit = (raw: string) => {
    if (raw === '' || raw === '-') {
      onChange(min);
      setLocalValue(String(min));
      return;
    }
    const parsed = parseInt(raw, 10);
    const clamped = isNaN(parsed) ? min : Math.max(min, Math.min(max, parsed));
    onChange(clamped);
    setLocalValue(String(clamped));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    isFocused.current = false;
    commit(e.target.value);
  };

  const handleFocus = () => {
    isFocused.current = true;
  };

  const labelEl = (
    <span className="shrink-0 text-xs text-gray-400" style={{ minWidth: '9rem' }}>
      {label}
    </span>
  );

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-3">
        {tooltip ? (
          <Tooltip title={tooltip} placement="top" arrow>
            <span className="shrink-0 cursor-help border-b border-dashed border-gray-600 text-xs text-gray-400" style={{ minWidth: '9rem' }}>
              {label}
            </span>
          </Tooltip>
        ) : (
          labelEl
        )}
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={localValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          className="w-20 rounded border border-[#2e2e2e] bg-transparent px-2 py-0.5 text-right text-sm text-gray-100
                     [appearance:textfield] focus:border-gray-500 focus:outline-none
                     [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        {suffix && <span className="text-xs text-gray-500">{suffix}</span>}
      </div>
      {showSlider && (
        <div className="pl-[9.75rem]">
          <Slider
            size="small"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(_, v) => onChange(v as number)}
            sx={{ py: 0.5, color: 'secondary.main' }}
          />
        </div>
      )}
    </div>
  );
}
