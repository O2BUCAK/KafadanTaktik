import { useState } from 'react';
import { Player } from '../types';
import { getExtendedStats, getPlaystyleForRole, calculatePlayerOverall } from '../utils/playerHelpers';
import { TeamTheme } from '../data/teams';
import { Sparkles, Plus, Check, RefreshCw } from 'lucide-react';

interface PlayerCardProps {
  key?: string | number;
  player: Player;
  teamTheme: TeamTheme;
  isSelected?: boolean;
  onToggle?: () => void;
  showSelector?: boolean;
}

// Custom accurate vector Turkish flag
const TurkishFlag = () => (
  <svg className="w-5 h-3.5 rounded-sm border border-slate-200/50 shadow-[1px_1px_2px_rgba(0,0,0,0.1)]" viewBox="0 0 30 20">
    <rect width="30" height="20" fill="#E30A17" />
    <circle cx="10" cy="10" r="5" fill="#fff" />
    <circle cx="11.2" cy="10" r="4" fill="#E30A17" />
    {/* Clean, proper 5-point star */}
    <g transform="translate(15.2, 10) scale(0.12)">
      <polygon
        points="0,-10 2.9,-2.2 10.5,-2.2 4.3,2.2 6.7,10 0,5.3 -6.7,10 -4.3,2.2 -10.5,-2.2 -2.9,-2.2"
        fill="#fff"
      />
    </g>
  </svg>
);

// Dynamic soccer jersey of the team color with the player's actual number and hair styles
const SoccerJersey = ({ teamTheme, number }: { teamTheme: TeamTheme; number: number }) => (
  <div className="relative w-18 h-18 flex items-center justify-center bg-transparent mt-0.5">
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[2px_3px_5px_rgba(0,0,0,0.18)]">
      {/* Head & Neck */}
      <circle cx="50" cy="22" r="10" fill="#FAD1A0" />
      <rect x="47" y="30" width="6" height="6" fill="#FAD1A0" />
      
      {/* Hair (different styles based on number) */}
      {number % 3 === 0 ? (
        <path d="M38,20 C36,8 64,8 62,20 C58,16 42,16 38,20 Z" fill="#2E251E" />
      ) : number % 3 === 1 ? (
        <path d="M37,22 C37,12 63,12 63,22 C56,19 44,19 37,22 Z" fill="#4A3423" />
      ) : (
        <path d="M39,21 C39,11 61,11 61,21 C54,18 46,18 39,21 Z" fill="#1C1B1A" />
      )}
      
      {/* Jersey Shoulders & Body */}
      <path 
        d="M25,44 L34,36 L44,40 L56,40 L66,36 L75,44 L70,68 L64,68 L64,86 L36,86 L36,68 L30,68 Z" 
        fill={teamTheme.primaryBg} 
        stroke={teamTheme.secondaryBg} 
        strokeWidth="3.5" 
      />
      {/* Stripes to make the jersey look premium */}
      <path d="M42,42 L42,86 M50,42 L50,86 M58,42 L58,86" fill="none" stroke={teamTheme.secondaryBg} strokeWidth="1.5" opacity="0.35" />
      
      {/* Jersey Collar */}
      <path d="M44,40 C44,40 50,47 56,40" fill="none" stroke={teamTheme.secondaryBg} strokeWidth="3" />
      
      {/* Jersey Number */}
      <text 
        x="50" 
        y="70" 
        textAnchor="middle" 
        fill={teamTheme.textColor || '#FFFFFF'} 
        fontSize="18" 
        fontWeight="bold" 
        fontFamily="sans-serif"
      >
        {number}
      </text>
    </svg>
  </div>
);

// Gorgeous Ultimate Team themes based on overall player ratings
const CARD_THEMES = {
  GOLD: {
    border: 'from-[#E2B755] via-[#FFF3C3] to-[#A47E2F]',
    bg: 'from-[#FFFDF7] via-[#FDF9ED] to-[#FAF7EE]',
    textPrimary: 'text-[#4D3A12]',
    textSecondary: 'text-[#8B703F]',
    statLabel: 'text-[#8B703F]',
    statValue: 'text-[#4D3A12]',
    badgeBg: 'bg-[#FAF7EE] text-[#4D3A12] border-[#E2B755]',
    glow: 'shadow-[0_0_20px_rgba(226,183,85,0.25)]',
    nameColor: 'text-[#4D3A12]',
    sparkles: 'text-amber-500 animate-pulse'
  },
  SILVER: {
    border: 'from-slate-400 via-slate-100 to-slate-600',
    bg: 'from-[#FDFEFF] via-[#F4F8F9] to-[#E9F2F4]',
    textPrimary: 'text-[#1E293B]',
    textSecondary: 'text-[#64748B]',
    statLabel: 'text-[#64748B]',
    statValue: 'text-[#1E293B]',
    badgeBg: 'bg-white text-[#1E293B] border-slate-300',
    glow: 'shadow-[0_0_15px_rgba(148,163,184,0.2)]',
    nameColor: 'text-[#1E293B]',
    sparkles: 'text-sky-400'
  },
  BRONZE: {
    border: 'from-[#8C5E3C] via-[#E2A676] to-[#5C3B24]',
    bg: 'from-[#FFFDFC] via-[#FAF3ED] to-[#EADECF]',
    textPrimary: 'text-[#3E2312]',
    textSecondary: 'text-[#7D5337]',
    statLabel: 'text-[#7D5337]',
    statValue: 'text-[#3E2312]',
    badgeBg: 'bg-[#FAF3ED] text-[#3E2312] border-[#8C5E3C]',
    glow: 'shadow-[0_0_12px_rgba(140,94,60,0.15)]',
    nameColor: 'text-[#3E2312]',
    sparkles: 'text-[#8C5E3C]'
  }
};

export default function PlayerCard({
  player,
  teamTheme,
  isSelected = false,
  onToggle,
  showSelector = true
}: PlayerCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const extStats = getExtendedStats(player);
  const playstyle = getPlaystyleForRole(player.role, player.stats);
  const overallRating = calculatePlayerOverall(player);

  const themeKey = overallRating >= 85 ? 'GOLD' : overallRating >= 75 ? 'SILVER' : 'BRONZE';
  const cardT = CARD_THEMES[themeKey];

  // Clip styling path for authentic FIFA/Ultimate Team shield shape
  const shieldClipStyle = {
    clipPath: 'polygon(50% 0%, 100% 12%, 100% 82%, 50% 100%, 0% 82%, 0% 12%)'
  };

  // Border turns glowing coral if card is selected
  const borderGradient = isSelected 
    ? 'from-[#E75A51] via-red-200 to-[#E75A51]' 
    : cardT.border;

  // Render Turkish position shorthand (e.g. ST -> FV, OS -> OS, DF -> DF, GK -> KL)
  const positionShorthand = player.positionGroup === 'GK' ? 'KL' : player.positionGroup === 'DF' ? 'DF' : player.positionGroup === 'MF' ? 'OS' : 'FV';

  return (
    <div id={`player-card-container-${player.id}`} className="flex flex-col gap-2 items-center w-full max-w-[215px] mx-auto">
      {/* 1. Shield Design */}
      <div
        id={`fut-card-${player.id}`}
        onClick={onToggle}
        className={`
          relative w-[210px] h-[290px] transition-all duration-300 transform hover:scale-[1.03] select-none cursor-pointer flex-shrink-0
          ${isSelected ? 'drop-shadow-[0_0_15px_rgba(231,90,81,0.6)]' : 'drop-shadow-[0_6px_8px_rgba(0,0,0,0.12)]'}
        `}
      >
        {/* Outer Border Container (Clipped as Shield) */}
        <div 
          className={`absolute inset-0 bg-gradient-to-br transition-all duration-300 ${borderGradient}`} 
          style={shieldClipStyle}
        >
          {/* Inner Content Card (Clipped slightly smaller to show border line) */}
          <div 
            className={`absolute bg-gradient-to-b ${cardT.bg} flex flex-col justify-between pt-5 px-3.5 pb-4`}
            style={{
              ...shieldClipStyle,
              top: '3px',
              left: '3px',
              right: '3px',
              bottom: '3px',
              height: 'calc(100% - 6px)',
              width: 'calc(100% - 6px)'
            }}
          >
            {/* Top row: Stats details & Jersey representation */}
            <div className="flex justify-between items-start w-full relative">
              {/* OVR, Position, National Flag, Club Dot column */}
              <div className="flex flex-col items-center pl-1.5 pt-1.5 z-10">
                <span className={`text-2xl font-black font-display tracking-tight leading-none ${cardT.textPrimary}`}>
                  {overallRating}
                </span>
                <span className={`text-[10px] font-black uppercase tracking-wider leading-none mt-1 ${cardT.textSecondary}`}>
                  {positionShorthand}
                </span>
                {/* SVG National Flag */}
                <div className="mt-2">
                  <TurkishFlag />
                </div>
                {/* Team Dot Badge */}
                <div 
                  className="w-4 h-4 rounded-full mt-1.5 border border-black/50 shadow-inner flex items-center justify-center" 
                  style={{ 
                    backgroundColor: teamTheme.primaryBg,
                    borderColor: teamTheme.secondaryBg 
                  }}
                  title={teamTheme.name}
                >
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: teamTheme.secondaryBg }} />
                </div>
              </div>

              {/* Dynamic Jersey Section */}
              <div className="flex-1 flex justify-center items-center z-10 pr-1">
                <SoccerJersey teamTheme={teamTheme} number={player.number} />
              </div>

              {/* Detailed Stat Transition Toggle Button */}
              <button
                id={`toggle-stats-${player.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDetails(prev => !prev);
                }}
                className={`absolute p-1 rounded-md border transition-all hover:scale-105 cursor-pointer flex items-center justify-center shadow-xs z-20 hover:bg-orange-50/50
                  ${cardT.badgeBg}
                `}
                style={{ top: '4px', right: '4px' }}
                title="Yetenek Görünümünü Değiştir"
              >
                <RefreshCw className="w-2.5 h-2.5" />
              </button>
            </div>

            {/* Middle Section: Player Name & Playstyle */}
            <div className="text-center mt-1 w-full z-10">
              {/* uppercase display name */}
              <h3 className={`font-display font-black text-sm tracking-tight leading-none uppercase ${cardT.nameColor} truncate`}>
                {player.name.replace(/^[^\s]+\s+/, '') || player.name} 
              </h3>
              
              {/* Real life position/detailed role */}
              <p className={`text-[9.5px] font-medium leading-none mt-1 opacity-70 truncate`}>
                {player.role}
              </p>

              {/* Playstyle pill */}
              <div className={`mx-auto text-[8px] font-black uppercase tracking-wider px-2 py-0.5 mt-1.5 rounded-full border border-dashed flex items-center justify-center gap-0.5 w-max
                ${cardT.badgeBg}
              `}>
                <Sparkles className={`w-2.5 h-2.5 ${cardT.sparkles}`} />
                <span>{playstyle.name}</span>
              </div>
            </div>

            {/* Bottom Section: Grid of attributes */}
            <div className={`w-full border-t border-[#0C251C]/10 mt-1.5 pt-1.5 pb-2.5 z-10`}>
              {!showDetails ? (
                /* Classic FIFA 6 stats */
                <div className="grid grid-cols-2 gap-x-2 text-center relative font-display">
                  {/* Vertical separator line */}
                  <div className="absolute top-[10%] bottom-[10%] left-1/2 w-[1px] bg-[#0C251C]/10" />
                  
                  {/* Left stats */}
                  <div className="flex flex-col gap-0.5 items-end pr-4">
                    <div className="flex items-center gap-1.5">
                      <strong className={`font-mono text-xs font-extrabold ${cardT.statValue}`}>{player.stats.hiz}</strong>
                      <span className={`text-[8.5px] font-black ${cardT.statLabel}`}>HIZ</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <strong className={`font-mono text-xs font-extrabold ${cardT.statValue}`}>{player.stats.sut}</strong>
                      <span className={`text-[8.5px] font-black ${cardT.statLabel}`}>ŞUT</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <strong className={`font-mono text-xs font-extrabold ${cardT.statValue}`}>{player.stats.pas}</strong>
                      <span className={`text-[8.5px] font-black ${cardT.statLabel}`}>PAS</span>
                    </div>
                  </div>

                  {/* Right stats */}
                  <div className="flex flex-col gap-0.5 items-start pl-4">
                    <div className="flex items-center gap-1.5">
                      <strong className={`font-mono text-xs font-extrabold ${cardT.statValue}`}>{player.stats.teknik}</strong>
                      <span className={`text-[8.5px] font-black ${cardT.statLabel}`}>DRI</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <strong className={`font-mono text-xs font-extrabold ${cardT.statValue}`}>{player.stats.savunma}</strong>
                      <span className={`text-[8.5px] font-black ${cardT.statLabel}`}>DEF</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <strong className={`font-mono text-xs font-extrabold ${cardT.statValue}`}>{player.stats.guc}</strong>
                      <span className={`text-[8.5px] font-black ${cardT.statLabel}`}>FİZ</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Extended Board Game stats */
                <div className="grid grid-cols-2 gap-x-2 text-center relative font-display">
                  {/* Vertical separator line */}
                  <div className="absolute top-[10%] bottom-[10%] left-1/2 w-[1px] bg-[#0C251C]/15" />
                  
                  {/* Left detailed stats */}
                  <div className="flex flex-col gap-0.5 items-end pr-4">
                    <div className="flex items-center gap-1.5" title="Çeviklik">
                      <strong className={`font-mono text-xs font-extrabold ${cardT.statValue}`}>{extStats.ceviklik}</strong>
                      <span className={`text-[8.5px] font-black ${cardT.statLabel}`}>ÇEV</span>
                    </div>
                    <div className="flex items-center gap-1.5" title="Dayanıklılık">
                      <strong className={`font-mono text-xs font-extrabold ${cardT.statValue}`}>{extStats.dayaniklilik}</strong>
                      <span className={`text-[8.5px] font-black ${cardT.statLabel}`}>DYN</span>
                    </div>
                    <div className="flex items-center gap-1.5" title="Karar Verme">
                      <strong className={`font-mono text-xs font-extrabold ${cardT.statValue}`}>{extStats.kararVerme}</strong>
                      <span className={`text-[8.5px] font-black ${cardT.statLabel}`}>KRV</span>
                    </div>
                  </div>

                  {/* Right detailed stats */}
                  <div className="flex flex-col gap-0.5 items-start pl-4">
                    <div className="flex items-center gap-1.5" title="Hava Hakimiyeti">
                      <strong className={`font-mono text-xs font-extrabold ${cardT.statValue}`}>{extStats.havaHakimiyeti}</strong>
                      <span className={`text-[8.5px] font-black ${cardT.statLabel}`}>HVH</span>
                    </div>
                    <div className="flex items-center gap-1.5" title="Vizyon">
                      <strong className={`font-mono text-xs font-extrabold ${cardT.statValue}`}>{extStats.vizyon}</strong>
                      <span className={`text-[8.5px] font-black ${cardT.statLabel}`}>VZN</span>
                    </div>
                    <div className="flex items-center gap-1.5" title="Top Kapma">
                      <strong className={`font-mono text-xs font-extrabold ${cardT.statValue}`}>{extStats.topKapma}</strong>
                      <span className={`text-[8.5px] font-black ${cardT.statLabel}`}>TPK</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* 2. Interactive Selection Button underneath the card */}
      {showSelector && (
        <div className="w-full mt-1.5 flex justify-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggle?.();
            }}
            className={`
              w-full py-1.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 border-2 border-[#0C251C] shadow-[2px_2px_0px_0px_#0C251C] cursor-pointer
              ${isSelected 
                ? 'bg-emerald-700 text-white shadow-none translate-x-[2px] translate-y-[2px] border-emerald-800' 
                : 'bg-[#FFFDF7] text-[#0C251C] hover:bg-[#FAF7EE]'
              }
            `}
          >
            {isSelected ? (
              <>
                <Check className="w-3.5 h-3.5 text-white stroke-[3.5]" />
                <span>✓ SEÇİLDİ</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5 text-[#0C251C] stroke-[3.5]" />
                <span>İLK 11'E AL</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
