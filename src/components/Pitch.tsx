/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { PlacedPlayer, Position, TeamColor, PlannedAction, ActionType } from '../types';
import { getDistance, isAdjacent } from '../utils/ai';
import { TeamTheme } from '../data/teams';
import { Crosshair, HelpCircle, CornerDownRight, Footprints, MoveRight, Star, GripHorizontal, EyeOff } from 'lucide-react';

interface PitchProps {
  placedPlayers: PlacedPlayer[];
  ballPosition: Position;
  ballCarrier: { team: TeamColor; playerId: string } | null;
  phase: string;
  activeTeam: TeamColor;
  onCellClick: (pos: Position) => void;
  selectedPlayer: PlacedPlayer | null;
  plannedActions: Record<string, PlannedAction>;
  teamATheme: TeamTheme;
  teamBTheme: TeamTheme;
  onPlanPassAction: (fromPlayer: PlacedPlayer, toPlayer: PlacedPlayer) => void;
  onPlanShootAction: (player: PlacedPlayer) => void;
  onClearPlayerAction: (playerId: string) => void;
  isPassingModeActive?: boolean;
  onTogglePassingMode?: () => void;
  selectedPlacedPlayerId?: string | null;
}

export default function Pitch({
  placedPlayers,
  ballPosition,
  ballCarrier,
  phase,
  activeTeam,
  onCellClick,
  selectedPlayer,
  plannedActions,
  teamATheme,
  teamBTheme,
  onPlanPassAction,
  onPlanShootAction,
  onClearPlayerAction,
  isPassingModeActive = false,
  onTogglePassingMode,
  selectedPlacedPlayerId = null,
}: PitchProps) {
  const [hoveredCell, setHoveredCell] = useState<Position | null>(null);

  // Responsive scale states
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleResize = () => {
      const containerWidth = el.getBoundingClientRect().width;
      // Subtract padding (p-4 is 16px * 2) to get precise net available width
      const availableWidth = Math.max(280, containerWidth - 32);
      const newScale = Math.min(1, availableWidth / 1000);
      setScale(newScale);
    };

    handleResize();
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(el);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Drag states for action selection popup
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const [isPopupHidden, setIsPopupHidden] = useState(false);

  // Reset drag and hidden state on selected player change
  useEffect(() => {
    setDragOffset({ x: 0, y: 0 });
    setIsPopupHidden(false);
  }, [selectedPlayer?.player.id]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left-click
    setIsDragging(true);
    dragStart.current = { x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y };
    e.preventDefault();
    e.stopPropagation();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 0) return;
    setIsDragging(true);
    const touch = e.touches[0];
    dragStart.current = { x: touch.clientX - dragOffset.x, y: touch.clientY - dragOffset.y };
    e.stopPropagation();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setDragOffset({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y
      });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length === 0) return;
      const touch = e.touches[0];
      setDragOffset({
        x: touch.clientX - dragStart.current.x,
        y: touch.clientY - dragStart.current.y
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging]);

  const COLS = 21;
  const ROWS = 13;

  // Check if a tile is part of Left Goal Post (x=0, y=5..7) or Right Goal Post (x=20, y=5..7)
  const isLeftGoal = (x: number, y: number) => x === 0 && y >= 5 && y <= 7;
  const isRightGoal = (x: number, y: number) => x === 20 && y >= 5 && y <= 7;

  // Check if cell is in the Penalty Area
  const isLeftPenaltyArea = (x: number, y: number) => x >= 0 && x <= 4 && y >= 2 && y <= 10;
  const isRightPenaltyArea = (x: number, y: number) => x >= 16 && x <= 20 && y >= 2 && y <= 10;

  // Check if cell is in Center Circle (approximate discrete circle centered at 10,6 with radius ~3)
  const isCenterCircle = (x: number, y: number) => {
    const dist = Math.sqrt(Math.pow(x - 10, 2) + Math.pow(y - 6, 2));
    return dist >= 2.5 && dist <= 3.5 && x !== 10; // outer arc
  };

  // Determine selectable highlights or moves
  const getCellHighlightClass = (x: number, y: number) => {
    if (!selectedPlayer) return '';
    
    const pPos = selectedPlayer.position;
    const isCarrier = ballCarrier?.playerId === selectedPlayer.player.id;
    const distanceVal = getDistance(pPos, { x, y });

    // PLACEMENT restrictions
    if (phase === 'PLACEMENT') {
      const isSiyah = selectedPlayer.team === 'Siyah';
      // Siyah places on left half (x: 0..10)
      if (isSiyah && x > 10) return '';
      // White places on right half (x: 10..20)
      if (!isSiyah && x < 10) return '';
      return 'bg-emerald-400/20 hover:bg-emerald-400/40 cursor-pointer border-emerald-400/40 border-dashed';
    }

    // TACTICS phase movement highlights
    if (phase.startsWith('TACTICS_')) {
      // Cannot highlight the player's own cell helper
      if (x === pPos.x && y === pPos.y) return 'ring-4 ring-yellow-400 ring-offset-2 ring-offset-emerald-900';

      const occupant = placedPlayers.find(p => p.position.x === x && p.position.y === y);

      // PAS VERME: Takım arkadaşına sahanın her yerinden pas verilebilsin!
      if (occupant && isCarrier && occupant.team === selectedPlayer.team && occupant.player.id !== selectedPlayer.player.id) {
        return 'bg-blue-400/20 hover:bg-blue-400/40 cursor-pointer border-blue-450 border-dashed ring-1 ring-blue-400/40';
      }

      // If carrier, check shooting targets (Left team Siyah attacks Right goal x=20, Right team Beyaz attacks Left goal x=0)
      if (isCarrier) {
        if (selectedPlayer.team === 'Siyah' && x === 20 && y >= 5 && y <= 7) {
          return 'bg-red-500/35 hover:bg-red-500/60 cursor-pointer border-red-500 animate-pulse';
        }
        if (selectedPlayer.team === 'Beyaz' && x === 0 && y >= 5 && y <= 7) {
          return 'bg-red-500/35 hover:bg-red-500/60 cursor-pointer border-red-500 animate-pulse';
        }
      }

      // Normal hareket, depar ve top sürme limitleri (Mesafe 6)
      const maxRange = 6; // Allow planning up to 6 cells sprint/run!
      if (distanceVal <= maxRange) {
        if (occupant) {
          return ''; // blocked otherwise
        }

        // Empty cell in range
        if (isCarrier) {
          // If carrier, we can DRIBBLE to empty cell up to 6 away
          return 'bg-amber-400/10 hover:bg-amber-400/30 cursor-pointer border-amber-400/40 border-dashed ring-1 ring-amber-400/20';
        } else {
          // Normal run/move up to 6 cells
          return 'bg-sky-400/10 hover:bg-sky-400/30 cursor-pointer border-sky-400/30 border-dashed ring-1 ring-sky-400/20';
        }
      }
    }

    return '';
  };

  return (
    <div 
      ref={containerRef}
      id="pitch-scroll-wrapper" 
      className="w-full bg-[#020617] p-4 rounded border border-slate-800 shadow-2xl overflow-hidden flex flex-col justify-start items-center"
    >
      <div 
        id="pitch-scaler-inner"
        className="relative mx-auto transition-all duration-300 ease-out"
        style={{
          width: `${1000 * scale}px`,
          height: `${620 * scale}px`,
        }}
      >
        <div 
          id="pitch-scaler-content"
          className="absolute transition-all duration-300 ease-out"
          style={{
            width: '1000px',
            height: '620px',
            transform: `translateX(-50%) scale(${scale})`,
            transformOrigin: 'top center',
            left: '50%',
          }}
        >
          <div 
            id="tactical-football-pitch" 
            className="w-full h-full relative select-none bg-[#14532d] border-4 border-white/30 rounded shadow-2xl overflow-hidden"
            style={{
              backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 4.76%, rgba(0,0,0,0.05) 4.76%, rgba(0,0,0,0.05) 9.52%)'
            }}
          >
        {/* Pitch Lines - Styled purely with elegant absolute divs */}
        
        {/* Center Line */}
        <div id="line-center" className="absolute top-0 bottom-0 left-[50%] w-[2px] bg-white/45 -translate-x-[1px] pointer-events-none"></div>
        
        {/* Center Circle */}
        <div id="circle-center" className="absolute top-[50%] left-[50%] w-[120px] h-[120px] aspect-square rounded-full border-2 border-white/45 -translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
        <div id="spot-center" className="absolute top-[50%] left-[50%] w-3 h-3 rounded-full bg-white/70 -translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
  
        {/* Penalty Areas */}
        {/* Left Penalty Area */}
        <div id="area-penalty-left" className="absolute left-0 top-[15.38%] w-[19.04%] h-[69.24%] border-2 border-l-0 border-white/45 pointer-events-none bg-black/5"></div>
        {/* Left Goal Area */}
        <div id="area-goal-left" className="absolute left-0 top-[30.76%] w-[7%] h-[38.48%] border-2 border-l-0 border-white/45 pointer-events-none"></div>
        {/* Left Penalty Spot */}
        <div id="spot-penalty-left" className="absolute left-[11%] top-[50%] w-2 h-2 rounded-full bg-white/70 -translate-y-1/2 pointer-events-none"></div>
  
        {/* Right Penalty Area */}
        <div id="area-penalty-right" className="absolute right-0 top-[15.38%] w-[19.04%] h-[69.24%] border-2 border-r-0 border-white/45 pointer-events-none bg-black/5"></div>
        {/* Right Goal Area */}
        <div id="area-goal-right" className="absolute right-0 top-[30.76%] w-[7%] h-[38.48%] border-2 border-r-0 border-white/45 pointer-events-none"></div>
        {/* Right Penalty Spot */}
        <div id="spot-penalty-right" className="absolute right-[11%] top-[50%] w-2 h-2 rounded-full bg-white/70 -translate-y-1/2 pointer-events-none"></div>
  
        {/* Goalpost Nets representation */}
        <div id="goalpost-net-left" className="absolute left-[-24px] top-[38.46%] w-[24px] h-[23.08%] bg-slate-900/90 border border-slate-755/30 border-r-0 rounded-l flex items-center justify-center text-[9px] font-bold text-slate-500 pointer-events-none">
          NET_L
        </div>
        <div id="goalpost-net-right" className="absolute right-[-24px] top-[38.46%] w-[24px] h-[23.08%] bg-slate-900/90 border border-slate-755/30 border-l-0 rounded-r flex items-center justify-center text-[9px] font-bold text-slate-500 pointer-events-none">
          NET_R
        </div>
  
        {/* Grid Cells Wrapper */}
        <div 
          id="pitch-grid" 
          className="absolute inset-0 grid w-full h-full z-10"
          style={{
            gridTemplateColumns: 'repeat(21, minmax(0, 1fr))',
            gridTemplateRows: 'repeat(13, minmax(0, 1fr))',
          }}
        >
          {Array.from({ length: COLS * ROWS }).map((_, idx) => {
            const x = idx % COLS;
            const y = Math.floor(idx / COLS);
            const isStripe = x % 2 === 0;
 
            const isGoal = isLeftGoal(x, y) || isRightGoal(x, y);

            // Find player occupying this position
            const occupant = placedPlayers.find(p => p.position.x === x && p.position.y === y);
 
            // Find pending action of any player in this cell (or target lines)
            const isTargetedCell = Object.values(plannedActions).some(act => act.targetPos.x === x && act.targetPos.y === y);
            const actionTypes = Object.values(plannedActions)
              .filter(act => act.targetPos.x === x && act.targetPos.y === y)
              .map(act => act.type);
 
            const isBallHere = ballPosition.x === x && ballPosition.y === y;
 
            const highlightClass = getCellHighlightClass(x, y);
 
            return (
              <div
                id={`cell-${x}-${y}`}
                key={`pitch-cell-${x}-${y}`}
                onClick={() => onCellClick({ x, y })}
                onMouseEnter={() => setHoveredCell({ x, y })}
                onMouseLeave={() => setHoveredCell(null)}
                className={`
                  relative border border-white/[0.03] transition-all duration-150 flex items-center justify-center
                  ${isStripe ? 'bg-black/5' : 'bg-transparent'}
                  ${highlightClass}
                  ${isGoal ? 'bg-black/30' : ''}
                `}
              >
                {/* Visual grid labels */}
                <span className="absolute bottom-0.5 right-0.5 text-[8px] text-white/5 font-mono select-none pointer-events-none">
                  {x},{y}
                </span>
 
                {/* Left/Right goal colors */}
                {isLeftGoal(x, y) && (
                  <div className="absolute inset-0 border-l-[3px] border-white/70 bg-gradient-to-r from-red-650/10 to-transparent pointer-events-none"></div>
                )}
                {isRightGoal(x, y) && (
                  <div className="absolute inset-0 border-r-[3px] border-white/70 bg-gradient-to-l from-red-650/10 to-transparent pointer-events-none"></div>
                )}

                {(() => {
                  const isCarrierSelected = selectedPlayer && ballCarrier?.playerId === selectedPlayer.player.id;
                  const isLeftGoalShooting = selectedPlayer && selectedPlayer.team === 'Beyaz' && isLeftGoal(x, y);
                  const isRightGoalShooting = selectedPlayer && selectedPlayer.team === 'Siyah' && isRightGoal(x, y);
                  const isShootCandidate = isCarrierSelected && (isLeftGoalShooting || isRightGoalShooting);

                  if (isShootCandidate) {
                    return (
                      <div className="absolute inset-0 bg-red-600/40 border-[2px] border-red-500 flex flex-col items-center justify-center z-30 animate-pulse cursor-pointer">
                        <Crosshair className="w-5 h-5 text-white drop-shadow animate-spin" style={{ animationDuration: '6s' }} />
                        <span className="bg-red-700 text-white font-black text-[8px] px-1 py-0.5 rounded shadow mt-0.5 font-sans uppercase tracking-tight">
                          ŞUT!
                        </span>
                      </div>
                    );
                  }
                  return null;
                })()}
 
                {/* Targeted indicators */}
                {isTargetedCell && (
                  <div className="absolute -top-1 -right-1 z-30 flex gap-0.5">
                    {actionTypes.includes('PASS') && (
                      <span className="bg-blue-500 text-white rounded-full p-[3px] text-[8px] font-bold shadow-lg block animate-bounce" title="Pas Hedefi">
                        PAS
                      </span>
                    )}
                    {actionTypes.includes('SHOOT') && (
                      <span className="bg-rose-500 text-white rounded-full p-[3px] text-[8px] font-bold shadow-lg block animate-pulse" title="Şut Hedefi">
                        ŞUT
                      </span>
                    )}
                    {actionTypes.includes('DRIBBLE') && (
                      <span className="bg-amber-500 text-slate-900 rounded-full p-[3px] text-[8px] font-bold shadow-lg block" title="Sürme Hedefi">
                        SÜR
                      </span>
                    )}
                    {actionTypes.includes('MOVE') && (
                      <span className="bg-sky-500 text-white rounded-full p-[3px] text-[8px] font-bold shadow-lg block" title="Koşu Hedefi">
                        KOŞU
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Absolutely Positioned Objects Layer (Smooth Animation Glides!) */}
        <div id="pitch-objects-layer" className="absolute inset-0 z-20 pointer-events-none">
          
          {/* Animated Loose Soccer Ball */}
          {!ballCarrier && (
            <div 
              id="loose-soccer-ball"
              className="absolute w-5 h-5 bg-white border border-slate-950 rounded-full shadow-lg flex items-center justify-center pointer-events-none animate-spin transition-all duration-500 ease-in-out"
              style={{ 
                animationDuration: '4s',
                left: `${((ballPosition.x * 2 + 1) / 42) * 100}%`,
                top: `${((ballPosition.y * 2 + 1) / 26) * 100}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              ⚽
            </div>
          )}

          {/* Animated Player Tokens */}
          {placedPlayers.map(occupant => {
            const isTeamASiyah = occupant.team === 'Siyah';
            const currentTheme = isTeamASiyah ? teamATheme : teamBTheme;
            const x = occupant.position.x;
            const y = occupant.position.y;

            return (
              <div
                key={`animated-player-token-${occupant.player.id}`}
                style={{
                  left: `${((x * 2 + 1) / 42) * 100}%`,
                  top: `${((y * 2 + 1) / 26) * 100}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                className={`absolute transition-all duration-500 ease-in-out
                  ${selectedPlayer?.player.id === occupant.player.id ? 'z-30' : 'z-20'}
                `}
              >
                <div
                  id={`player-token-${occupant.player.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onCellClick({ x, y });
                  }}
                  style={{
                    backgroundColor: currentTheme.primaryBg,
                    borderColor: currentTheme.secondaryBg,
                    color: currentTheme.textColor,
                  }}
                  className={`
                    relative w-11 h-11 rounded-full flex flex-col items-center justify-center transition-transform duration-200 cursor-pointer text-center select-none shadow-md border-2 pointer-events-auto
                    ${(selectedPlayer?.player.id === occupant.player.id || selectedPlacedPlayerId === occupant.player.id) ? 'scale-110 ring-4 ring-yellow-400 ring-offset-1 shadow-xl ring-offset-emerald-950' : ''}
                    ${currentTheme.glowClass}
                    hover:brightness-125 hover:scale-105 active:scale-95
                  `}
                  title={`${occupant.player.name} (${occupant.player.role})`}
                >
                  {/* Jersey number */}
                  <span 
                    className="text-[13px] font-extrabold leading-none tracking-tight"
                    style={{ 
                      color: currentTheme.secondaryBg,
                      textShadow: '1.5px 1.5px 0 #000, -1.5px -1.5px 0 #000, 1.5px -1.5px 0 #000, -1.5px 1.5px 0 #000, 0px 0px 3px rgba(0,0,0,0.8)' 
                    }}
                  >
                    {occupant.player.number}
                  </span>
                  
                  {/* Player Position shorthand */}
                  <span 
                    className={`text-[8px] font-bold uppercase leading-none mt-0.5 py-0.5 px-1 rounded-sm
                      ${occupant.isGK ? 'bg-purple-900/35 text-purple-200' : 'bg-black/30 text-slate-300'}
                    `}
                  >
                    {occupant.player.positionGroup}
                  </span>

                  {/* Ball Indicator inside Jersey */}
                  {ballCarrier?.playerId === occupant.player.id && (
                    <div 
                      id="ball-indicator" 
                      className="absolute -bottom-1 -right-1 w-5 h-5 bg-white border border-slate-950 rounded-full flex items-center justify-center text-[10px] shadow-lg animate-bounce pointer-events-none"
                    >
                      ⚽
                    </div>
                  )}

                  {/* Floating contextual ACTION SELECTION POPUP overlay inside Player Token */}
                  {selectedPlayer?.player.id === occupant.player.id && phase.startsWith('TACTICS_') && selectedPlayer.team === activeTeam && ballCarrier?.playerId === occupant.player.id && (
                    isPopupHidden ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsPopupHidden(false);
                        }}
                        className="absolute -top-7 left-1/2 -translate-x-1/2 z-50 bg-[#0f172a]/90 hover:bg-[#1e293b] text-sky-400 hover:text-sky-300 border border-sky-550/20 hover:border-sky-400/50 rounded-full w-7 h-7 flex items-center justify-center shadow-2xl transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer pointer-events-auto animate-pulse"
                        title="Aksiyon menüsünü göster"
                      >
                        👁
                      </button>
                    ) : (
                      <div 
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          transform: `translate(calc(-50% + ${dragOffset.x}px), calc(${y < 4 ? '48px' : '-168px'} + ${dragOffset.y}px))`,
                          top: 0,
                          left: '50%',
                        }}
                        className={`absolute z-55 bg-[#0f172a]/95 backdrop-blur-sm border border-slate-700 p-2.5 rounded-xl shadow-2xl flex flex-col gap-1 w-[168px] text-left shrink-0 animate-fade-in pointer-events-auto`}
                      >
                        {/* Draggable Header handle */}
                        <div 
                          onMouseDown={handleMouseDown}
                          onTouchStart={handleTouchStart}
                          className="bg-slate-950 px-2 py-1 rounded text-[9px] font-bold text-slate-400 tracking-wide uppercase border-b border-slate-850 flex justify-between items-center cursor-grab active:cursor-grabbing select-none"
                          title="Menüyü sürüklemek için burayı basılı tutup taşıyın"
                        >
                          <span className="flex items-center gap-1 font-sans text-sky-400">
                            <GripHorizontal className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>Aksiyon Seç</span>
                          </span>
                          
                          <div className="flex items-center gap-1">
                            {plannedActions[occupant.player.id] && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onClearPlayerAction(occupant.player.id);
                                }}
                                className="text-red-400 hover:text-red-300 text-[8px] font-extrabold uppercase transition-colors mr-1 cursor-pointer"
                              >
                                SİL
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsPopupHidden(true);
                              }}
                              className="text-slate-400 hover:text-white p-0.5 rounded hover:bg-slate-800 transition-all cursor-pointer"
                              title="Menüyü geçici olarak gizle"
                            >
                              <EyeOff className="w-3 h-3 text-slate-400 hover:text-sky-400 shrink-0" />
                            </button>
                          </div>
                        </div>
                      
                      {ballCarrier?.playerId === occupant.player.id ? (
                        <>
                          {/* Shoot Trigger */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onPlanShootAction(occupant);
                            }}
                            className="flex items-center justify-center gap-1.5 w-full text-center font-sans text-[10px] font-extrabold uppercase py-1.5 px-2 rounded transition-all bg-rose-600 hover:bg-rose-500 text-white select-none cursor-pointer mt-1"
                          >
                            <Crosshair className="w-3.5 h-3.5" />
                            🚀 ŞUT ÇEK!
                          </button>

                          {/* Pass Trigger with inline button to select from pitch */}
                          <div className="flex flex-col gap-1 mt-1 border-t border-slate-800/80 pt-1.5 pb-0.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onTogglePassingMode) onTogglePassingMode();
                              }}
                              className={`flex items-center justify-center gap-1.5 w-full text-center font-sans text-[10px] font-extrabold uppercase py-1.5 px-2 rounded transition-all cursor-pointer select-none
                                ${isPassingModeActive 
                                  ? 'bg-sky-505 bg-sky-500 text-white animate-pulse border-sky-300 border shadow-md' 
                                  : 'bg-indigo-950/80 hover:bg-indigo-500 hover:text-white border border-indigo-700 text-indigo-300'
                                }
                              `}
                            >
                              🎯 {isPassingModeActive ? 'SAHADAN SEÇİN' : 'PAS VER!'}
                            </button>
                          </div>

                          {/* Dribble guidelines */}
                          <div className="border-t border-slate-800/80 pt-1.5 px-0.5 pb-0.5 flex flex-col">
                            <span className="text-[8.5px] font-bold text-amber-400 uppercase font-sans flex items-center gap-1">
                              ⚡ Top Sür (6 Kare)
                            </span>
                            <span className="text-[7.5px] text-slate-400 font-sans leading-normal mt-0.5">
                              Haritada boş bir hedef hücreye tıklayın.
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Run guidelines list */}
                          <div className="px-0.5 py-1 flex flex-col">
                            <span className="text-[8.5px] font-bold text-sky-400 uppercase font-sans flex items-center gap-1">
                              🏃 Koşu Yap (6 Kare)
                            </span>
                            <span className="text-[7.5px] text-slate-400 font-sans leading-normal mt-0.5">
                              Haritada boş bir hedef hücreye tıklayın.
                            </span>
                          </div>
                        </>
                      )}
                    </div>)
                  )}

                  {(() => {
                    const isCarrierSelected = selectedPlayer && ballCarrier?.playerId === selectedPlayer.player.id;
                    const isPassCandidate = isCarrierSelected && isPassingModeActive &&
                      (occupant.team === selectedPlayer.team) && 
                      (occupant.player.id !== selectedPlayer.player.id);

                    if (isPassCandidate) {
                      return (
                        <div className="absolute -inset-[3px] rounded-full border-2 border-sky-400 bg-sky-500/25 flex flex-col items-center justify-center z-30 animate-pulse cursor-pointer">
                          <span className="bg-sky-600 text-white font-black text-[8px] px-1.5 py-0.5 rounded-full shadow-md leading-none uppercase select-none tracking-tighter">
                            PAS AL!
                          </span>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Pending action icon on player ring */}
                  {plannedActions[occupant.player.id] && (
                    <div className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-[#020617] text-white border border-slate-700 flex items-center justify-center shadow">
                      {plannedActions[occupant.player.id].type === 'PASS' && (
                        <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                      )}
                      {plannedActions[occupant.player.id].type === 'SHOOT' && (
                        <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></div>
                      )}
                      {plannedActions[occupant.player.id].type === 'DRIBBLE' && (
                        <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                      )}
                      {plannedActions[occupant.player.id].type === 'MOVE' && (
                        <div className="w-2 h-2 rounded-full bg-sky-400"></div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  </div>
</div>
);
}
