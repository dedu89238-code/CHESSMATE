import React from 'react';
import { X, Volume2, VolumeX, Eye, Sparkles, Sliders, Palette } from 'lucide-react';
import { BoardTheme, GameMode, GameSettings, PlayerColor, TimeControl } from '../types/chess';
import { AiStrengthMeter } from './AiStrengthMeter';
import { PWAInstallButton } from './PWAInstallButton';

interface SettingsModalProps {
  settings: GameSettings;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (newSettings: GameSettings) => void;
}

const THEME_OPTIONS: { id: BoardTheme; name: string; lightBg: string; darkBg: string }[] = [
  { id: 'wood', name: 'Classic Wood', lightBg: '#f0d9b5', darkBg: '#b58863' },
  { id: 'emerald', name: 'Emerald', lightBg: '#ebecd0', darkBg: '#739552' },
  { id: 'slate', name: 'Midnight Slate', lightBg: '#e2e8f0', darkBg: '#475569' },
  { id: 'blue', name: 'Tournament Blue', lightBg: '#cee0ec', darkBg: '#4e78a4' },
  { id: 'coral', name: 'Coral Rose', lightBg: '#f7dfd4', darkBg: '#b86b77' },
];

const TIME_OPTIONS: { id: TimeControl; name: string }[] = [
  { id: 'none', name: 'Casual (No Timer)' },
  { id: '1', name: '1 Min Bullet' },
  { id: '3', name: '3 Min Blitz' },
  { id: '5', name: '5 Min Rapid' },
  { id: '10', name: '10 Min Classical' },
  { id: '15', name: '15 Min Standard' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  isOpen,
  onClose,
  onUpdate,
}) => {
  if (!isOpen) return null;

  const handleChange = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    onUpdate({ ...settings, [key]: value });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-white">Game Settings</h2>
          </div>
          <button
            id="close-settings-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6 pt-4">
          {/* Game Mode */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
              Game Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="mode-ai"
                onClick={() => handleChange('gameMode', 'ai')}
                className={`py-2 px-3 rounded-xl border text-sm font-medium transition ${
                  settings.gameMode === 'ai'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                vs Computer (AI)
              </button>
              <button
                type="button"
                id="mode-pvp"
                onClick={() => handleChange('gameMode', 'pvp')}
                className={`py-2 px-3 rounded-xl border text-sm font-medium transition ${
                  settings.gameMode === 'pvp'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Two Players (PvP)
              </button>
            </div>
          </div>

          {/* AI Strength Meter (only when vs AI) */}
          {settings.gameMode === 'ai' && (
            <div>
              <AiStrengthMeter
                value={settings.aiStrength}
                onChange={val => handleChange('aiStrength', val)}
              />
            </div>
          )}

          {/* Play as Color (only in vs AI) */}
          {settings.gameMode === 'ai' && (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                Play As
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'w', label: 'White' },
                  { id: 'b', label: 'Black' },
                  { id: 'random', label: 'Random' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleChange('playerColor', opt.id as PlayerColor)}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                      settings.playerColor === opt.id
                        ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Time Control */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
              Time Control
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TIME_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleChange('timeControl', opt.id)}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-medium transition text-center ${
                    settings.timeControl === opt.id
                      ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {opt.name}
                </button>
              ))}
            </div>
          </div>

          {/* Board Theme */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
              <Palette className="w-3.5 h-3.5 text-amber-500" />
              Board Theme
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {THEME_OPTIONS.map(theme => (
                <button
                  key={theme.id}
                  type="button"
                  id={`theme-${theme.id}`}
                  onClick={() => handleChange('boardTheme', theme.id)}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border transition ${
                    settings.boardTheme === theme.id
                      ? 'bg-amber-500/15 border-amber-500 text-white'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-700/60'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-600 flex flex-col flex-shrink-0">
                    <div className="h-1/2 flex">
                      <div className="w-1/2" style={{ backgroundColor: theme.lightBg }} />
                      <div className="w-1/2" style={{ backgroundColor: theme.darkBg }} />
                    </div>
                    <div className="h-1/2 flex">
                      <div className="w-1/2" style={{ backgroundColor: theme.darkBg }} />
                      <div className="w-1/2" style={{ backgroundColor: theme.lightBg }} />
                    </div>
                  </div>
                  <span className="text-xs font-semibold">{theme.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            {/* Audio Toggle */}
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                {settings.soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-amber-500" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-500" />
                )}
                <span className="text-sm font-medium text-slate-300">Sound Effects</span>
              </div>
              <button
                type="button"
                id="sound-toggle-btn"
                onClick={() => handleChange('soundEnabled', !settings.soundEnabled)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  settings.soundEnabled ? 'bg-amber-500' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    settings.soundEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Legal Move Hints */}
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium text-slate-300">Show Legal Move Dots</span>
              </div>
              <button
                type="button"
                onClick={() => handleChange('showLegalMoves', !settings.showLegalMoves)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  settings.showLegalMoves ? 'bg-amber-500' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    settings.showLegalMoves ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Highlight Last Move */}
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium text-slate-300">Highlight Last Move</span>
              </div>
              <button
                type="button"
                onClick={() => handleChange('highlightLastMove', !settings.highlightLastMove)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  settings.highlightLastMove ? 'bg-amber-500' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    settings.highlightLastMove ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* PWA / App Installation */}
          <div>
            <PWAInstallButton variant="full" />
          </div>
        </div>

        {/* Footer */}
        <div className="pt-6 mt-4 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg transition"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
