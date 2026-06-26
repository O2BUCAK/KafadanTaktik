import { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { Player, TeamColor } from '../types';
import { TeamTheme } from '../data/teams';
import { Shield, Check, Plus, Trash, ArrowRight, Sparkles, AlertCircle, HelpCircle } from 'lucide-react';
import { selectAIStartingEleven } from '../utils/ai';

interface SquadDraftScreenProps {
  isVsAI: boolean;
  isOnlineMode?: boolean;
  myOnlineTeam?: 'Siyah' | 'Beyaz' | null;
  currentDrafter?: TeamColor;
  onChangeDrafter?: (drafter: TeamColor) => void;
  blackSquad: Player[];
  whiteSquad: Player[];
  teamATheme: TeamTheme;
  teamBTheme: TeamTheme;
  draftBlackIds: string[];
  draftWhiteIds: string[];
  setDraftBlackIds: Dispatch<SetStateAction<string[]>>;
  setDraftWhiteIds: Dispatch<SetStateAction<string[]>>;
  onConfirmDraft: (black11: Player[], white11: Player[]) => void;
}

export default function SquadDraftScreen({
  isVsAI,
  isOnlineMode = false,
  myOnlineTeam = null,
  currentDrafter = 'Siyah',
  onChangeDrafter,
  blackSquad,
  whiteSquad,
  teamATheme,
  teamBTheme,
  draftBlackIds,
  draftWhiteIds,
  setDraftBlackIds,
  setDraftWhiteIds,
  onConfirmDraft
}: SquadDraftScreenProps) {
  const [filterPos, setFilterPos] = useState<'ALL' | 'GK' | 'DF' | 'MF' | 'FW'>('ALL');

  // Detect and auto-draft AI on load or change
  useEffect(() => {
    if (isVsAI) {
      const aiSelected = selectAIStartingEleven(whiteSquad);
      setDraftWhiteIds(aiSelected.map(p => p.id));
    }
  }, [isVsAI, whiteSquad, setDraftWhiteIds]);

  const activeSquad = currentDrafter === 'Siyah' ? blackSquad : whiteSquad;
  const activeTheme = currentDrafter === 'Siyah' ? teamATheme : teamBTheme;
  const activeDraftIds = currentDrafter === 'Siyah' ? draftBlackIds : draftWhiteIds;
  const setDraftIds = currentDrafter === 'Siyah' ? setDraftBlackIds : setDraftWhiteIds;

  // Filter squad list
  const filteredSquad = filterPos === 'ALL'
    ? activeSquad
    : activeSquad.filter(p => p.positionGroup === filterPos);

  const togglePlayerSelection = (player: Player) => {
    if (isOnlineMode && myOnlineTeam !== currentDrafter) return;
    if (activeDraftIds.includes(player.id)) {
      setDraftIds(prev => prev.filter(id => id !== player.id));
    } else {
      if (activeDraftIds.length >= 11) {
        return; // Limit to 11
      }
      setDraftIds(prev => [...prev, player.id]);
    }
  };

  const getPosCount = (group: 'GK' | 'DF' | 'MF' | 'FW') => {
    const selectedPlayers = activeSquad.filter(p => activeDraftIds.includes(p.id));
    return selectedPlayers.filter(p => p.positionGroup === group).length;
  };

  const isGKSelected = getPosCount('GK') >= 1;
  const isSquadFull = activeDraftIds.length === 11;
  const isDraftValid = isGKSelected && isSquadFull;

  const handleNextStep = () => {
    if (!isDraftValid) return;

    if (isOnlineMode) {
      if (currentDrafter === 'Siyah') {
        if (onChangeDrafter) onChangeDrafter('Beyaz');
        setFilterPos('ALL');
      } else {
        const blackSelected = blackSquad.filter(p => draftBlackIds.includes(p.id));
        const whiteSelected = whiteSquad.filter(p => draftWhiteIds.includes(p.id));
        onConfirmDraft(blackSelected, whiteSelected);
      }
      return;
    }

    if (currentDrafter === 'Siyah' && !isVsAI) {
      // Local PvP: Hand turn over to Beyaz
      if (onChangeDrafter) {
        onChangeDrafter('Beyaz');
      }
      setFilterPos('ALL');
    } else {
      // Siyah confirmed (vs AI has already autoselected Beyaz) OR Beyaz confirmed in PvP
      const blackSelected = blackSquad.filter(p => draftBlackIds.includes(p.id));
      const whiteSelected = whiteSquad.filter(p => draftWhiteIds.includes(p.id));
      onConfirmDraft(blackSelected, whiteSelected);
    }
  };

  // Pre-load default template lineup for human player to make draft quick & fun
  const handleLoadPresetSelection = () => {
    if (isOnlineMode && myOnlineTeam !== currentDrafter) return;
    const preset = selectAIStartingEleven(activeSquad);
    setDraftIds(preset.map(p => p.id));
  };

  return (
    <div id="draft-stage-panel" className="tabletop-card w-full max-w-6xl mx-auto overflow-hidden animate-fade-in my-4">
      {/* Draft Header Banner */}
      <div className="bg-[#0C251C] p-6 text-center md:text-left flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="bg-[#E75A51] px-3 py-1 rounded text-[10px] font-black tracking-widest uppercase inline-block mb-1.5 text-white border border-black/10">
            BAŞLAMA ZARINDAN SONRA • 2. AŞAMA
          </div>
          <h1 className="text-xl font-black uppercase font-display tracking-tight text-white flex items-center justify-center md:justify-start gap-2">
            ⚽ OYUNCU SEÇİMİ VE İLK 11 KURULUMU
          </h1>
          <p className="text-xs text-[#FAF7EE] opacity-90 mt-1 font-medium">
            Geniş 25 kişilik kadro havuzunuzdan taktiğinize göre mücadeleye başlayacak <strong className="text-white underline">11 futbolcu</strong> belirleyin.
          </p>
        </div>

        {/* Preset quick actions */}
        {(!isOnlineMode || myOnlineTeam === currentDrafter) && (
          <button
            onClick={handleLoadPresetSelection}
            className="tabletop-btn-secondary text-xs py-2.5 px-4 cursor-pointer self-center"
          >
            <span className="flex items-center gap-1.5 font-bold">
              <Sparkles className="w-4 h-4" />
              Hazır Kadro (Öneri) Seç
            </span>
          </button>
        )}
      </div>

      {/* Sub banner indicating active chooser */}
      <div className="bg-[#FAF7EE] border-b-2 border-[#0C251C]/10 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="w-5 h-5 rounded-full border-2 border-black/30 block scale-110 shrink-0" style={{ backgroundColor: activeTheme.primaryBg }} />
          <div>
            <h2 className="text-sm font-black uppercase tracking-wide text-[#0C251C] flex items-center gap-2">
              <span>Şu An Seçen: {activeTheme.name}</span>
              {isOnlineMode && myOnlineTeam !== currentDrafter && (
                <span className="font-mono text-amber-700 bg-amber-50 border border-amber-200 text-[9px] font-black uppercase px-2 py-0.5 rounded animate-pulse">
                  Rakibin Seçmesi Bekleniyor...
                </span>
              )}
              {isOnlineMode && myOnlineTeam === currentDrafter && (
                <span className="font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 text-[9px] font-black uppercase px-2 py-0.5 rounded animate-pulse animate-duration-1000">
                  Kendi Sıranız
                </span>
              )}
            </h2>
            <p className="text-[11px] text-[#0C251C]/75 font-medium">
              {currentDrafter === 'Siyah' ? '1. Takım sahibi kartlara tıklayarak kadrosunu kuruyor.' : '2. Takım sahibi kartlara tıklayarak kadrosunu kuruyor.'}
            </p>
          </div>
        </div>

        {/* Selected Counter Boxes */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="bg-white px-3.5 py-1.5 rounded-lg border-2 border-[#0C251C] text-xs font-black shadow-sm">
            Toplam: <strong className={isSquadFull ? "text-[#E75A51]" : "text-emerald-800"}>{activeDraftIds.length} / 11</strong>
          </div>
          <div className="bg-white px-3.5 py-1.5 rounded-lg border-2 border-[#0C251C] text-xs font-black flex gap-2 shadow-sm">
            <span>KL: <strong className={isGKSelected ? "text-emerald-800" : "text-[#E75A51]"}>{getPosCount('GK')}</strong></span>
            <span>DF: <strong>{getPosCount('DF')}</strong></span>
            <span>OS: <strong>{getPosCount('MF')}</strong></span>
            <span>FV: <strong>{getPosCount('FW')}</strong></span>
          </div>
        </div>
      </div>

      {/* Draft Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 bg-[#FFFDF7]">
        
        {/* Left Side: Sidebar Drafted List (4 cols) */}
        <div className="lg:col-span-4 bg-[#FAF7EE]/35 border-r-2 border-[#0C251C]/10 p-5 flex flex-col gap-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-[#0C251C]/80 border-b-2 border-[#0C251C]/10 pb-2">
            SEÇİLEN İLK 11 LİSTESİ ({activeDraftIds.length})
          </h3>

          {activeDraftIds.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-slate-500 text-xs gap-2 border-2 border-dashed border-[#0C251C]/20 rounded-xl bg-white">
              <Shield className="w-8 h-8 text-[#0C251C]/40 animate-pulse" />
              <span className="font-bold text-[#0C251C]/80">Henüz oyuncu seçilmedi.</span>
              <span className="opacity-85 text-slate-500">Sağdaki listeden oyuncu ekleyin.</span>
            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-1.5 max-h-[420px] overflow-y-auto pr-1">
              {activeSquad
                .filter(p => activeDraftIds.includes(p.id))
                .map(player => (
                  <div 
                    key={`drafted-row-${player.id}`}
                    className="flex items-center justify-between p-2 bg-white border-2 border-[#0C251C] rounded-lg hover:bg-orange-50/40 transition-all text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-md flex items-center justify-center font-bold text-[11px] font-mono border-2 border-[#0C251C] text-center shrink-0 shadow bg-[#FAF7EE]">
                        {player.number}
                      </span>
                      <div>
                        <div className="font-extrabold text-[#0C251C]">{player.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono font-medium">{player.role}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase font-mono
                        ${player.positionGroup === 'GK' ? 'bg-purple-100 text-purple-800 border border-purple-300' :
                          player.positionGroup === 'DF' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                          player.positionGroup === 'MF' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                          'bg-amber-100 text-amber-800 border border-amber-300'
                        }
                      `}>
                        {player.positionGroup}
                      </span>
                      <button
                        onClick={() => togglePlayerSelection(player)}
                        className="p-1 hover:bg-red-50 text-red-500 hover:text-red-700 border border-transparent hover:border-red-300 rounded transition-all cursor-pointer"
                        title="Kadrodan Çıkar"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Guidelines warning */}
          <div className="p-3.5 rounded-xl bg-amber-50/50 border-2 border-amber-500/20 text-xs text-amber-900 leading-relaxed flex items-start gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-[#F59B23] shrink-0 mt-0.5 animate-bounce" />
            <div className="space-y-1">
              <span className="font-black text-amber-900 block text-[11px]">Seçim Kuralları:</span>
              <p className="text-[10.5px]">
                Mücadele için kadroda tam olarak <strong className="font-bold underline">11 oyuncu</strong> olmalı ve her takım en az <strong className="font-bold underline">1 Kaleci (GK)</strong> belirlemelidir.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Available players pool with filters (8 cols) */}
        <div className="lg:col-span-8 p-5 flex flex-col gap-4 font-display">
          {/* Position Category Filters */}
          <div className="flex items-center justify-between gap-3 border-b-2 border-[#0C251C]/10 pb-2 flex-wrap">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#0C251C]/80">
              GENİŞ KADRO HAVUZU ({activeSquad.length} Oyuncu)
            </h3>

            {/* Selector group */}
            <div className="flex items-center gap-1 bg-[#FAF7EE] p-1 rounded-lg border-2 border-[#0C251C]">
              {(['ALL', 'GK', 'DF', 'MF', 'FW'] as const).map(group => (
                <button
                  key={`filter-draft-pos-${group}`}
                  onClick={() => setFilterPos(group)}
                  className={`py-1 px-3 rounded-md text-[10px] font-black transition-all uppercase cursor-pointer
                    ${filterPos === group
                      ? 'bg-[#030c08] text-white shadow-sm'
                      : 'text-[#0C251C]/70 hover:text-[#0C251C] hover:bg-white/50'
                    }
                  `}
                >
                  {group === 'ALL' ? 'TÜMÜ' : group}
                </button>
              ))}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 overflow-y-auto max-h-[380px] pr-2">
            {filteredSquad.map(player => {
              const isSelected = activeDraftIds.includes(player.id);
              return (
                <div
                  key={`draft-pick-card-${player.id}`}
                  onClick={() => togglePlayerSelection(player)}
                  className={`p-3 rounded-xl border-2 transition-all cursor-pointer relative select-none flex flex-col justify-between h-[115px]
                    ${isSelected 
                      ? 'bg-amber-50/50 border-[#E75A51] shadow-[3px_3px_0px_0px_#E75A51]' 
                      : 'bg-white border-[#0C251C]/10 text-slate-600 hover:border-[#0C251C] hover:bg-[#FAF7EE]/20 hover:scale-[1.01]'
                    }
                  `}
                >
                  {/* Card top banner */}
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-5.5 h-5.5 rounded flex items-center justify-center font-bold text-[10px] font-mono bg-[#FAF7EE] border border-[#0C251C] text-[#0C251C] shrink-0">
                        {player.number}
                      </span>
                      <div className="truncate">
                        <h4 className="font-extrabold text-[#0C251C] text-xs truncate leading-normal">{player.name}</h4>
                        <span className="text-[9px] text-slate-500 block truncate font-mono mt-0.5">{player.role}</span>
                      </div>
                    </div>
                    
                    {/* Position marker pill */}
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase font-mono shrink-0
                      ${player.positionGroup === 'GK' ? 'bg-purple-100 text-purple-800 border border-purple-300' :
                        player.positionGroup === 'DF' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                        player.positionGroup === 'MF' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                        'bg-amber-100 text-amber-800 border border-amber-300'
                      }
                    `}>
                      {player.positionGroup}
                    </span>
                  </div>

                  {/* Stats line overview */}
                  <div className="grid grid-cols-6 gap-0.5 text-center font-mono border-t border-b border-dashed border-[#0C251C]/10 py-1 text-[9px] my-1 font-medium">
                    <div>
                      <div className="text-[8px] text-slate-400">HIZ</div>
                      <div className="font-bold text-[#0C251C]">{player.stats.hiz}</div>
                    </div>
                    <div>
                      <div className="text-[8px] text-slate-400">GÜÇ</div>
                      <div className="font-bold text-[#0C251C]">{player.stats.guc}</div>
                    </div>
                    <div>
                      <div className="text-[8px] text-slate-400">TEK</div>
                      <div className="font-bold text-[#0C251C]">{player.stats.teknik}</div>
                    </div>
                    <div>
                      <div className="text-[8px] text-slate-400">PAS</div>
                      <div className="font-bold text-[#0C251C]">{player.stats.pas}</div>
                    </div>
                    <div>
                      <div className="text-[8px] text-slate-400">ŞUT</div>
                      <div className="font-bold text-[#0C251C]">{player.stats.sut}</div>
                    </div>
                    <div>
                      <div className="text-[8px] text-slate-400">SAV</div>
                      <div className="font-bold text-[#0C251C]">{player.stats.savunma}</div>
                    </div>
                  </div>

                  {/* Add action text */}
                  <div className="flex items-center justify-between text-[10px]">
                    <div className="truncate text-slate-500 italic text-[9.5px] max-w-[80%] font-medium">
                      {player.description}
                    </div>
                    {isSelected ? (
                      <span className="text-emerald-700 font-extrabold flex items-center gap-0.5 shrink-0">
                        <Check className="w-3.5 h-3.5" />
                        Seçildi
                      </span>
                    ) : (
                      <span className="text-[#0C251C] font-bold hover:text-[#E75A51] flex items-center gap-0.5 shrink-0">
                        <Plus className="w-3.5 h-3.5" />
                        Ekle
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Drafting confirmation footer split */}
          <div className="bg-[#FAF7EE] p-4 rounded-xl border-2 border-[#0C251C] flex items-center justify-between gap-4 mt-auto flex-wrap shadow-sm font-sans">
            <div className="text-xs text-slate-700">
              {isDraftValid ? (
                <span className="text-emerald-800 font-black flex items-center gap-1.5">
                  <Check className="w-4 h-4 shrink-0" />
                  Kadro kurallara uygun olarak hazırlandı!
                </span>
              ) : (
                <span className="text-[#E75A51] font-black flex items-center gap-1.5 animate-pulse">
                  <HelpCircle className="w-4 h-4 shrink-0" />
                  {!isSquadFull ? `Kadroya ${11 - activeDraftIds.length} oyuncu daha eklemeniz gerek.` : 'Lütfen en az 1 kaleci (GK) ekleyin.'}
                </span>
              )}
            </div>

            <button
              onClick={handleNextStep}
              disabled={!isDraftValid || (isOnlineMode && myOnlineTeam !== currentDrafter)}
              style={{ opacity: (isDraftValid && (!isOnlineMode || myOnlineTeam === currentDrafter)) ? 1 : 0.6 }}
              className={`font-black uppercase tracking-widest text-[#FAF7EE] text-[11px] py-3 px-6 rounded-lg flex items-center gap-2 select-none border-2 transition-all cursor-pointer
                ${(isDraftValid && (!isOnlineMode || myOnlineTeam === currentDrafter))
                  ? 'tabletop-btn-primary'
                  : 'bg-zinc-200 border-[#0C251C]/15 text-[#0C251C]/40 cursor-not-allowed'
                }
              `}
            >
              <span>
                {isOnlineMode 
                  ? (myOnlineTeam !== currentDrafter 
                      ? 'Rakip Oyuncunun Onayı Bekleniyor...' 
                      : (currentDrafter === 'Siyah' ? 'Kadroyu Onayla ve Rezervlere Geç' : 'Kadro Seçimini Bitir ve Sahaya Git'))
                  : (currentDrafter === 'Siyah' && !isVsAI ? 'Deplasman Seçimine Geç' : 'Renkleri Onayla & Taktik Yerleşime Git')
                }
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
