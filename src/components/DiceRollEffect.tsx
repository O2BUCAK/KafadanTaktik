import { Dice5, Trophy, Sparkles, AlertTriangle, HelpCircle } from 'lucide-react';
import { PerformanceBracket } from '../types';

interface DiceRollEffectProps {
  roll: number;
  statValue?: number;
  title: string;
  playerName: string;
  team: 'Siyah' | 'Beyaz';
  isRolling: boolean;
}

export const getPerformanceBracket = (roll: number): {
  type: PerformanceBracket;
  label: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
} => {
  if (roll <= 5) {
    return {
      type: 'WEAK',
      label: 'Zayıf Performans',
      colorClass: 'text-red-700',
      bgClass: 'bg-red-50',
      borderClass: 'border-red-350 border-red-300'
    };
  }
  if (roll <= 10) {
    return {
      type: 'MEDIUM',
      label: 'Orta Performans',
      colorClass: 'text-amber-80 * text-amber-800',
      bgClass: 'bg-amber-50',
      borderClass: 'border-amber-350 border-amber-300'
    };
  }
  if (roll <= 15) {
    return {
      type: 'GOOD',
      label: 'Stratejik Başarı',
      colorClass: 'text-blue-800',
      bgClass: 'bg-blue-50',
      borderClass: 'border-blue-350 border-blue-300'
    };
  }
  return {
    type: 'EXCELLENT',
    label: 'Kritik Darbe!',
    colorClass: 'text-emerald-800 font-extrabold',
    bgClass: 'bg-[#FAF7EE] animate-pulse',
    borderClass: 'border-emerald-400 border-2'
  };
};

export default function DiceRollEffect({
  roll,
  statValue = 10,
  title,
  playerName,
  team,
  isRolling,
}: DiceRollEffectProps) {
  const bracket = getPerformanceBracket(roll);
  const totalPower = roll + statValue;

  return (
    <div 
      id="dice-result-card" 
      className={`
        p-4 rounded-xl border-2 border-[#0C251C] transition-all duration-300 flex flex-col items-center justify-center text-center gap-2 max-w-xs w-full shadow-[4px_4px_0px_0px_#0C251C]
        ${isRolling ? 'rotate-animation' : ''}
        ${team === 'Siyah' 
          ? 'bg-amber-50/40 text-[#0C251C]' 
          : 'bg-orange-50/40 text-[#0C251C]'
        }
      `}
    >
      <div className="flex items-center gap-1.5 text-[10px] text-[#0C251C]/75 uppercase tracking-widest font-black">
        <Dice5 className={`w-3.5 h-3.5 ${isRolling ? 'animate-spin text-[#E75A51]' : ''}`} />
        <span>{title}</span>
      </div>

      <div className="font-extrabold text-xs text-[#0C251C] truncate max-w-full">
        {playerName}
      </div>

      {/* Dice Face rendering d20 shape */}
      <div className="relative my-2 w-16 h-16 flex items-center justify-center">
        {/* Polygon base for d20 inside styled div */}
        <div 
          className={`
            absolute inset-0 w-full h-full clip-d20 transition-all flex items-center justify-center border-2 rounded-xl
            ${isRolling ? 'bg-slate-200 animate-pulse animate-spin border-[#0C251C]' : bracket.bgClass + ' ' + bracket.borderClass}
          `}
        >
          <span className={`text-2xl font-black font-mono tracking-tight ${isRolling ? 'text-[#0C251C]/50' : bracket.colorClass}`}>
            {isRolling ? '?' : roll}
          </span>
        </div>
      </div>

      {/* Details breakdown */}
      {!isRolling && (
        <div className="flex flex-col items-center gap-1 w-full font-display font-medium">
          <div className="text-xs font-mono text-[#0C251C]/80">
            Zar: <span className="font-black">{roll}</span> + Yetenek: <span className="font-black">{statValue}</span>
          </div>
          <div className={`text-sm font-black mt-0.5 ${bracket.colorClass}`}>
            Hesaplanan Güç: {totalPower}
          </div>
          <div className={`text-[10px] px-2.5 py-1 rounded-full border border-[#0C251C]/20 mt-1 font-black uppercase
            ${bracket.colorClass} ${bracket.bgClass}
          `}>
            {bracket.label}
          </div>
        </div>
      )}

      {isRolling && (
        <div className="text-xs text-[#0C251C]/70 animate-pulse font-mono py-2">
          Zar Fırlatılıyor...
        </div>
      )}
    </div>
  );
}
