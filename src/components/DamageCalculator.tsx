'use client';

import React, { useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import {
  AppBar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  StyledEngineProvider,
  Tab,
  Tabs,
  Toolbar,
  Typography,
  IconButton,
} from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { GiFist, GiSpikedMace } from 'react-icons/gi';
import { TbArcheryArrow } from 'react-icons/tb';
import { LuSword } from 'react-icons/lu';
import { IoSettingsOutline } from 'react-icons/io5';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

import theme from '@/app/theme';
import WeaponDamage from '@/components/WeaponDamage';
import HandToHandDamage from '@/components/HandToHandDamage';
import SettingsDrawer from '@/components/SettingsDrawer';
import { type WeaponType } from '@/utils/damageFormulas';

type ActiveTab = 'blade' | 'blunt' | 'bow' | 'h2h';

const TABS: { id: ActiveTab; label: string; Icon: React.ElementType }[] = [
  { id: 'blade', label: 'Blade',        Icon: LuSword },
  { id: 'blunt', label: 'Blunt',        Icon: GiSpikedMace },
  { id: 'bow',   label: 'Bow',          Icon: TbArcheryArrow },
  { id: 'h2h',   label: 'Hand to Hand', Icon: GiFist },
];

function tabToWeaponType(tab: ActiveTab): WeaponType {
  if (tab === 'blunt') return 'Blunt';
  if (tab === 'bow')   return 'Bow';
  return 'Blade';
}

function weaponTypeToTab(wt: WeaponType): ActiveTab {
  if (wt === 'Blunt') return 'blunt';
  if (wt === 'Bow')   return 'bow';
  return 'blade';
}

const ODC_KEYS = [
  'odc_activeTab',
  'odc_lastWeaponTab',
  'odc_isSneaking',
  'odc_sneakSkill',
  'odc_strength',
  'odc_luck',
  'odc_currentFatigue',
  'odc_maxFatigue',
  'odc_combinedArmorRating',
  'odc_normalWeaponResistance',
  'odc_isRemastered',
  'odc_difficulty',
  'odc_presetSubtype',
  'odc_presetMaterial',
  'odc_presetBowMaterial',
  'odc_presetArrowMaterial',
  'odc_baseWeaponDamage',
  'odc_baseArrowDamage',
  'odc_weaponConditionPct',
  'odc_agility',
  'odc_weaponSkill',
  'odc_weaponIsPowerAttack',
  'odc_weaponPowerAttackType',
  'odc_weaponBypassesResistance',
  'odc_h2hSkill',
  'odc_h2hIsPowerAttack',
  'odc_h2hPowerAttackType',
  'odc_h2hBypassesResistance',
] as const;

export default function DamageCalculator() {
  const [activeTab, setActiveTab] = useLocalStorage<ActiveTab>('odc_activeTab', 'blade');
  const [lastWeaponTab, setLastWeaponTab] = useLocalStorage<Exclude<ActiveTab, 'h2h'>>('odc_lastWeaponTab', 'blade');

  // Shared character stats — same character across all attack types
  const [isSneaking, setIsSneaking] = useLocalStorage('odc_isSneaking', false);
  const [sneakSkill, setSneakSkill] = useLocalStorage('odc_sneakSkill', 25);
  const [strength, setStrength] = useLocalStorage('odc_strength', 50);
  const [luck, setLuck] = useLocalStorage('odc_luck', 50);
  const [currentFatigue, setCurrentFatigue] = useLocalStorage('odc_currentFatigue', 200);
  const [maxFatigue, setMaxFatigue] = useLocalStorage('odc_maxFatigue', 200);

  // Shared opponent stats — same opponent across all attack types
  const [combinedArmorRating, setCombinedArmorRating] = useLocalStorage('odc_combinedArmorRating', 0);
  const [normalWeaponResistance, setNormalWeaponResistance] = useLocalStorage('odc_normalWeaponResistance', 0);

  // Settings
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRemastered, setIsRemastered] = useLocalStorage('odc_isRemastered', false);
  const [difficulty, setDifficulty] = useLocalStorage('odc_difficulty', 0);
  const difficultyMultiplier = Math.pow(6, -difficulty / 100);

  // Reset
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const handleReset = () => {
    // Clear all persisted keys so child components reinitialise to defaults on remount
    ODC_KEYS.forEach((k) => window.localStorage.removeItem(k));
    // Reset all shared state to defaults
    setIsSneaking(false);
    setSneakSkill(25);
    setStrength(50);
    setLuck(50);
    setCurrentFatigue(200);
    setMaxFatigue(200);
    setCombinedArmorRating(0);
    setNormalWeaponResistance(0);
    setIsRemastered(false);
    setDifficulty(0);
    // Increment key to remount child components, resetting their local state
    setResetKey((k) => k + 1);
    setIsResetOpen(false);
  };

  const isWeapon = activeTab !== 'h2h';
  // Always derived from lastWeaponTab so weaponType never changes spuriously when H2H is active
  const weaponType = tabToWeaponType(lastWeaponTab);

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    if (tab !== 'h2h') setLastWeaponTab(tab);
  };

  const handleWeaponTypeChange = (wt: WeaponType) => {
    const tab = weaponTypeToTab(wt) as Exclude<ActiveTab, 'h2h'>;
    setActiveTab(tab);
    setLastWeaponTab(tab);
  };

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div className="flex min-h-screen flex-col">

        {/* ── Header ── */}
        <AppBar position="static" sx={{ backgroundColor: 'background.paper' }} elevation={1}>
          <Toolbar variant="dense" sx={{ gap: 1, overflow: 'hidden' }}>
            <IconButton
              component="a"
              href="https://oblivion.tools"
              size="small"
              aria-label="Oblivion Tools home"
              sx={{ p: 0.5 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/oblivion-tools-icon.ico" width={16} height={16} alt="" />
            </IconButton>

            <Typography
              variant="h6"
              noWrap
              sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'secondary.main' }}
            >
              Oblivion Damage Calculator
            </Typography>

            <Box sx={{ flex: 1 }} />

            <Button
              size="small"
              color="error"
              onClick={() => setIsResetOpen(true)}
              aria-label="Reset calculator"
              sx={{ minWidth: 0, px: { xs: '6px', sm: undefined } }}
            >
              <RestartAltIcon fontSize="small" />
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' }, ml: 0.5 }}>Reset</Box>
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={() => setIsSettingsOpen(true)}
              aria-label="Open settings"
              sx={{ gap: 0.5, fontSize: '0.8rem' }}
            >
              <IoSettingsOutline className="text-base" />
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Settings</Box>
            </Button>
          </Toolbar>
        </AppBar>

        {/* ── Tab bar ── */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', backgroundColor: 'background.paper' }}>
          <Tabs
            value={activeTab}
            onChange={(_, v: ActiveTab) => handleTabChange(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: 40,
              '& .MuiTab-root': { minHeight: 40, py: 0, fontSize: '0.8rem' },
            }}
          >
            {TABS.map(({ id, label, Icon }) => (
              <Tab
                key={id}
                value={id}
                label={
                  <span className="flex items-center gap-1.5">
                    <Icon className="text-base" />
                    {label}
                  </span>
                }
              />
            ))}
          </Tabs>
        </Box>

        {/* ── Main content ── */}
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
          {/* WeaponDamage stays mounted to preserve state; hidden when H2H is active */}
          <div style={{ display: isWeapon ? undefined : 'none' }}>
            <WeaponDamage
              key={resetKey}
              weaponType={weaponType}
              onWeaponTypeChange={handleWeaponTypeChange}
              isRemastered={isRemastered}
              difficultyMultiplier={difficultyMultiplier}
              isSneaking={isSneaking}
              onSneakingChange={setIsSneaking}
              sneakSkill={sneakSkill}
              onSneakSkillChange={setSneakSkill}
              strength={strength}
              onStrengthChange={setStrength}
              luck={luck}
              onLuckChange={setLuck}
              currentFatigue={currentFatigue}
              onCurrentFatigueChange={setCurrentFatigue}
              maxFatigue={maxFatigue}
              onMaxFatigueChange={setMaxFatigue}
              combinedArmorRating={combinedArmorRating}
              onCombinedArmorRatingChange={setCombinedArmorRating}
              normalWeaponResistance={normalWeaponResistance}
              onNormalWeaponResistanceChange={setNormalWeaponResistance}
            />
          </div>
          <div style={{ display: isWeapon ? 'none' : undefined }}>
            <HandToHandDamage
              key={resetKey}
              isRemastered={isRemastered}
              difficultyMultiplier={difficultyMultiplier}
              isSneaking={isSneaking}
              onSneakingChange={setIsSneaking}
              sneakSkill={sneakSkill}
              onSneakSkillChange={setSneakSkill}
              strength={strength}
              onStrengthChange={setStrength}
              luck={luck}
              onLuckChange={setLuck}
              currentFatigue={currentFatigue}
              onCurrentFatigueChange={setCurrentFatigue}
              maxFatigue={maxFatigue}
              onMaxFatigueChange={setMaxFatigue}
              combinedArmorRating={combinedArmorRating}
              onCombinedArmorRatingChange={setCombinedArmorRating}
              normalWeaponResistance={normalWeaponResistance}
              onNormalWeaponResistanceChange={setNormalWeaponResistance}
            />
          </div>
        </main>

        {/* ── Footer ── */}
        <footer className="w-full border-t border-gray-700 bg-neutral-900 px-6 py-8 text-sm text-gray-400">
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 text-center sm:text-left">
            <div className="space-y-2">
              <p>Oblivion Tool Suite © 2025 Scott McDermid</p>
              <p>
                Licensed under the{' '}
                <a
                  href="https://www.gnu.org/licenses/gpl-3.0.html"
                  className="underline hover:text-gray-200"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GNU General Public License v3.0
                </a>
                .
              </p>
              <p>
                Damage formulas sourced from{' '}
                <a
                  href="https://en.uesp.net/wiki/Oblivion:The_Complete_Damage_Formula"
                  className="underline hover:text-gray-200"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  UESP Wiki — The Complete Damage Formula
                </a>
                .
              </p>
              <p>
                The Elder Scrolls and Oblivion are trademarks of Bethesda Softworks LLC, a ZeniMax
                Media company.
              </p>
              <p>This site is fan-made and not affiliated with Bethesda.</p>
            </div>
            <div className="flex w-full justify-end">
              <a
                href="https://github.com/ScottMcDermid/oblivion-damage-calculator"
                className="inline-flex items-center gap-2 rounded-md border border-transparent px-3 py-1 text-xs font-medium text-gray-400 transition hover:border-gray-600 hover:text-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-200"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="h-4 w-4 fill-current"
                  focusable="false"
                >
                  <path d="M12 .297C5.375.297 0 5.67 0 12.297c0 5.302 3.438 9.799 8.205 11.387.6.112.82-.26.82-.577 0-.285-.01-1.04-.015-2.04-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.746.083-.73.083-.73 1.203.085 1.836 1.236 1.836 1.236 1.07 1.835 2.808 1.305 3.492.998.108-.775.418-1.305.762-1.606-2.665-.303-5.467-1.334-5.467-5.934 0-1.31.469-2.38 1.236-3.22-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.3 1.23a11.47 11.47 0 0 1 3.003-.404c1.02.005 2.047.138 3.003.404 2.292-1.552 3.298-1.23 3.298-1.23.653 1.653.242 2.873.118 3.176.77.84 1.235 1.91 1.235 3.22 0 4.61-2.807 5.628-5.48 5.923.43.37.823 1.096.823 2.21 0 1.595-.015 2.882-.015 3.274 0 .32.22.694.825.576C20.565 22.092 24 17.597 24 12.297 24 5.67 18.627.297 12 .297z" />
                </svg>
                <span className="uppercase tracking-wide">GitHub</span>
              </a>
            </div>
          </div>
        </footer>
        </div>
        <SettingsDrawer
          open={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          isRemastered={isRemastered}
          onRemasteredChange={setIsRemastered}
          difficulty={difficulty}
          onDifficultyChange={setDifficulty}
        />

        <Dialog open={isResetOpen} onClose={() => setIsResetOpen(false)}>
          <DialogTitle>Reset all values?</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ fontSize: '0.875rem' }}>
              This will reset all sliders and settings to their defaults.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsResetOpen(false)} size="small">
              Cancel
            </Button>
            <Button onClick={handleReset} size="small" color="error" variant="contained">
              Reset
            </Button>
          </DialogActions>
        </Dialog>
      </ThemeProvider>
    </StyledEngineProvider>
  );
}
