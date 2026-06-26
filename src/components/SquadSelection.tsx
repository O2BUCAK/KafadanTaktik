/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TeamTheme, TEAMS } from '../data/teams';
import { 
  Users, Cpu, Palette, ArrowRight, Info, Shield, HelpCircle, Sparkles, Globe
} from 'lucide-react';
import KafadanTaktikLogo from './KafadanTaktikLogo';
import OnlineLobby from './OnlineLobby';

interface SquadSelectionProps {
  isVsAI: boolean;
  isOnlineMode: boolean;
  onSelectMode: (isVsAI: boolean, isOnlineMode: boolean) => void;
  onConfirmStartingSquads: (blackSquad: any[], whiteSquad: any[]) => void;
  teamATheme: TeamTheme;
  teamBTheme: TeamTheme;
  onChangeTeamATheme: (theme: TeamTheme) => void;
  onChangeTeamBTheme: (theme: TeamTheme) => void;
  blackSquad: any[];
  whiteSquad: any[];
  onMatchConnected: (matchId: string, isHost: boolean, myTeam: 'Siyah' | 'Beyaz', activeTheme: TeamTheme, opponentTheme: TeamTheme) => void;
}

export default function SquadSelection({
  isVsAI,
  isOnlineMode,
  onSelectMode,
  onConfirmStartingSquads,
  teamATheme,
  teamBTheme,
  onChangeTeamATheme,
  onChangeTeamBTheme,
  blackSquad,
  whiteSquad,
  onMatchConnected,
}: SquadSelectionProps) {

  const handleStartGame = () => {
    onConfirmStartingSquads(blackSquad, whiteSquad);
  };

  return (
    <div id="squad-selection-container" className="tabletop-card max-w-4xl mx-auto overflow-hidden animate-fade-in my-6">
      
      {/* 1. Nice Title Header Banner featuring custom design logo */}
      <div id="mode-select-banner" className="bg-[#0C251C] p-6 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-6 relative">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-32 h-32 shrink-0 bg-white p-1 rounded-2xl border-4 border-[#0C251C] shadow-lg rotate-[-2deg] hover:rotate-[2deg] transition-all duration-300">
            <KafadanTaktikLogo size="100%" />
          </div>
          <div>
            <div className="bg-[#E75A51] px-3 py-1 rounded text-[10px] font-black tracking-widest uppercase inline-block mb-1.5 font-display text-white border border-black/20">
              Kafadan Taktik • Kurulum Ekranı
            </div>
            <h1 className="text-3xl font-black font-display tracking-tight text-white uppercase italic flex items-center justify-center md:justify-start gap-2">
              Futbol Taktik & Zar Oyunu
            </h1>
            <p className="text-[#FAF7EE] opacity-90 text-xs mt-1.5 max-w-md leading-relaxed font-medium">
              Masaüstü taktik futbol oyunu kuralları ile 21x13 kare saha üzerinde d20 şans ve strateji zarlarının fırlatıldığı masaüstü rekabet!
            </p>
          </div>
        </div>

        {/* Game Mode Selector Buttons */}
        <div id="mode-selector-buttons" className="flex flex-wrap items-center gap-2 bg-[#081812] p-1.5 rounded-xl border border-[#FAF7EE]/10 shrink-0 shadow-inner">
          <button
            id="vs-ai-mode"
            type="button"
            onClick={() => onSelectMode(true, false)}
            className={`flex items-center gap-2 py-2 px-3.5 rounded-lg font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer
              ${isVsAI && !isOnlineMode 
                ? 'bg-[#FAF7EE] text-[#0C251C] shadow-md border-b-2 border-slate-300' 
                : 'text-[#FAF7EE]/70 hover:text-white hover:bg-white/10'
              }
            `}
          >
            <Cpu className="w-4 h-4" />
            Tek Oyunculu (A.I)
          </button>
          <button
            id="vs-pvp-mode"
            type="button"
            onClick={() => onSelectMode(false, false)}
            className={`flex items-center gap-2 py-2 px-3.5 rounded-lg font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer
              ${!isVsAI && !isOnlineMode 
                ? 'bg-[#FAF7EE] text-[#0C251C] shadow-md border-b-2 border-slate-300' 
                : 'text-[#FAF7EE]/70 hover:text-[#FAF7EE] hover:bg-white/10'
              }
            `}
          >
            <Users className="w-4 h-4" />
            İki Oyunculu (Yerel)
          </button>
          <button
            id="vs-online-mode"
            type="button"
            onClick={() => onSelectMode(false, true)}
            className={`flex items-center gap-2 py-2 px-3.5 rounded-lg font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer
              ${isOnlineMode 
                ? 'bg-[#FAF7EE] text-[#0C251C] shadow-md border-b-2 border-slate-300' 
                : 'text-[#FAF7EE]/70 hover:text-white hover:bg-white/10'
              }
            `}
          >
            <Globe className="w-4 h-4" />
            Online Karşılıklı
          </button>
        </div>
      </div>

      {isOnlineMode ? (
        <OnlineLobby
          onMatchConnected={onMatchConnected}
          teamATheme={teamATheme}
          teamBTheme={teamBTheme}
          setTeamATheme={onChangeTeamATheme}
          setTeamBTheme={onChangeTeamBTheme}
        />
      ) : (
        <>
          {/* 2. Team Design Section */}
          <div id="team-setup-grid" className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8  bg-[#FAF7EE]/30">
        
        {/* TEAM A: HOME */}
        <div id="home-team-box" className="p-5 rounded-xl border-2 border-[#0C251C] bg-[#FFFDF7] flex flex-col gap-5 shadow-sm">
          <div className="flex items-center justify-between border-b-2 border-[#0C251C]/10 pb-3">
            <h2 className="text-sm font-black uppercase tracking-wider text-[#0C251C] flex items-center gap-2">
              <span className="w-4 h-4 rounded-full border-2 border-black/20" style={{ backgroundColor: teamATheme.primaryBg }} />
              1. TAKIM (EV SAHİBİ)
            </h2>
            <span className="text-[10px] uppercase font-bold text-emerald-800 px-2.5 py-0.5 rounded bg-emerald-50 border-2 border-[#0C251C]/10">
              Siyah Kura Modu
            </span>
          </div>

          {/* Large Jersey Card Preview */}
          <div className="bg-[#FAF7EE] rounded-lg p-5 border-2 border-[#0C251C]/10 flex flex-col items-center justify-center text-center py-6 relative overflow-hidden group">
            <div className="absolute top-2 right-2 text-slate-500 text-[10px] font-mono">
               Jersey #A
            </div>
            {/* Minimal soccer jersey shape */}
            <div className="w-16 h-16 rounded-t-xl relative flex items-center justify-center shadow-md transition-transform group-hover:scale-105 border-2 border-[#0C251C]" 
                 style={{ 
                   background: `linear-gradient(135deg, ${teamATheme.primaryBg} 0%, ${teamATheme.primaryBg} 50%, ${teamATheme.secondaryBg} 50%, ${teamATheme.secondaryBg} 100%)`
                 }}>
              <span className="font-extrabold text-lg select-none font-mono text-white" style={{ textShadow: '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000' }}>10</span>
            </div>
            
            <h3 className="text-[#0C251C] text-lg font-black font-display uppercase tracking-wide mt-4">{teamATheme.name}</h3>
            <p className="text-slate-650 text-xs mt-1 max-w-[280px]">25 kişilik geniş kadro havuzu kura sonrasında tahtaya yerleşmek için hazır olacak.</p>
          </div>

          {/* Theme Selector */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-505 text-slate-500 uppercase tracking-widest flex items-center gap-1.5 font-mono">
              <Palette className="w-3.5 h-3.5 text-[#E75A51]" />
              Takım & Renk Seçin
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TEAMS.map(t => (
                <button
                  key={`custom-theme-a-${t.id}`}
                  type="button"
                  onClick={() => onChangeTeamATheme(t)}
                  className={`p-2 rounded-lg text-xs font-black border-2 transition-all text-left flex items-center gap-2 cursor-pointer
                    ${teamATheme.id === t.id 
                      ? 'bg-orange-50 border-[#FAF7EE] text-[#0C251C] ring-4 ring-[#0C251C]' 
                      : 'bg-white border-[#0C251C]/10 text-slate-600 hover:text-[#0C251C] hover:border-[#0C251C]'
                    }
                  `}
                >
                  <span className="w-3.5 h-3.5 rounded-full border border-black/30 shrink-0" style={{ backgroundColor: t.primaryBg, border: `1.5px solid ${t.secondaryBg}` }}></span>
                  <span className="truncate">{t.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* TEAM B: AWAY */}
        <div id="away-team-box" className="p-5 rounded-xl border-2 border-[#0C251C] bg-[#FFFDF7] flex flex-col gap-5 shadow-sm">
          <div className="flex items-center justify-between border-b-2 border-[#0C251C]/10 pb-3">
            <h2 className="text-sm font-black uppercase tracking-wider text-[#0C251C] flex items-center gap-2">
              <span className="w-4 h-4 rounded-full border-2 border-black/20" style={{ backgroundColor: teamBTheme.primaryBg }} />
              2. TAKIM ({isVsAI ? 'YAPAY ZEKA' : 'DEPLASMAN'})
            </h2>
            <span className="text-[10px] uppercase font-bold text-indigo-800 px-2.5 py-0.5 rounded bg-indigo-50 border-2 border-[#0C251C]/10">
              Beyaz Kura Modu
            </span>
          </div>

          {/* Large Jersey Card Preview */}
          <div className="bg-[#FAF7EE] rounded-lg p-5 border-2 border-[#0C251C]/10 flex flex-col items-center justify-center text-center py-6 relative overflow-hidden group">
            <div className="absolute top-2 right-2 text-slate-500 text-[10px] font-mono">
              {isVsAI ? '🤖 Jersey #B' : 'Jersey #B'}
            </div>
            {/* Minimal soccer jersey shape */}
            <div className="w-16 h-16 rounded-t-xl relative flex items-center justify-center shadow-md transition-transform group-hover:scale-105 border-2 border-[#0C251C]" 
                 style={{ 
                   background: `linear-gradient(135deg, ${teamBTheme.primaryBg} 0%, ${teamBTheme.primaryBg} 50%, ${teamBTheme.secondaryBg} 50%, ${teamBTheme.secondaryBg} 100%)`
                 }}>
              <span className="font-extrabold text-lg select-none font-mono text-white" style={{ textShadow: '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000' }}>9</span>
            </div>
            
            <h3 className="text-[#0C251C] text-lg font-black font-display uppercase tracking-wide mt-4">{teamBTheme.name}</h3>
            <p className="text-slate-650 text-xs mt-1 max-w-[280px]">
              {isVsAI 
                ? 'Yapay zeka zarlara ve sizin yerleşim hamlelerinize göre kura sonrası taktiksel olarak sahaya yayılacaktır.'
                : '25 kişilik deplasman havuzu kura atışlarından sonra tahtaya yerleşmek için hazır olacak.'
              }
            </p>
          </div>

          {/* Theme Selector */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-505 text-slate-500 uppercase tracking-widest flex items-center gap-1.5 font-mono">
              <Palette className="w-3.5 h-3.5 text-[#E75A51]" />
              Takım & Renk Seçin
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TEAMS.map(t => (
                <button
                  key={`custom-theme-b-${t.id}`}
                  type="button"
                  onClick={() => onChangeTeamBTheme(t)}
                  className={`p-2 rounded-lg text-xs font-black border-2 transition-all text-left flex items-center gap-2 cursor-pointer
                    ${teamBTheme.id === t.id 
                      ? 'bg-orange-50 border-[#FAF7EE] text-[#0C251C] ring-4 ring-[#0C251C]' 
                      : 'bg-white border-[#0C251C]/10 text-slate-600 hover:text-[#0C251C] hover:border-[#0C251C]'
                    }
                  `}
                >
                  <span className="w-3.5 h-3.5 rounded-full border border-black/30 shrink-0" style={{ backgroundColor: t.primaryBg, border: `1.5px solid ${t.secondaryBg}` }}></span>
                  <span className="truncate">{t.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* 3. Guide & Rules Brief */}
      <div className="p-5 px-8 bg-[#FAF7EE]/60 border-t-2 border-[#0C251C]/10 grid grid-cols-1 md:grid-cols-3 gap-6 text-[#0C251C]/70 text-xs">
        <div className="space-y-1">
          <h4 className="text-[#0C251C] font-black text-[11px] uppercase tracking-wider flex items-center gap-1">
            <span className="text-[#E75A51]">1.</span> Başlama Zarı (Kura Atışı)
          </h4>
          <p className="leading-relaxed font-medium">Oyun başlamadan önce taraflar 20'lik d20 fiziksel zarı fırlatarak ilk yerleşim önceliği ve başlama hakkını belirler.</p>
        </div>
        <div className="space-y-1">
          <h4 className="text-[#0C251C] font-black text-[11px] uppercase tracking-wider flex items-center gap-1">
            <span className="text-[#E75A51]">2.</span> Taktiksel Yerleşim Aşaması
          </h4>
          <p className="leading-relaxed font-medium font-medium">Geniş 25 kişilik kadronuzdan sırasıyla 1'er oyuncuyu sahaya yerleştirip taktiksel kurgunuzu belirleyin.</p>
        </div>
        <div className="space-y-1">
          <h4 className="text-[#0C251C] font-black text-[11px] uppercase tracking-wider flex items-center gap-1">
            <span className="text-[#E75A51]">3.</span> Pas, Çalım ve Şut Aksiyonları
          </h4>
          <p className="leading-relaxed font-medium">Planlanan taktiksel eylemleri çözmek için fırlatılacak d20 zarları, yetenek puanlarıyla birleşip galibi belirler.</p>
        </div>
      </div>

      {/* 4. Action Footer */}
      <div id="setup-footer" className="p-6 bg-[#FAF7EE]/90 border-t-2 border-[#0C251C]/10 flex items-center justify-between gap-5 flex-wrap">
        <div className="flex items-center gap-2.5 text-xs text-slate-700 max-w-xl leading-normal font-medium">
          <Info className="w-4 h-4 text-[#E75A51] shrink-0" />
          <span>
            <strong>Masaüstü Rol Yapma Esintisi:</strong> Kafadan Taktik, klasik rol yapma oyunu zarlarını modern futbol taktiği ile birleştiren taze bir Türk strateji oyunudur.
          </span>
        </div>

        <button
          id="ready-to-toss-btn"
          onClick={handleStartGame}
          className="tabletop-btn-primary py-3.5 px-8 text-xs cursor-pointer flex items-center gap-2 flex-nowrap shrink-0"
        >
          <span>Renkleri Onayla & Zarlara Git</span>
          <ArrowRight className="w-4.5 h-4.5" />
        </button>
      </div>

    </>
    )}

    </div>
  );
}
