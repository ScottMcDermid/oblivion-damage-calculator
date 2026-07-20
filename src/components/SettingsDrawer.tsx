'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  IconButton,
  Slider,
  ToggleButton,
  ToggleButtonGroup,
  useMediaQuery,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const DRAWER_WIDTH = 300;

interface SettingsContentProps {
  isRemastered: boolean;
  // eslint-disable-next-line no-unused-vars
  onRemasteredChange: (v: boolean) => void;
  difficulty: number;
  // eslint-disable-next-line no-unused-vars
  onDifficultyChange: (v: number) => void;
}

function SettingsContent({
  isRemastered,
  onRemasteredChange,
  difficulty,
  onDifficultyChange,
}: SettingsContentProps) {
  const difficultyMultiplier = Math.pow(6, -difficulty / 100);

  return (
    <div className="space-y-6 p-4">
      {/* Version toggle */}
      <div>
        <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
          Version
        </div>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={isRemastered ? 'remastered' : 'vanilla'}
          onChange={(_, v) => {
            if (v !== null) onRemasteredChange(v === 'remastered');
          }}
          fullWidth
        >
          <ToggleButton value="vanilla" sx={{ fontSize: '0.75rem' }}>
            Vanilla
          </ToggleButton>
          <ToggleButton value="remastered" sx={{ fontSize: '0.75rem' }}>
            Remastered
          </ToggleButton>
        </ToggleButtonGroup>
        <p className="mt-2 text-xs text-gray-400">
          {isRemastered
            ? 'Fatigue does not affect melee damage in Oblivion Remastered.'
            : 'Fatigue reduces damage: modifier = (Fatigue / MaxFatigue + 1) / 2.'}
        </p>
      </div>

      <Divider />

      {/* Difficulty slider */}
      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            Difficulty
          </span>
          <span className="font-mono text-sm font-semibold text-yellow-300">
            ×{difficultyMultiplier.toFixed(3)}
          </span>
        </div>
        <div className="mb-1 text-center text-xs text-gray-300">
          {difficulty === 0
            ? 'Default'
            : difficulty < 0
              ? `Easier (${difficulty})`
              : `Harder (+${difficulty})`}
        </div>
        <Slider
          min={-100}
          max={100}
          step={1}
          value={difficulty}
          onChange={(_, v) => onDifficultyChange(v as number)}
          marks={[
            { value: -100, label: '' },
            { value: 0, label: '' },
            { value: 100, label: '' },
          ]}
          sx={{ color: 'secondary.main' }}
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>Easiest (×6)</span>
          <span>Default (×1)</span>
          <span>Hardest (×⅙)</span>
        </div>
        <p className="mt-2 text-xs text-gray-400">
          Difficulty multiplier applied to all final damage outputs.
        </p>
      </div>
    </div>
  );
}

interface SettingsDrawerProps extends SettingsContentProps {
  open: boolean;
  onClose: () => void;
}

export default function SettingsDrawer({
  open,
  onClose,
  isRemastered,
  onRemasteredChange,
  difficulty,
  onDifficultyChange,
}: SettingsDrawerProps) {
  const isDesktop = useMediaQuery('(min-width: 1280px)');

  const contentProps = { isRemastered, onRemasteredChange, difficulty, onDifficultyChange };

  const header = (
    <div className="flex items-center justify-between px-4 py-3">
      <h2 className="text-base font-semibold">Settings</h2>
      <IconButton aria-label="close" onClick={onClose} size="small">
        <CloseIcon fontSize="small" />
      </IconButton>
    </div>
  );

  if (isDesktop) {
    return (
      <Drawer
        variant="temporary"
        anchor="right"
        open={open}
        onClose={onClose}
        sx={{
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            backgroundColor: 'background.paper',
            borderLeft: '1px solid #2e2e2e',
            overflowX: 'hidden',
          },
        }}
      >
        {header}
        <Divider />
        <SettingsContent {...contentProps} />
      </Drawer>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{ className: 'w-[90vw] max-w-sm sm:max-w-md' }}
    >
      <IconButton
        aria-label="close"
        onClick={onClose}
        sx={{ position: 'absolute', right: 8, top: 8 }}
      >
        <CloseIcon />
      </IconButton>
      <DialogTitle>Settings</DialogTitle>
      <DialogContent className="!p-0">
        <SettingsContent {...contentProps} />
      </DialogContent>
    </Dialog>
  );
}
