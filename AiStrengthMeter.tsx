import React, { useRef, useState, useCallback } from 'react';
import { Cpu, Zap } from 'lucide-react';

interface AiStrengthMeterProps {
  value: number; // 1 to 100
  onChange: (val: number) => void;
  disabled?: boolean;
}

export const AiStrengthMeter: React.FC<AiStrengthMeterProps> = React.memo(({
  value,
  onChange,
  disabled = false,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Calibrated 6-zone classification according to CAISSA specifications:
  //  1–15%: BEGINNER
  // 16–35%: DEVELOPING
  // 36–55%: INTERMEDIATE
  // 56–75%: ADVANCED
  // 76–90%: EXPERT
  // 91–100%: MASTER
  const getZoneInfo = (v: number) => {
    const clamped = Math.max(1, Math.min(100, Math.round(v)));
    if (clamped <= 15) {
      return {
        zone: 'BEGINNER',
        color: '#10b981', // Emerald Green
        bgGlow: 'rgba(16, 185, 129, 0.35)',
        textClass: 'text-emerald-400',
      };
    }
    if (clamped <= 35) {
      return {
        zone: 'DEVELOPING',
        color: '#06b6d4', // Cyan
        bgGlow: 'rgba(6, 182, 212, 0.35)',
        textClass: 'text-cyan-400',
      };
    }
    if (clamped <= 55) {
      return {
        zone: 'INTERMEDIATE',
        color: '#eab308', // Amber / Yellow
        bgGlow: 'rgba(234, 179, 8, 0.35)',
        textClass: 'text-yellow-400',
      };
    }
    if (clamped <= 75) {
      return {
        zone: 'ADVANCED',
        color: '#f97316', // Orange
        bgGlow: 'rgba(249, 115, 22, 0.35)',
        textClass: 'text-orange-400',
      };
    }
    if (clamped <= 90) {
      return {
        zone: 'EXPERT',
        color: '#f43f5e', // Rose
        bgGlow: 'rgba(244, 63, 94, 0.35)',
        textClass: 'text-rose-400',
      };
    }
    return {
      zone: 'MASTER',
      color: '#ef4444', // Red
      bgGlow: 'rgba(239, 68, 68, 0.45)',
      textClass: 'text-red-400',
    };
  };

  const currentInfo = getZoneInfo(value);

  const updateFromPointer = useCallback(
    (clientX: number) => {
      if (!trackRef.current || disabled) return;
      const rect = trackRef.current.getBoundingClientRect();
      const rawPct = (clientX - rect.left) / rect.width;
      const clampedPct = Math.max(0, Math.min(1, rawPct));
      const newVal = Math.max(1, Math.min(100, Math.round(clampedPct * 99) + 1));
      onChange(newVal);
    },
    [disabled, onChange]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    setIsDragging(true);
    updateFromPointer(e.clientX);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || disabled) return;
    updateFromPointer(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // safe fallback
    }
  };

  return (
    <div
      id="ai-strength-meter-container"
      className="w-full bg-gradient-to-b from-stone-900/95 to-stone-950/95 border border-stone-800/90 rounded-2xl p-4 shadow-xl select-none"
    >
      {/* Header Info */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center border border-stone-700/60 transition-colors"
            style={{ backgroundColor: `${currentInfo.color}15` }}
          >
            <Cpu className="w-3.5 h-3.5 transition-colors" style={{ color: currentInfo.color }} />
          </div>
          <span className="text-[11px] font-bold tracking-wider uppercase text-stone-300">
            Engine Strength
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full transition-all duration-300"
            style={{
              backgroundColor: currentInfo.color,
              boxShadow: `0 0 10px ${currentInfo.color}`,
            }}
          />
          <span
            className="text-xs font-mono font-bold tracking-tight transition-colors duration-200"
            style={{ color: currentInfo.color }}
          >
            {value}% • {currentInfo.zone}
          </span>
        </div>
      </div>

      {/* Interactive Meter Track */}
      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`relative h-6 flex items-center cursor-pointer touch-none ${
          disabled ? 'opacity-40 cursor-not-allowed' : ''
        }`}
      >
        {/* Track Base Channel */}
        <div className="w-full h-3 rounded-full bg-stone-950 border border-stone-800 relative overflow-hidden shadow-inner">
          {/* Continuous Spectrum Gradient across 6 calibrated zones */}
          <div
            className="absolute inset-0 opacity-80"
            style={{
              background:
                'linear-gradient(90deg, #10b981 0%, #06b6d4 25%, #eab308 50%, #f97316 75%, #f43f5e 90%, #ef4444 100%)',
            }}
          />

          {/* Unfilled Dimmer Overlay */}
          <div
            className="absolute top-0 bottom-0 right-0 bg-stone-950/80 transition-all duration-75"
            style={{ width: `${100 - value}%` }}
          />

          {/* Precision Micro Segment Ticks */}
          <div className="absolute inset-0 flex justify-between px-1 pointer-events-none opacity-40">
            {Array.from({ length: 21 }).map((_, i) => (
              <div
                key={i}
                className={`w-[1px] h-full ${i % 5 === 0 ? 'bg-white/70 h-full' : 'bg-white/30 h-1.5 self-center'}`}
              />
            ))}
          </div>
        </div>

        {/* Dynamic Glow aura behind thumb */}
        <div
          className="absolute w-8 h-8 rounded-full pointer-events-none -translate-x-1/2 transition-transform duration-75 blur-md opacity-70"
          style={{
            left: `${value}%`,
            backgroundColor: currentInfo.color,
          }}
        />

        {/* Draggable Thumb */}
        <div
          className="absolute w-6 h-6 rounded-full -translate-x-1/2 transition-transform duration-75 pointer-events-none shadow-2xl flex items-center justify-center border-2 border-stone-100"
          style={{
            left: `${value}%`,
            backgroundColor: currentInfo.color,
            boxShadow: `0 0 16px ${currentInfo.color}, 0 2px 8px rgba(0,0,0,0.8)`,
          }}
        >
          <div className="w-2 h-2 rounded-full bg-stone-950/90 shadow-inner" />
        </div>
      </div>

      {/* Bottom Spectrum Zone Legend - 6 Calibrated Zones */}
      <div className="flex justify-between items-center text-[9px] font-semibold tracking-wider uppercase mt-2.5 px-0.5 select-none">
        <span
          className={`transition-colors duration-200 ${
            value <= 15 ? 'text-emerald-400 font-bold drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'text-stone-500'
          }`}
        >
          Beginner
        </span>
        <span
          className={`transition-colors duration-200 ${
            value >= 16 && value <= 35 ? 'text-cyan-400 font-bold drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]' : 'text-stone-500'
          }`}
        >
          Developing
        </span>
        <span
          className={`transition-colors duration-200 ${
            value >= 36 && value <= 55 ? 'text-yellow-400 font-bold drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]' : 'text-stone-500'
          }`}
        >
          Intermediate
        </span>
        <span
          className={`transition-colors duration-200 ${
            value >= 56 && value <= 75 ? 'text-orange-400 font-bold drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]' : 'text-stone-500'
          }`}
        >
          Advanced
        </span>
        <span
          className={`transition-colors duration-200 ${
            value >= 76 && value <= 90 ? 'text-rose-400 font-bold drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]' : 'text-stone-500'
          }`}
        >
          Expert
        </span>
        <span
          className={`transition-colors duration-200 ${
            value >= 91 ? 'text-red-400 font-bold drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 'text-stone-500'
          }`}
        >
          Master
        </span>
      </div>
    </div>
  );
});
