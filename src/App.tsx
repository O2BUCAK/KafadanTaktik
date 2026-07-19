/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Player, PlacedPlayer, Position, TeamColor, PlannedAction, GameLog, GamePhase, GameState } from './types';
import { createSquad } from './data/squads';
import { planAIActions, getDistance, isAdjacent, selectAIStartingEleven, getAIPlacementPosition } from './utils/ai';
import Pitch from './components/Pitch';
import SquadSelection from './components/SquadSelection';
import SquadDraftScreen from './components/SquadDraftScreen';
import RulesModal from './components/RulesModal';
import ProfileModal from './components/ProfileModal';
import DiceRollEffect, { getPerformanceBracket } from './components/DiceRollEffect';
import { 
  Dice5, Trophy, Sparkles, RefreshCw, Volume2, HelpCircle, 
  ChevronRight, Play, CheckCircle2, AlertCircle, Info, ShieldAlert, ListFilter, Palette, Globe 
} from 'lucide-react';
import { TEAMS, TeamTheme } from './data/teams';
import PlayerCard from './components/PlayerCard';
import KafadanTaktikLogo from './components/KafadanTaktikLogo';
import { AdSenseBanner } from './components/AdSenseBanner';

// Firebase Firestore & Auth Imports
import { db, auth } from './utils/firebase';
import { doc, updateDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut, signInWithPopup, GoogleAuthProvider, signInAnonymously, updateProfile } from 'firebase/auth';
import { initializeUserStats, getUserStats, updateUserStatsAfterMatch } from './utils/stats';
import type { UserStats } from './utils/stats';

export default function App() {
  const welcomeLogged = useRef(false);
  
  // Online Multiplayer States
  const [isOnlineMode, setIsOnlineMode] = useState<boolean>(false);
  const [onlineMatchId, setOnlineMatchId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState<boolean>(false);
  const [myOnlineTeam, setMyOnlineTeam] = useState<TeamColor | null>(null);
  const [submittedSiyah, setSubmittedSiyah] = useState<boolean>(false);
  const [submittedBeyaz, setSubmittedBeyaz] = useState<boolean>(false);
  const isIncomingFirestoreUpdate = useRef<boolean>(false);

  // Base State Init
  const [isVsAI, setIsVsAI] = useState<boolean>(true);
  const [blackSquad] = useState<Player[]>(() => createSquad('Siyah'));
  const [whiteSquad] = useState<Player[]>(() => createSquad('Beyaz'));

  // Custom Football Team Themes chosen by user
  const [teamATheme, setTeamATheme] = useState<TeamTheme>(() => TEAMS[0]); // Siyah Beyaz
  const [teamBTheme, setTeamBTheme] = useState<TeamTheme>(() => TEAMS[2]); // Sarı Lacivert
  
  // Starting Lineups selection
  const [hasStartedMatch, setHasStartedMatch] = useState<boolean>(false);
  const [startingBlack, setStartingBlack] = useState<Player[]>([]);
  const [startingWhite, setStartingWhite] = useState<Player[]>([]);

  // Selected AI Formation
  const [aiFormation, setAiFormation] = useState<'4-4-2' | '3-5-2' | '4-3-3' | '5-4-1'>('4-4-2');

  // Draft stage chosen player IDs (11 players per team selected from 25-man squad)
  const [draftBlackIds, setDraftBlackIds] = useState<string[]>([]);
  const [draftWhiteIds, setDraftWhiteIds] = useState<string[]>([]);

  // Placed Player Pool (Currently on 21x13 canvas)
  const [placedPlayers, setPlacedPlayers] = useState<PlacedPlayer[]>([]);
  
  // Maç başladığındaki ilk taktiksel dizilişleri saklamak için state
  const [initialPlacedPlayers, setInitialPlacedPlayers] = useState<PlacedPlayer[]>([]);
  
  // Ball State
  const [ballPosition, setBallPosition] = useState<Position>({ x: 10, y: 6 });
  const [ballCarrier, setBallCarrier] = useState<{ team: TeamColor; playerId: string } | null>(null);

  // Match Details
  const [phase, setPhase] = useState<GamePhase>('INITIATIVE');
  const [score, setScore] = useState<{ Siyah: number; Beyaz: number }>({ Siyah: 0, Beyaz: 0 });
  const [matchTurn, setMatchTurn] = useState<number>(1);
  const [initiativeRolls, setInitiativeRolls] = useState<{ Siyah: number; Beyaz: number } | null>(null);
  const [initiativeWinner, setInitiativeWinner] = useState<TeamColor | null>(null);
  const [activeTeam, setActiveTeam] = useState<TeamColor>('Siyah');

  // Interactive Play selections
  const [selectedPlayer, setSelectedPlayer] = useState<PlacedPlayer | null>(null);
  const [isPassingModeActive, setIsPassingModeActive] = useState<boolean>(false);
  const [plannedActions, setPlannedActions] = useState<Record<string, PlannedAction>>({});
  
  // User profile and stats states
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [profileLoading, setProfileLoading] = useState<boolean>(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Monitor auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        setProfileLoading(true);
        try {
          const stats = await initializeUserStats(user.uid);
          setUserStats(stats);
        } catch (err: any) {
          console.error("Stats fetch error:", err);
        } finally {
          setProfileLoading(false);
        }
      } else {
        setUserStats(null);
      }
    });
    return unsubscribe;
  }, []);

  // UI states
  const [isRulesOpen, setIsRulesOpen] = useState<boolean>(false);
  const [logs, setLogs] = useState<GameLog[]>([]);
  const [showGoalCelebration, setShowGoalCelebration] = useState<boolean>(false);
  const [lastScorer, setLastScorer] = useState<PlacedPlayer | null>(null);

  // New States for gorgeous dice roll modals and summaries
  const [showInitiativeModal, setShowInitiativeModal] = useState<boolean>(false);
  const [isInitiativeRolling, setIsInitiativeRolling] = useState<boolean>(false);
  const [showResolutionModal, setShowResolutionModal] = useState<boolean>(false);
  const [isResolutionRolling, setIsResolutionRolling] = useState<boolean>(false);
  const [pendingResolution, setPendingResolution] = useState<{
    placedPlayers: PlacedPlayer[];
    ballCarrier: { team: TeamColor; playerId: string } | null;
    ballPosition: Position;
    score: { Siyah: number; Beyaz: number };
    goalScored: 'Siyah' | 'Beyaz' | null;
    scorerObj: PlacedPlayer | null;
    reports: {
      description: string;
      rolls: { name: string; roll: number; stat: number; total: number; team: TeamColor }[];
    }[];
    nextTurn: number;
  } | null>(null);

  // Dice visual simulator
  const [isRollingSimulation, setIsRollingSimulation] = useState<boolean>(false);
  const [simulationDiceReports, setSimulationDiceReports] = useState<{
    description: string;
    rolls: { name: string; roll: number; stat: number; total: number; team: TeamColor }[];
  }[]>([]);

  // Selected player to inspect in sidebar Roster list
  const [inspectingPlayer, setInspectingPlayer] = useState<Player | null>(null);

  // Selected player for strategic PLACEMENT phase
  const [selectedPlacementPlayerId, setSelectedPlacementPlayerId] = useState<string | null>(null);
  const [selectedPlacedPlayerId, setSelectedPlacedPlayerId] = useState<string | null>(null);
  const [placementPosFilter, setPlacementPosFilter] = useState<'ALL' | 'GK' | 'DF' | 'MF' | 'FW'>('ALL');

  // Auto-fill placement selection with first available unplaced player under the active filter
  useEffect(() => {
    if (phase === 'PLACEMENT') {
      const activeTeamForPlacement = getNextPlacementRequirement().team;
      const unplaced = getUnplacedPlayersForTeam(activeTeamForPlacement);
      const filteredUnplaced = placementPosFilter === 'ALL' 
        ? unplaced 
        : unplaced.filter(p => p.positionGroup === placementPosFilter);

      const unplacedIds = filteredUnplaced.map(p => p.id);
      if (unplacedIds.length > 0) {
        if (!selectedPlacementPlayerId || !unplacedIds.includes(selectedPlacementPlayerId)) {
          setSelectedPlacementPlayerId(unplacedIds[0]);
        }
      } else {
        if (unplaced.length > 0 && placementPosFilter !== 'ALL') {
          // Fall back to ALL if filter is empty but there are unplaced players
          setPlacementPosFilter('ALL');
        } else {
          setSelectedPlacementPlayerId(null);
        }
      }
    } else {
      setSelectedPlacementPlayerId(null);
    }
  }, [phase, placedPlayers, placementPosFilter]);

  useEffect(() => {
    if (!selectedPlayer) {
      setIsPassingModeActive(false);
    }
  }, [selectedPlayer]);

  // Auto trigger AI placement step if it is Beyaz's turn and VS AI is on
  useEffect(() => {
    if (phase === 'PLACEMENT' && isVsAI) {
      const activeRequirement = getNextPlacementRequirement();
      if (activeRequirement.team === 'Beyaz' && placedPlayers.length < 22) {
        const timer = setTimeout(() => {
          triggerAIPlacementStep(placedPlayers);
        }, 600);
        return () => clearTimeout(timer);
      }
    }
  }, [phase, placedPlayers, isVsAI, initiativeWinner]);

  // Auto layout triggers & logs
  const addLog = (text: string, type: 'info' | 'success' | 'warning' | 'goal' | 'dice' = 'info', r1?: number, r2?: number, force: boolean = false) => {
    // Only logged when match has started/is active on pitch, or when force is true, or if it is a game warning
    const isPreMatch = phase === 'INITIATIVE' || phase === 'SQUAD_DRAFT' || phase === 'PLACEMENT';
    if (isPreMatch && !force && type !== 'warning') {
      return;
    }
    const id = Math.random().toString(36).substring(2, 9);
    setLogs(prev => [
      { id, turn: matchTurn, phase: phase.toString(), text, roll1: r1, roll2: r2, type },
      ...prev
    ]);
  };

  // Trigger default rules modal on first view
  useEffect(() => {
    setIsRulesOpen(true);
    if (!welcomeLogged.current) {
      addLog("Kafadan Taktik oyununa hoş geldiniz! Lütfen ilk 11'lerinizi seçin ve mücadeleye başlayın.", "info", undefined, undefined, true);
      welcomeLogged.current = true;
    }
  }, []);

  // Mode Selection handler
  const handleSelectMode = (isAi: boolean, isOnline: boolean = false) => {
    setIsVsAI(isAi);
    setIsOnlineMode(isOnline);
    setOnlineMatchId(null);
    setIsHost(false);
    setMyOnlineTeam(null);
    if (isOnline) {
      addLog("Gerçek Zamanlı Online PvP modu seçildi. Lütfen sunucu bağlantısını ve odanızı ayarlayın.", "info", undefined, undefined, true);
    } else if (isAi) {
      addLog("Yapay Zeka Karşılaşma modu seçildi.", "info", undefined, undefined, true);
    } else {
      addLog("Aynı Cihazda İki Kişilik (Local PvP) oyun modu seçildi.", "info", undefined, undefined, true);
    }
  };

  // Connection handler for Online Matchmaking
  const handleMatchConnected = (matchId: string, hostFlag: boolean, myTeamVal: 'Siyah' | 'Beyaz', hostThemeObj: TeamTheme, guestThemeObj: TeamTheme) => {
    setIsOnlineMode(true);
    setOnlineMatchId(matchId);
    setIsHost(hostFlag);
    setMyOnlineTeam(myTeamVal);
    setIsVsAI(false); // Online is PvP

    setTeamATheme(hostThemeObj);
    setTeamBTheme(guestThemeObj);

    addLog(`Online Karşılaşma Bağlantısı Kuruldu! Maç Odanız: ${matchId}`, "success", undefined, undefined, true);
    addLog(`Takım Atamanız: ${myTeamVal === 'Siyah' ? hostThemeObj.name : guestThemeObj.name} (${myTeamVal === 'Siyah' ? 'Ev Sahibi' : 'Deplasman'})`, "info", undefined, undefined, true);

    const draftBlack = createSquad('Siyah');
    const draftWhite = createSquad('Beyaz');

    if (hostFlag) {
      const initialGameState = {
        phase: 'SQUAD_DRAFT',
        score: { Siyah: 0, Beyaz: 0 },
        turn: 1,
        ballPosition: { x: 10, y: 6 },
        ballCarrier: null,
        placedPlayers: [],
        plannedActions: {},
        logs: [{ id: 'init-log', turn: 1, phase: 'SQUAD_DRAFT', text: 'Online kadro seçim havuzu kuruldu!', type: 'success' }],
        initiativeRolls: null,
        initiativeWinner: null,
        activeTeam: 'Siyah',
        initialPlacedPlayers: [],
        lastDiceResults: null,
        submittedSiyah: false,
        submittedBeyaz: false,
        startingBlack: draftBlack,
        startingWhite: draftWhite,
        draftBlackIds: [],
        draftWhiteIds: []
      };

      const updateRef = doc(db, 'matches', matchId);
      updateDoc(updateRef, {
        gameState: initialGameState,
        updatedAt: serverTimestamp()
      }).then(() => {
        setHasStartedMatch(true);
        setPhase('SQUAD_DRAFT');
      });
    } else {
      setHasStartedMatch(true);
      setPhase('SQUAD_DRAFT');
    }
  };

  // Explicit state syncing to database
  const syncOnlineState = async (updates: Record<string, any>) => {
    if (!isOnlineMode || !onlineMatchId || isIncomingFirestoreUpdate.current) return;
    
    try {
      const matchRef = doc(db, 'matches', onlineMatchId);
      const matchDoc = {
        updatedAt: serverTimestamp()
      } as Record<string, any>;

      if (updates.phase !== undefined) matchDoc.phase = updates.phase;
      if (updates.activeTeam !== undefined) matchDoc.activeTeam = updates.activeTeam;

      const currentGameState = {
        phase: updates.phase !== undefined ? updates.phase : phase,
        score: updates.score !== undefined ? updates.score : score,
        turn: updates.matchTurn !== undefined ? updates.matchTurn : matchTurn,
        ballPosition: updates.ballPosition !== undefined ? updates.ballPosition : ballPosition,
        ballCarrier: updates.ballCarrier !== undefined ? updates.ballCarrier : ballCarrier,
        placedPlayers: updates.placedPlayers !== undefined ? updates.placedPlayers : placedPlayers,
        blackSquad: updates.blackSquad !== undefined ? updates.blackSquad : blackSquad,
        whiteSquad: updates.whiteSquad !== undefined ? updates.whiteSquad : whiteSquad,
        plannedActions: updates.plannedActions !== undefined ? updates.plannedActions : plannedActions,
        logs: updates.logs !== undefined ? updates.logs : logs,
        initiativeRolls: updates.initiativeRolls !== undefined ? updates.initiativeRolls : initiativeRolls,
        initiativeWinner: updates.initiativeWinner !== undefined ? updates.initiativeWinner : initiativeWinner,
        activeTeam: updates.activeTeam !== undefined ? updates.activeTeam : activeTeam,
        initialPlacedPlayers: updates.initialPlacedPlayers !== undefined ? updates.initialPlacedPlayers : initialPlacedPlayers,
        lastDiceResults: updates.lastDiceResults !== undefined ? updates.lastDiceResults : simulationDiceReports,
        submittedSiyah: updates.submittedSiyah !== undefined ? updates.submittedSiyah : submittedSiyah,
        submittedBeyaz: updates.submittedBeyaz !== undefined ? updates.submittedBeyaz : submittedBeyaz,
        startingBlack: updates.startingBlack !== undefined ? updates.startingBlack : startingBlack,
        startingWhite: updates.startingWhite !== undefined ? updates.startingWhite : startingWhite,
        draftBlackIds: updates.draftBlackIds !== undefined ? updates.draftBlackIds : draftBlackIds,
        draftWhiteIds: updates.draftWhiteIds !== undefined ? updates.draftWhiteIds : draftWhiteIds,
      };

      matchDoc.gameState = currentGameState;

      await updateDoc(matchRef, matchDoc);
    } catch (err) {
      console.error("Failed to sync online state: ", err);
    }
  };

  // Listening to match developments
  useEffect(() => {
    if (!isOnlineMode || !onlineMatchId) return;

    const matchRef = doc(db, 'matches', onlineMatchId);
    const unsubscribe = onSnapshot(matchRef, (docSnap) => {
      if (!docSnap.exists()) return;
      const data = docSnap.data();
      
      if (data.gameState) {
        const gs = data.gameState;
        
        isIncomingFirestoreUpdate.current = true;

        if (gs.startingBlack !== undefined) setStartingBlack(gs.startingBlack);
        if (gs.startingWhite !== undefined) setStartingWhite(gs.startingWhite);
        if (gs.draftBlackIds !== undefined) setDraftBlackIds(gs.draftBlackIds);
        if (gs.draftWhiteIds !== undefined) setDraftWhiteIds(gs.draftWhiteIds);
        if (gs.placedPlayers !== undefined) setPlacedPlayers(gs.placedPlayers);
        if (gs.initialPlacedPlayers !== undefined) setInitialPlacedPlayers(gs.initialPlacedPlayers);
        if (gs.ballPosition !== undefined) setBallPosition(gs.ballPosition);
        if (gs.ballCarrier !== undefined) setBallCarrier(gs.ballCarrier);
        if (gs.phase !== undefined) setPhase(gs.phase);
        if (gs.score !== undefined) setScore(gs.score);
        if (gs.turn !== undefined) setMatchTurn(gs.turn);
        if (gs.initiativeRolls !== undefined) setInitiativeRolls(gs.initiativeRolls);
        if (gs.initiativeWinner !== undefined) setInitiativeWinner(gs.initiativeWinner);
        if (gs.activeTeam !== undefined) setActiveTeam(gs.activeTeam);
        if (gs.plannedActions !== undefined) setPlannedActions(gs.plannedActions);
        if (gs.logs !== undefined) setLogs(gs.logs);
        if (gs.lastDiceResults !== undefined) {
          setSimulationDiceReports(gs.lastDiceResults);
        }
        
        setSubmittedSiyah(gs.submittedSiyah || false);
        setSubmittedBeyaz(gs.submittedBeyaz || false);

        // Turn resolution handling
        if (gs.phase === 'RESOLUTION' && Object.keys(gs.plannedActions || {}).length > 0) {
          setShowResolutionModal(true);
          setIsResolutionRolling(true);
          
          setTimeout(() => {
            setIsResolutionRolling(false);
          }, 1800);
        } else if (gs.phase === 'TACTICS_BLACK' || gs.phase === 'TACTICS_WHITE') {
          setShowResolutionModal(false);
          setIsResolutionRolling(false);
          
          if (gs.submittedSiyah && gs.submittedBeyaz && isHost) {
            isIncomingFirestoreUpdate.current = false;
            executeCalculatedResolutions(gs.plannedActions || {});
          }
        }

        setTimeout(() => {
          isIncomingFirestoreUpdate.current = false;
        }, 120);
      }
    });

    return () => unsubscribe();
  }, [isOnlineMode, onlineMatchId, isHost]);

  // Start initiative phase
  const handleConfirmStartingSquads = (blackSquadAll: Player[], whiteSquadAll: Player[]) => {
    // If local PvP and same themes chosen, assign Home & Away kit variants
    if (!isVsAI && teamATheme.id === teamBTheme.id) {
      const themeId = teamATheme.id;
      const originalTheme = teamATheme;
      
      const TEAM_COLOR_NAMES: Record<string, { primary: string; secondary: string }> = {
        'siyah-beyaz': { primary: 'Siyah', secondary: 'Beyaz' },
        'bordo-mavi': { primary: 'Bordo', secondary: 'Mavi' },
        'sari-lacivert': { primary: 'Lacivert', secondary: 'Sarı' },
        'sari-kirmizi': { primary: 'Kırmızı', secondary: 'Sarı' },
        'yesil-beyaz': { primary: 'Yeşil', secondary: 'Beyaz' },
        'lacivert-turuncu': { primary: 'Lacivert', secondary: 'Turuncu' }
      };
      
      const names = TEAM_COLOR_NAMES[themeId] || { primary: 'Ev Sahibi', secondary: 'Deplasman' };
      
      // Update teamA to be Home Kit
      const homeTheme: TeamTheme = {
        ...originalTheme,
        name: `${originalTheme.name} (${names.primary})`
      };
      
      // Compute beautiful Away Kit
      let awayCardBg = originalTheme.cardBg;
      let awayCardBorder = originalTheme.cardBorder;
      if (themeId === 'siyah-beyaz') {
        awayCardBg = 'from-slate-100 via-slate-50 to-white';
        awayCardBorder = 'border-slate-300 hover:border-slate-500';
      } else if (themeId === 'yesil-beyaz') {
        awayCardBg = 'from-emerald-50 via-white to-emerald-100';
        awayCardBorder = 'border-emerald-300 hover:border-emerald-500';
      } else if (themeId === 'sari-lacivert') {
        awayCardBg = 'from-amber-50 via-white to-yellow-100';
        awayCardBorder = 'border-yellow-300 hover:border-yellow-500';
      } else if (themeId === 'sari-kirmizi') {
        awayCardBg = 'from-amber-50 via-white to-yellow-100';
        awayCardBorder = 'border-yellow-300 hover:border-yellow-500';
      } else if (themeId === 'bordo-mavi') {
        awayCardBg = 'from-sky-50 via-white to-sky-100';
        awayCardBorder = 'border-sky-300 hover:border-sky-500';
      } else if (themeId === 'lacivert-turuncu') {
        awayCardBg = 'from-orange-50 via-white to-orange-100';
        awayCardBorder = 'border-orange-300 hover:border-orange-500';
      }
      
      const awayTheme: TeamTheme = {
        ...originalTheme,
        name: `${originalTheme.name} (${names.secondary})`,
        primaryBg: originalTheme.secondaryBg,
        secondaryBg: originalTheme.primaryBg,
        textColor: '#0f172a',
        textAccent: '#475569',
        cardBg: awayCardBg,
        cardBorder: awayCardBorder
      };
      
      setTeamATheme(homeTheme);
      setTeamBTheme(awayTheme);
    }

    // Keep full list for drafting later
    setStartingBlack(blackSquadAll);
    setStartingWhite(whiteSquadAll);
    setHasStartedMatch(true);
    setPhase('INITIATIVE');
    addLog("Takım seçimleri tamamlandı! Şimdi Kur'a Atışı ile kimin önce yerleşeceği belirlenecek.", "success");
  };

  const handleSetDraftBlackIds: React.Dispatch<React.SetStateAction<string[]>> = (val) => {
    setDraftBlackIds((prev) => {
      const computed = typeof val === 'function' ? val(prev) : val;
      if (isOnlineMode) {
        syncOnlineState({ draftBlackIds: computed });
      }
      return computed;
    });
  };

  const handleSetDraftWhiteIds: React.Dispatch<React.SetStateAction<string[]>> = (val) => {
    setDraftWhiteIds((prev) => {
      const computed = typeof val === 'function' ? val(prev) : val;
      if (isOnlineMode) {
        syncOnlineState({ draftWhiteIds: computed });
      }
      return computed;
    });
  };

  const handleDraftDrafterChange = (drafter: TeamColor) => {
    setActiveTeam(drafter);
    if (isOnlineMode) {
      syncOnlineState({ activeTeam: drafter });
    }
  };

  // Confirm starting 11 chosen from draft pool
  const handleConfirmDraftPicks = (black11: Player[], white11: Player[]) => {
    setStartingBlack(black11);
    setStartingWhite(white11);
    setPhase('PLACEMENT');
    const logDesc = `Kadrolar kuruldu! ${teamATheme.name} ve ${teamBTheme.name} takımlarının ilk 11 kadroları kesinleşti.`;
    addLog(logDesc, "success");

    if (isOnlineMode) {
      syncOnlineState({
        startingBlack: black11,
        startingWhite: white11,
        phase: 'PLACEMENT',
        logs: [
          { id: 'draft-p1', turn: matchTurn, phase: 'PLACEMENT', text: logDesc, type: 'success' },
          ...logs
        ]
      });
    }
  };

  // Kur'a Atisi (Roll for placement priority)
  const executeInitiativeRoll = () => {
    if (isOnlineMode && !isHost) {
      addLog("Kur'a Zarlarını yalnızca odanın kurucusu (Ev Sahibi) başlatabilir.", "warning");
      return;
    }

    setShowInitiativeModal(true);
    setIsInitiativeRolling(true);
    
    setTimeout(() => {
      const bRoll = Math.floor(Math.random() * 20) + 1;
      const wRoll = Math.floor(Math.random() * 20) + 1;
      
      const winner: TeamColor = bRoll >= wRoll ? 'Siyah' : 'Beyaz';

      // Random AI formation choice
      const formations = ['4-4-2', '3-5-2', '4-3-3', '5-4-1'] as const;
      const chosenFormation = formations[Math.floor(Math.random() * formations.length)];
      setAiFormation(chosenFormation);
      
      setInitiativeRolls({ Siyah: bRoll, Beyaz: wRoll });
      setInitiativeWinner(winner);
      setActiveTeam(winner);
      setIsInitiativeRolling(false);

      const rollMsg1 = `Kur'a Atıldı! ${teamATheme.name} Takımı: [${bRoll}], ${teamBTheme.name} Takımı: [${wRoll}] attı.`;
      const rollMsg2 = `Zar üstünlüğünü alan ${winner === 'Siyah' ? teamATheme.name : teamBTheme.name} oyuna önce yerleşme hakkı kazandı! Taktiksel yerleşim aşaması başladı.`;

      addLog(rollMsg1, "dice", bRoll, wRoll, true);
      addLog(rollMsg2, "success", undefined, undefined, true);

      if (isOnlineMode) {
        syncOnlineState({
          initiativeRolls: { Siyah: bRoll, Beyaz: wRoll },
          initiativeWinner: winner,
          activeTeam: winner,
          logs: [
            { id: 'roll-l1', turn: matchTurn, phase: 'INITIATIVE', text: rollMsg1, type: 'dice' },
            { id: 'roll-l2', turn: matchTurn, phase: 'INITIATIVE', text: rollMsg2, type: 'success' },
            ...logs
          ]
        });
      }
    }, 1800);
  };

  // Current placement phase tracker
  const getNextPlacementRequirement = (): {
    team: TeamColor;
    isGKOnly: boolean;
    countToPlace: number;
    description: string;
  } => {
    const blackPlacedCount = placedPlayers.filter(p => p.team === 'Siyah').length;
    const whitePlacedCount = placedPlayers.filter(p => p.team === 'Beyaz').length;

    // Siyah started first (standard)
    if (initiativeWinner === 'Siyah') {
      if (blackPlacedCount === 0) {
        return { team: 'Siyah', isGKOnly: false, countToPlace: 1, description: `${teamATheme.name}: İstediğiniz bir oyuncuyu seçip kendi yarı sahanıza yerleştirin.` };
      }
      if (blackPlacedCount === 1) {
        return { team: 'Siyah', isGKOnly: false, countToPlace: 1, description: `${teamATheme.name}: İstediğiniz başka bir oyuncuyu seçip kendi yarı sahanıza yerleştirin.` };
      }
      if (whitePlacedCount === 0) {
        return { team: 'Beyaz', isGKOnly: false, countToPlace: 1, description: `${teamBTheme.name}: İstediğiniz bir oyuncuyu seçip kendi yarı sahanıza yerleştirin.` };
      }
      if (whitePlacedCount === 1) {
        return { team: 'Beyaz', isGKOnly: false, countToPlace: 2, description: `${teamBTheme.name}: İstediğiniz 2 oyuncuyu seçip sırayla kendi yarı sahanıza yerleştirin.` };
      }

      // Alternate
      if (blackPlacedCount <= whitePlacedCount) {
        return { team: 'Siyah', isGKOnly: false, countToPlace: 1, description: `${teamATheme.name} ${blackPlacedCount + 1}. oyuncuyu yerleştiriyor.` };
      } else {
        return { team: 'Beyaz', isGKOnly: false, countToPlace: 1, description: `${teamBTheme.name} ${whitePlacedCount + 1}. oyuncuyu yerleştiriyor.` };
      }
    } else {
      // Beyaz won toss, they start first
      if (whitePlacedCount === 0) {
        return { team: 'Beyaz', isGKOnly: false, countToPlace: 1, description: `${teamBTheme.name}: İstediğiniz bir oyuncuyu seçip yerleştirin.` };
      }
      if (whitePlacedCount === 1) {
        return { team: 'Beyaz', isGKOnly: false, countToPlace: 1, description: `${teamBTheme.name}: İstediğiniz başka bir oyuncuyu seçip yerleştirin.` };
      }
      if (blackPlacedCount === 0) {
        return { team: 'Siyah', isGKOnly: false, countToPlace: 1, description: `${teamATheme.name}: İstediğiniz bir oyuncuyu seçip yerleştirin.` };
      }
      if (blackPlacedCount === 1) {
        return { team: 'Siyah', isGKOnly: false, countToPlace: 2, description: `${teamATheme.name}: İstediğiniz 2 oyuncuyu seçip sırayla yerleştirin.` };
      }

      // Alternate
      if (whitePlacedCount <= blackPlacedCount) {
        return { team: 'Beyaz', isGKOnly: false, countToPlace: 1, description: `${teamBTheme.name} ${whitePlacedCount + 1}. oyuncuyu yerleştiriyor.` };
      } else {
        return { team: 'Siyah', isGKOnly: false, countToPlace: 1, description: `${teamATheme.name} ${blackPlacedCount + 1}. oyuncuyu yerleştiriyor.` };
      }
    }
  };

  const req = getNextPlacementRequirement();

  // Pick unplaced player to place on board
  const getUnplacedPlayersForTeam = (team: TeamColor): Player[] => {
    const selectedList = team === 'Siyah' ? startingBlack : startingWhite;
    const alreadyPlacedIds = placedPlayers.filter(p => p.team === team).map(p => p.player.id);
    return selectedList.filter(p => !alreadyPlacedIds.includes(p.id));
  };

  // Perform AI auto placement instantly step by step!
  const triggerAIPlacementStep = (currentPlaced: PlacedPlayer[]) => {
    const unplaced = startingWhite.filter(p => !currentPlaced.some(curr => curr.player.id === p.id));
    if (unplaced.length === 0) return;

    // Is next required placement a GK?
    const isGkNeeded = currentPlaced.filter(p => p.team === 'Beyaz' && p.isGK).length === 0;
    const candidate = isGkNeeded 
      ? unplaced.find(p => p.positionGroup === 'GK') || unplaced[0] 
      : unplaced.find(p => p.positionGroup !== 'GK') || unplaced[0];

    const targetPos = getAIPlacementPosition(candidate, currentPlaced, aiFormation);
    
    const newPlaced: PlacedPlayer = {
      player: candidate,
      team: 'Beyaz',
      position: targetPos,
      isGK: candidate.positionGroup === 'GK'
    };

    const nextList = [...currentPlaced, newPlaced];
    setPlacedPlayers(nextList);
    addLog(`Yapay Zeka (Beyaz), [${candidate.name} - ${candidate.number}] adlı oyuncuyu (${targetPos.x}, ${targetPos.y}) hücresine yerleştirdi.`, "info");

    // Check if placement fully finished
    if (nextList.length === 22) {
      finalizePlacement(nextList);
    }
  };

  // On board click during PLACEMENT phase
  const handlePlacementClick = (pos: Position) => {
    // If online, only allow the current turn team to place
    if (isOnlineMode && myOnlineTeam !== req.team) {
      addLog(`Şu an rakip (${req.team === 'Siyah' ? teamATheme.name : teamBTheme.name}) oyuncu yerleştiriyor, lütfen bekleyin.`, "warning");
      return;
    }

    // If it's against AI and it is Beyaz's turn, block human clicks
    if (isVsAI && req.team === 'Beyaz') {
      addLog("Şu an Yapay Zeka (Beyaz Takım) oyuncu yerleştiriyor, lütfen bekleyin.", "warning");
      return;
    }

    // Check if clicked cell is occupied
    const occupiedPlayer = placedPlayers.find(p => p.position.x === pos.x && p.position.y === pos.y);
    if (occupiedPlayer) {
      if (occupiedPlayer.team === req.team) {
        // Human is selecting or toggling an already placed player of their own team
        if (selectedPlacedPlayerId === occupiedPlayer.player.id) {
          setSelectedPlacedPlayerId(null);
          addLog(`[${occupiedPlayer.player.name}] seçimi kaldırıldı.`, "info", undefined, undefined, false);
        } else {
          setSelectedPlacedPlayerId(occupiedPlayer.player.id);
          addLog(`[${occupiedPlayer.player.name}] seçildi! Başka boş bir kareye tıklayarak yerini değiştirebilir veya sağdaki panelden yedek kulübesine çekebilirsiniz.`, "info", undefined, undefined, false);
        }
      } else {
        addLog("Bu hücre zaten dolu, lütfen başka bir yer seçin.", "warning");
      }
      return;
    }

    // Since the cell is EMPTY:
    // Case 1: If there is a selected placed player, move them here!
    if (selectedPlacedPlayerId) {
      const playerToMove = placedPlayers.find(p => p.player.id === selectedPlacedPlayerId);
      if (playerToMove) {
        // Boundary constraints
        if (req.team === 'Siyah' && pos.x >= 10) {
          addLog(`${teamATheme.name} yalnızca kendi yarı sahasına (0-9) yerleşebilir.`, "warning");
          return;
        }
        if (req.team === 'Beyaz' && pos.x <= 10) {
          addLog(`${teamBTheme.name} yalnızca kendi yarı sahasına (11-20) yerleşebilir.`, "warning");
          return;
        }

        const isPlayerGK = playerToMove.player.positionGroup === 'GK';
        if (isPlayerGK) {
          // Goalkeepers can be placed anywhere in their team half!
          const isOwnHalf = req.team === 'Siyah' ? pos.x < 10 : pos.x > 10;
          if (!isOwnHalf) {
            addLog("Lütfen kalecinizi kendi yarı sahanıza yerleştirin.", "warning");
            return;
          }
        } else {
          const isGoalSpot = (pos.x === 0 || pos.x === 20) && pos.y >= 5 && pos.y <= 7;
          if (isGoalSpot) {
            addLog("Kale alanına sadece Kaleci yerleştirilebilir.", "warning");
            return;
          }
        }

        const nextList = placedPlayers.map(p => {
          if (p.player.id === selectedPlacedPlayerId) {
            return { ...p, position: pos };
          }
          return p;
        });
        setPlacedPlayers(nextList);
        addLog(`[${playerToMove.player.name}] yeni konumuna (${pos.x}, ${pos.y}) başarıyla taşındı.`, "success");
        setSelectedPlacedPlayerId(null);
        if (isOnlineMode) {
          syncOnlineState({ placedPlayers: nextList });
        }
        return;
      }
    }

    // Case 2: Standard fresh placement of a player from the unplaced pool
    // Boundary constraints (No choosing opponent half)
    if (req.team === 'Siyah' && pos.x >= 10) {
      addLog(`${teamATheme.name} yalnızca kendi yarı sahasına (0-9) yerleşebilir.`, "warning");
      return;
    }
    if (req.team === 'Beyaz' && pos.x <= 10) {
      addLog(`${teamBTheme.name} yalnızca kendi yarı sahasına (11-20) yerleşebilir.`, "warning");
      return;
    }

    // Get candidate
    const unplaced = getUnplacedPlayersForTeam(req.team);
    if (unplaced.length === 0) return;

    // Pick chosen player from state
    const chosenPlayer = unplaced.find(p => p.id === selectedPlacementPlayerId) || unplaced[0];
    if (!chosenPlayer) return;

    // Constrain goalkeeper placement
    const isPlayerGK = chosenPlayer.positionGroup === 'GK';
    const activeGKCount = placedPlayers.filter(p => p.team === req.team && p.isGK).length;
    if (isPlayerGK && activeGKCount >= 1) {
      addLog("Kadro Kuralları: Sahada en fazla 1 Kaleci bulundurabilirsiniz.", "warning");
      return;
    }

    const teamPlacedCount = placedPlayers.filter(p => p.team === req.team).length;
    if (teamPlacedCount === 10 && activeGKCount === 0 && !isPlayerGK) {
      addLog("Taktik Kuralı: Sahada en az 1 Kaleci (GK) bulunmalıdır! Lütfen son oyuncuyu Kaleci olarak yerleştirin.", "warning");
      return;
    }

    if (isPlayerGK) {
      // Goalkeepers can be placed anywhere in their team half!
      const isOwnHalf = req.team === 'Siyah' ? pos.x < 10 : pos.x > 10;
      if (!isOwnHalf) {
        addLog("Lütfen kalecinizi kendi yarı sahanıza yerleştirin.", "warning");
        return;
      }
    } else {
      const isGoalSpot = (pos.x === 0 || pos.x === 20) && pos.y >= 5 && pos.y <= 7;
      if (isGoalSpot) {
        addLog("Kale alanına sadece Kaleci yerleştirilebilir.", "warning");
        return;
      }
    }

    const newPlaced: PlacedPlayer = {
      player: chosenPlayer,
      team: req.team,
      position: pos,
      isGK: isPlayerGK
    };

    const nextList = [...placedPlayers, newPlaced];
    setPlacedPlayers(nextList);
    addLog(`${req.team === 'Siyah' ? teamATheme.name : teamBTheme.name}, [${chosenPlayer.name}] adlı oyuncuyu (${pos.x}, ${pos.y}) hücresine yerleştirdi.`, "success");

    if (isOnlineMode) {
      syncOnlineState({ placedPlayers: nextList });
    }

    if (nextList.length === 22) {
      finalizePlacement(nextList);
    }
  };

  const finalizePlacement = (finalPlaced: PlacedPlayer[]) => {
    // Maç başladığındaki ilk taktiksel dizilişleri sakla
    setInitialPlacedPlayers(finalPlaced);

    setPhase('TACTICS_BLACK');
    setActiveTeam('Siyah');

    // Find a kickoff taker from starting team ('Siyah'). Preferably a Forward (FW), then Midfielder (MF), then anyone who is not GK.
    let taker = finalPlaced.find(p => p.team === 'Siyah' && p.player.positionGroup === 'FW');
    if (!taker) {
      taker = finalPlaced.find(p => p.team === 'Siyah' && p.player.positionGroup === 'MF');
    }
    if (!taker) {
      taker = finalPlaced.find(p => p.team === 'Siyah' && !p.isGK);
    }

    const santraPos = { x: 10, y: 6 };

    if (taker) {
      // Find who is occupying the santra spot (10, 6) to swap positions with the taker
      const occupant = finalPlaced.find(p => p.position.x === santraPos.x && p.position.y === santraPos.y);

      const updatedPlaced = finalPlaced.map(p => {
        if (p.player.id === taker.player.id) {
          return { ...p, position: santraPos };
        }
        if (occupant && p.player.id === occupant.player.id) {
          return { ...p, position: taker.position };
        }
        return p;
      });

      setPlacedPlayers(updatedPlaced);
      setBallPosition(santraPos);
      setBallCarrier({ team: 'Siyah', playerId: taker.player.id });
      const logSuccess = `Oyun santra noktasından başlıyor! ${teamATheme.name} oyuncusu [${taker.player.name}] topu (10, 6) santra hücresinde oyuna sokuyor.`;
      addLog(logSuccess, "success", undefined, undefined, true);

      if (isOnlineMode) {
        syncOnlineState({
          initialPlacedPlayers: finalPlaced,
          placedPlayers: updatedPlaced,
          ballPosition: santraPos,
          ballCarrier: { team: 'Siyah', playerId: taker.player.id },
          phase: 'TACTICS_BLACK',
          activeTeam: 'Siyah',
          logs: [
            { id: 'start-kickoff', turn: matchTurn, phase: 'TACTICS_BLACK', text: logSuccess, type: 'success' },
            ...logs
          ]
        });
      }
    } else {
      setBallPosition(santraPos);
      setBallCarrier(null);
      const logSuccess2 = "Tüm oyuncular sahaya yerleşti! Top tarafsız olarak (10, 6) hücresinde boşta oyuna başlıyor.";
      addLog(logSuccess2, "success", undefined, undefined, true);

      if (isOnlineMode) {
        syncOnlineState({
          initialPlacedPlayers: finalPlaced,
          placedPlayers: finalPlaced,
          ballPosition: santraPos,
          ballCarrier: null,
          phase: 'TACTICS_BLACK',
          activeTeam: 'Siyah',
          logs: [
            { id: 'start-santra', turn: matchTurn, phase: 'TACTICS_BLACK', text: logSuccess2, type: 'success' },
            ...logs
          ]
        });
      }
    }
    addLog(`${teamATheme.name} Taktik Belirleme Aşaması başlasın! Oyuncularınızı seçip hamlelerini planlayın.`, "info", undefined, undefined, true);
  };

  // Click handler on board
  const handleCellClick = (pos: Position) => {
    if (phase === 'PLACEMENT') {
      handlePlacementClick(pos);
      return;
    }

    if (phase === 'RESOLUTION' || phase === 'GOAL_CELEBRATION' || phase === 'MATCH_OVER') {
      return;
    }

    // TACTICS PHASE CLICK LOGIC
    const clickedPlayer = placedPlayers.find(p => p.position.x === pos.x && p.position.y === pos.y);

    // If passing mode is active, check if clicked own teammate is targetable
    if (isPassingModeActive && selectedPlayer && clickedPlayer && clickedPlayer.team === activeTeam) {
      const isCarrier = ballCarrier?.playerId === selectedPlayer.player.id;
      if (isCarrier && clickedPlayer.player.id !== selectedPlayer.player.id) {
        // Plan Pass action!
        setPlannedActions(prev => ({
          ...prev,
          [selectedPlayer.player.id]: {
            playerId: selectedPlayer.player.id,
            type: 'PASS',
            targetPos: pos,
            targetPlayerId: clickedPlayer.player.id
          }
        }));
        addLog(`PAS TALİMATI: [${selectedPlayer.player.name}] -> [${clickedPlayer.player.name}] oyuncusuna pas verecek!`, "info");
        setIsPassingModeActive(false);
        setSelectedPlayer(null);
        return;
      }
    }

    // If clicking an own player: SELECT or DESELECT them for tactical actions
    if (clickedPlayer && clickedPlayer.team === activeTeam) {
      setIsPassingModeActive(false);
      if (selectedPlayer && selectedPlayer.player.id === clickedPlayer.player.id) {
        setSelectedPlayer(null); // Click selected player again to deselect
      } else {
        setSelectedPlayer(clickedPlayer);
        setInspectingPlayer(clickedPlayer.player);
      }
      return;
    }

    // If clicking an empty cell or opponent: handle action intent
    if (selectedPlayer) {
      const pPos = selectedPlayer.position;
      const isCarrier = ballCarrier?.playerId === selectedPlayer.player.id;
      const distanceVal = getDistance(pPos, pos);
      
      const maxRange = 6; // Allow planning up to 6 cells sprint/run!

      // Handle Shooting Event (Shoot target must be LeftGoal (0, 5-7) or RightGoal (20, 5-7))
      const isLeftGoalShooting = activeTeam === 'Beyaz' && isLeftGoal(pos.x, pos.y);
      const isRightGoalShooting = activeTeam === 'Siyah' && isRightGoal(pos.x, pos.y);

      if (isCarrier && (isLeftGoalShooting || isRightGoalShooting)) {
        // Plan Shoot action!
        setPlannedActions(prev => ({
          ...prev,
          [selectedPlayer.player.id]: {
            playerId: selectedPlayer.player.id,
            type: 'SHOOT',
            targetPos: pos
          }
        }));
        addLog(`ŞUT TALİMATI: [${selectedPlayer.player.name}] kaleye şut çekecek!`, "warning");
        setSelectedPlayer(null);
        return;
      }

      // Handle Passing Event
      if (isCarrier && clickedPlayer && clickedPlayer.team === activeTeam && clickedPlayer.player.id !== selectedPlayer.player.id) {
        // Plan Pass action!
        setPlannedActions(prev => ({
          ...prev,
          [selectedPlayer.player.id]: {
            playerId: selectedPlayer.player.id,
            type: 'PASS',
            targetPos: pos,
            targetPlayerId: clickedPlayer.player.id
          }
        }));
        addLog(`PAS TALİMATI: [${selectedPlayer.player.name}] -> [${clickedPlayer.player.name}] oyuncusuna pas verecek!`, "info");
        setSelectedPlayer(null);
        return;
      }

      // Handle Standard Movements & Dribbling
      if (!clickedPlayer && distanceVal <= maxRange) {
        if (isCarrier) {
          // Top sürüyor
          setPlannedActions(prev => ({
            ...prev,
            [selectedPlayer.player.id]: {
              playerId: selectedPlayer.player.id,
              type: 'DRIBBLE',
              targetPos: pos
            }
          }));
          addLog(`TOP SÜRME: [${selectedPlayer.player.name}] topu (${pos.x}, ${pos.y}) hücresine sürecek.`, "info");
        } else {
          // Koşu yapıyor
          setPlannedActions(prev => ({
            ...prev,
            [selectedPlayer.player.id]: {
              playerId: selectedPlayer.player.id,
              type: 'MOVE',
              targetPos: pos
            }
          }));
          addLog(`KOŞU TALİMATI: [${selectedPlayer.player.name}] -> (${pos.x}, ${pos.y}) hücresine koşacak.`, "info");
        }
        setSelectedPlayer(null);
        return;
      }

      // Clicked something invalid
      setSelectedPlayer(null);
    }
  };

  const isLeftGoal = (x: number, y: number) => x === 0 && y >= 5 && y <= 7;
  const isRightGoal = (x: number, y: number) => x === 20 && y >= 5 && y <= 7;

  // Direct action helpers for selected players (UX upgrade to make pass/shoot extremely clear)
  const getEligiblePassTeammates = (player: PlacedPlayer) => {
    if (ballCarrier?.playerId !== player.player.id) return [];
    return placedPlayers.filter(p => 
      p.team === player.team && 
      p.player.id !== player.player.id
    );
  };

  const canPlayerShoot = (player: PlacedPlayer) => {
    if (ballCarrier?.playerId !== player.player.id) return false;
    return true; // Shooting allowed from anywhere on the pitch!
  };

  const planPassAction = (fromPlayer: PlacedPlayer, toPlayer: PlacedPlayer) => {
    setPlannedActions(prev => ({
      ...prev,
      [fromPlayer.player.id]: {
        playerId: fromPlayer.player.id,
        type: 'PASS',
        targetPos: toPlayer.position,
        targetPlayerId: toPlayer.player.id
      }
    }));
    addLog(`PAS TALİMATI: [${fromPlayer.player.name}] -> [${toPlayer.player.name}] oyuncusuna pas verecek!`, "info");
    setSelectedPlayer(null);
  };

  const planShootAction = (player: PlacedPlayer) => {
    const targetX = player.team === 'Siyah' ? 20 : 0;
    const targetY = 6; // Goal center
    setPlannedActions(prev => ({
      ...prev,
      [player.player.id]: {
        playerId: player.player.id,
        type: 'SHOOT',
        targetPos: { x: targetX, y: targetY }
      }
    }));
    addLog(`ŞUT TALİMATI: [${player.player.name}] kaleye şut çekecek!`, "warning");
    setSelectedPlayer(null);
  };

  // Clear single action plan
  const clearPlayerAction = (playerId: string) => {
    setPlannedActions(prev => {
      const next = { ...prev };
      delete next[playerId];
      return next;
    });
    addLog("Oyuncu talimatı iptal edildi.", "info");
  };

  // Finalize active team tactical planning
  const handleEndTacticTurn = () => {
    if (isOnlineMode) {
      if (myOnlineTeam === 'Siyah') {
        const blackPlanned = Object.fromEntries(
          Object.entries(plannedActions).filter(([pid]) => {
            const p = placedPlayers.find(pl => pl.player.id === pid);
            return p && p.team === 'Siyah';
          })
        );
        addLog(`Taktikleriniz kilitlendi! ${teamBTheme.name} takımının taktik planlarını bitirmesi bekleniyor...`, "success", undefined, undefined, true);
        
        const mergedPlannedList = { ...plannedActions, ...blackPlanned };
        syncOnlineState({
          plannedActions: mergedPlannedList,
          submittedSiyah: true
        });
        setSubmittedSiyah(true);
      } else if (myOnlineTeam === 'Beyaz') {
        const whitePlanned = Object.fromEntries(
          Object.entries(plannedActions).filter(([pid]) => {
            const p = placedPlayers.find(pl => pl.player.id === pid);
            return p && p.team === 'Beyaz';
          })
        );
        addLog(`Taktikleriniz kilitlendi! ${teamATheme.name} takımının taktik planlarını bitirmesi bekleniyor...`, "success", undefined, undefined, true);
        
        const mergedPlannedList = { ...plannedActions, ...whitePlanned };
        syncOnlineState({
          plannedActions: mergedPlannedList,
          submittedBeyaz: true
        });
        setSubmittedBeyaz(true);
      }
      return;
    }

    if (activeTeam === 'Siyah') {
      if (isVsAI) {
        // Instantly plan AI White team actions
        const aiActions = planAIActions(placedPlayers, ballPosition, ballCarrier);
        
        // Merge AI policies
        setPlannedActions(prev => ({
          ...prev,
          ...aiActions
        }));
        
        setPhase('RESOLUTION');
        addLog(`${teamBTheme.name} (Yapay Zeka) taktiklerini anında belirledi! Şimdi fiziksel zarlar atılıyor...`, "success");
        executeCalculatedResolutions(aiActions);
      } else {
        // Local multi-player, hand over to Beyaz
        setPhase('TACTICS_WHITE');
        setActiveTeam('Beyaz');
        setSelectedPlayer(null);
        addLog(`${teamATheme.name} turunu kapattı. Şimdi ${teamBTheme.name} taktiklerini belirliyor!`, "success");
      }
    } else {
      // Beyaz finished (local PvP)
      setPhase('RESOLUTION');
      addLog("Her iki takım da planlarını kilitledi! Şimdi fiziksel zarlar atılıyor...", "success");
      executeCalculatedResolutions({});
    }
  };

  // Core Dice Resolver & Simulator
  const executeCalculatedResolutions = (aiActions: Record<string, PlannedAction>) => {
    setShowResolutionModal(true);
    setIsResolutionRolling(true);
    setSimulationDiceReports([]);
    
    // We combine current state of planned action, incorporating any AI additions passed in to be deterministic
    const finalPlanned: Record<string, PlannedAction> = { ...plannedActions, ...aiActions };

    setTimeout(() => {
      // We will perform actions processing sequence step-by-step
      const reports: typeof simulationDiceReports = [];
      let updatedPlaced = [...placedPlayers];
      let updatedBallCarrier = ballCarrier ? { ...ballCarrier } : null;
      let updatedBallPosition = { ...ballPosition };
      let newScore = { ...score };
      let goalScored: 'Siyah' | 'Beyaz' | null = null;
      let scorerObj: PlacedPlayer | null = null;

       // 1. Move players who chose "MOVE" or "DRIBBLE"
      // Before creating target mapping, we check if they are trying to run/sprint multi-cells (>1 cell distance).
      // If so, we perform a speed dice check! The distance of progress is determined by the total dice roll + speed stat.
      Object.entries(finalPlanned).forEach(([playerId, action]) => {
        if (action.type === 'MOVE' || action.type === 'DRIBBLE') {
          const playerObj = updatedPlaced.find(p => p.player.id === playerId);
          if (!playerObj) return;

          const distanceVal = getDistance(playerObj.position, action.targetPos);
          if (distanceVal > 1) {
            // Sprint/Run proportional dice check!
            const roll = Math.floor(Math.random() * 20) + 1;
            const speedBonus = playerObj.player.stats.hiz;
            const total = roll + speedBonus;

            // Proportional distance achievement based on cumulative power score
            let achievedDistance = 1;
            if (total >= 30) achievedDistance = 6;
            else if (total >= 26) achievedDistance = 5;
            else if (total >= 22) achievedDistance = 4;
            else if (total >= 18) achievedDistance = 3;
            else if (total >= 14) achievedDistance = 2;
            else achievedDistance = 1;

            const finalDistance = Math.min(distanceVal, achievedDistance);

            if (finalDistance === distanceVal) {
              reports.push({
                description: `⚡ Hızlı Koşu Başarılı! [${playerObj.player.name}] istediği hedef hücreye koştu. (Planlanan: ${distanceVal}k, Ulaşılan: ${finalDistance}k, Toplam Güç: ${total})`,
                rolls: [
                  { name: playerObj.player.name, roll, stat: speedBonus, total, team: playerObj.team }
                ]
              });
            } else {
              // Calculate target position that is finalDistance steps along the way
              const tX = action.targetPos.x;
              const tY = action.targetPos.y;
              const pX = playerObj.position.x;
              const pY = playerObj.position.y;

              let currentX = pX;
              let currentY = pY;
              for (let step = 0; step < finalDistance; step++) {
                const dx = Math.sign(tX - currentX);
                const dy = Math.sign(tY - currentY);
                currentX += dx;
                currentY += dy;
              }

              const actualTarget = {
                x: Math.max(0, Math.min(20, currentX)),
                y: Math.max(0, Math.min(12, currentY))
              };

              reports.push({
                description: `🏃 Koşuldu! [${playerObj.player.name}] hızlı koşuda sınırını zorladı ve zarına göre yol alabildi. (Planlanan: ${distanceVal}k, Ulaşılan: ${finalDistance}k, Toplam Güç: ${total})`,
                rolls: [
                  { name: playerObj.player.name, roll, stat: speedBonus, total, team: playerObj.team }
                ]
              });

              // Overwrite action's targetPos so all subsequent resolution steps (collisions, ball carrying, loose ball) use the proportional step position
              action.targetPos = actualTarget;
            }
          }
        }
      });

      // Now map movement targets to check for collision battles (same destination cell)
      const moveTargets: Record<string, string[]> = {}; // key: "x,y", val: list of playerIds
      
      Object.entries(finalPlanned).forEach(([playerId, action]) => {
        if (action.type === 'MOVE' || action.type === 'DRIBBLE') {
          const key = `${action.targetPos.x},${action.targetPos.y}`;
          if (!moveTargets[key]) moveTargets[key] = [];
          moveTargets[key].push(playerId);
        }
      });

      // Process collision power battles!
      Object.entries(moveTargets).forEach(([coordStr, plist]) => {
        const [targetX, targetY] = coordStr.split(',').map(Number);
        const targetPos = { x: targetX, y: targetY };

        if (plist.length === 1) {
          // 1 player, moves safely
          const pid = plist[0];
          const placedIdx = updatedPlaced.findIndex(p => p.player.id === pid);
          if (placedIdx !== -1) {
            updatedPlaced[placedIdx] = {
              ...updatedPlaced[placedIdx],
              position: targetPos
            };
            // If this player carries the ball, move ball with them!
            if (updatedBallCarrier?.playerId === pid) {
              updatedBallPosition = targetPos;
            }
          }
        } else {
          // Multiple players try to land on SAME cell! Trigger extreme collision battle using Güç stat + d20
          const contestants = plist.map(pid => updatedPlaced.find(p => p.player.id === pid)!).filter(Boolean);
          
          if (contestants.length >= 2) {
            const p1 = contestants[0];
            const p2 = contestants[1];

            const p1Roll = Math.floor(Math.random() * 20) + 1;
            const p2Roll = Math.floor(Math.random() * 20) + 1;

            const p1Val = p1.player.stats.guc + p1Roll;
            const p2Val = p2.player.stats.guc + p2Roll;

            const winner = p1Val >= p2Val ? p1 : p2;
            const loser = p1Val >= p2Val ? p2 : p1;

            reports.push({
              description: `Omuz Omuza Çarpışma! (${targetX}, ${targetY}) hücresinde ikili mücadele.`,
              rolls: [
                { name: p1.player.name, roll: p1Roll, stat: p1.player.stats.guc, total: p1Val, team: p1.team },
                { name: p2.player.name, roll: p2Roll, stat: p2.player.stats.guc, total: p2Val, team: p2.team }
              ]
            });

            // Winner moves to cell, loser is stopped in current position
            const wIdx = updatedPlaced.findIndex(p => p.player.id === winner.player.id);
            if (wIdx !== -1) {
              updatedPlaced[wIdx] = {
                ...updatedPlaced[wIdx],
                position: targetPos
              };
              if (updatedBallCarrier?.playerId === winner.player.id) {
                updatedBallPosition = targetPos;
              }
            }
          }
        }
      });

      // 2. Handle Dribble Tackle Checks
      // If carrier dribbles adjacent to defenders, defenders roll Savunma (defending) vs carrier's Teknik (technical)
      Object.entries(finalPlanned).forEach(([playerId, action]) => {
        if (action.type === 'DRIBBLE') {
          const carrier = updatedPlaced.find(p => p.player.id === playerId);
          if (!carrier) return;

          // Is there any adjacent defender?
          const oppos = updatedPlaced.filter(p => p.team !== carrier.team);
          const adjacentDefender = oppos.find(op => getDistance(op.position, action.targetPos) <= 1 && !op.isGK);

          if (adjacentDefender) {
            const dRoll = Math.floor(Math.random() * 20) + 1;
            const cRoll = Math.floor(Math.random() * 20) + 1;

            const dVal = adjacentDefender.player.stats.savunma + dRoll;
            const cVal = carrier.player.stats.teknik + cRoll;

            reports.push({
              description: `💥 Çalım & Müdahale! [${carrier.player.name}] top sürerken [${adjacentDefender.player.name}] araya girmeye çalışıyor.`,
              rolls: [
                { name: carrier.player.name, roll: cRoll, stat: carrier.player.stats.teknik, total: cVal, team: carrier.team },
                { name: adjacentDefender.player.name, roll: dRoll, stat: adjacentDefender.player.stats.savunma, total: dVal, team: adjacentDefender.team }
              ]
            });

            if (dVal > cVal) {
              // Tackle succeeds, ball is stolen!
              updatedBallCarrier = { team: adjacentDefender.team, playerId: adjacentDefender.player.id };
              updatedBallPosition = adjacentDefender.position;
            }
          }
        }
      });

      // 3. Loose Ball pick ups
      // If ball is loose and someone has stepped to its cell, they gain carrier status
      if (!updatedBallCarrier) {
        const guysOnBall = updatedPlaced.filter(p => p.position.x === updatedBallPosition.x && p.position.y === updatedBallPosition.y);
        if (guysOnBall.length === 1) {
          updatedBallCarrier = { team: guysOnBall[0].team, playerId: guysOnBall[0].player.id };
        } else if (guysOnBall.length > 1) {
          // Speed showdown to grab loose ball!
          const r1 = Math.floor(Math.random() * 20) + 1;
          const r2 = Math.floor(Math.random() * 20) + 1;
          const c1 = guysOnBall[0];
          const c2 = guysOnBall[1];

          const v1 = c1.player.stats.hiz + r1;
          const v2 = c2.player.stats.hiz + r2;
          const ballWinner = v1 >= v2 ? c1 : c2;

          reports.push({
            description: `⚽ Sahipsiz Top Mücadelesi! Her iki oyuncu da topu kapmaya koştu.`,
            rolls: [
              { name: c1.player.name, roll: r1, stat: c1.player.stats.hiz, total: v1, team: c1.team },
              { name: c2.player.name, roll: r2, stat: c2.player.stats.hiz, total: v2, team: c2.team }
            ]
          });

          updatedBallCarrier = { team: ballWinner.team, playerId: ballWinner.player.id };
          updatedBallPosition = ballWinner.position;
        }
      }

      // 4. Handle PASS resolutions
      Object.entries(finalPlanned).forEach(([playerId, action]) => {
        if (action.type === 'PASS') {
          const passer = updatedPlaced.find(p => p.player.id === playerId);
          const receiver = updatedPlaced.find(p => p.player.id === action.targetPlayerId);

          if (!passer || !receiver) return;

          // Mesafe hesaplama ve uzaklık cezası uygulaması (Tüm sahaya pas atılabilsin, mesafe arttıkça isabet azalsın)
          const dist = getDistance(passer.position, receiver.position);
          const maxFreeDistance = 5;
          const distancePenalty = dist > maxFreeDistance ? Math.floor((dist - maxFreeDistance) * 1.5) : 0;

          // Rakip savunmacıları filtrele
          const opposDefenders = updatedPlaced.filter(p => p.team !== passer.team && !p.isGK);

          // 1. Pas koridorundaki rakipleri bulma (aradaki rakipler)
          const corridorOpponents = opposDefenders.filter(op => {
            const p = op.position;
            // Passer veya receiver'ın kendi hücresini sayma
            if ((p.x === passer.position.x && p.y === passer.position.y) || 
                (p.x === receiver.position.x && p.y === receiver.position.y)) return false;
            
            const vX = receiver.position.x - passer.position.x;
            const vY = receiver.position.y - passer.position.y;
            const lenSq = vX * vX + vY * vY;
            if (lenSq === 0) return false;
            
            const wX = p.x - passer.position.x;
            const wY = p.y - passer.position.y;
            
            // Projeksiyonu doğrula
            const dot = wX * vX + wY * vY;
            if (dot < 0 || dot > lenSq) return false;
            
            const t = dot / lenSq;
            const projX = passer.position.x + t * vX;
            const projY = passer.position.y + t * vY;
            
            const distanceToLine = Math.sqrt((p.x - projX) ** 2 + (p.y - projY) ** 2);
            // 1.8 birimden daha yakınsa bu oyuncu pas koridorundadır
            return distanceToLine < 1.8;
          });

          // Aradaki her rakip için pas isabeti gücüne ek -3 ceza uygulanır (Zorlaştırılmış kurallar)
          const corridorPenalty = corridorOpponents.length * 3;

          // 2. Alıcının dibindeki rakip (doğrudan markaj)
          const receiverMark = opposDefenders.find(op => getDistance(op.position, receiver.position) <= 1);

          // Mücadeleye girecek olan savunmacıyı seç (Alıcı markajı önceliklidir, yoksa aradaki en iyi koridor savunmacısı)
          let interceptor = receiverMark;
          let interceptType: 'mark' | 'corridor' | null = null;

          if (receiverMark) {
            interceptType = 'mark';
          } else if (corridorOpponents.length > 0) {
            interceptor = corridorOpponents.reduce((best, curr) => 
              curr.player.stats.savunma > best.player.stats.savunma ? curr : best, 
              corridorOpponents[0]
            );
            interceptType = 'corridor';
          }

          const passRoll = Math.floor(Math.random() * 20) + 1;
          const passVal = Math.max(1, passer.player.stats.pas + passRoll - distancePenalty - corridorPenalty);

          if (interceptor) {
            const intRoll = Math.floor(Math.random() * 20) + 1;
            const intVal = interceptor.player.stats.savunma + intRoll;

            let battleDescription = "";
            if (interceptType === 'mark') {
              battleDescription = `🔄 Pas Mücadelesi! [${passer.player.name}] pas atarken, alıcının dibindeki [${interceptor.player.name}] markaja giriyor. (Uzaklık: ${dist} kare, Uzaklık Cezası: -${distancePenalty}, Koridor Engelleri: -${corridorPenalty} [${corridorOpponents.length} rakip arada], Net Pas Gücü: ${passVal})`;
            } else {
              battleDescription = `🚧 Pas Arası Denemesi! [${passer.player.name}] pas atarken, pas koridorunu kapatan [${interceptor.player.name}] araya girdi! (Uzaklık: ${dist} kare, Uzaklık Cezası: -${distancePenalty}, Koridor Engelleri: -${corridorPenalty} [${corridorOpponents.length} rakip arada], Net Pas Gücü: ${passVal})`;
            }

            reports.push({
              description: battleDescription,
              rolls: [
                { name: passer.player.name, roll: passRoll, stat: passer.player.stats.pas, total: passVal, team: passer.team },
                { name: interceptor.player.name, roll: intRoll, stat: interceptor.player.stats.savunma, total: intVal, team: interceptor.team }
              ]
            });

            if (intVal > passVal) {
              // Intercepted!
              updatedBallCarrier = { team: interceptor.team, playerId: interceptor.player.id };
              updatedBallPosition = interceptor.position;
            } else {
              // Clear, goes to teammate
              updatedBallCarrier = { team: receiver.team, playerId: receiver.player.id };
              updatedBallPosition = receiver.position;
            }
          } else {
            // Uncontested pass can fail if distance penalty makes it extremely inaccurate (passVal < 10)
            if (passVal < 10) {
              // Inaccurate long pass! Ball becomes loose at receiver position
              updatedBallCarrier = null;
              updatedBallPosition = receiver.position;
              reports.push({
                description: `⚠️ İsabetsiz Pas! [${passer.player.name}] tarafından atılan pas çok uzaktı veya yetersiz güçteydi, top kontrol edilemedi ve sahipsiz kaldı! (Uzaklık: ${dist} kare, Uzaklık Cezası: -${distancePenalty}, Net Pas Gücü: ${passVal} < 10)`,
                rolls: [
                  { name: passer.player.name, roll: passRoll, stat: passer.player.stats.pas, total: passVal, team: passer.team }
                ]
              });
            } else {
              // Successful uncontested pass
              updatedBallCarrier = { team: receiver.team, playerId: receiver.player.id };
              updatedBallPosition = receiver.position;
              reports.push({
                description: `🎯 Temiz Pas! [${passer.player.name}] isabetli pasıyla topu [${receiver.player.name}] ile buluşturdu. (Uzaklık: ${dist} kare, Uzaklık Cezası: -${distancePenalty}, Net Pas Gücü: ${passVal})`,
                rolls: [
                  { name: passer.player.name, roll: passRoll, stat: passer.player.stats.pas, total: passVal, team: passer.team }
                ]
              });
            }
          }
        }
      });

      // 5. Handle SHOOT resolutions
      Object.entries(finalPlanned).forEach(([playerId, action]) => {
        if (action.type === 'SHOOT') {
          const shooter = updatedPlaced.find(p => p.player.id === playerId);
          if (!shooter) return;

          // Target goalpost Keeper
          const opposingTeam: TeamColor = shooter.team === 'Siyah' ? 'Beyaz' : 'Siyah';
          const goalkeeper = updatedPlaced.find(p => p.team === opposingTeam && p.isGK);

          const targetGoalPos = shooter.team === 'Siyah' ? { x: 20, y: 6 } : { x: 0, y: 6 };
          const distToGoal = getDistance(shooter.position, targetGoalPos);
          
          const shootRoll = Math.floor(Math.random() * 20) + 1;
          const baseShootVal = shooter.player.stats.sut + shootRoll;
          const maxFreeDistance = 5;
          const distancePenalty = distToGoal > maxFreeDistance ? Math.floor((distToGoal - maxFreeDistance) * 1.5) : 0;
          const shootVal = Math.max(1, baseShootVal - distancePenalty);

          if (goalkeeper) {
            const gkRoll = Math.floor(Math.random() * 20) + 1;
            const gkVal = goalkeeper.player.stats.savunma + gkRoll;

            reports.push({
              description: `⚡ ŞUT ÇEKİLDİ! [${shooter.player.name}] kaleyi gördü vurdu! (Uzaklık: ${distToGoal} kare, Uzaklık Cezası: -${distancePenalty}, Net Şut Gücü: ${shootVal})`,
              rolls: [
                { name: shooter.player.name, roll: shootRoll, stat: shooter.player.stats.sut, total: shootVal, team: shooter.team },
                { name: goalkeeper.player.name, roll: gkRoll, stat: goalkeeper.player.stats.savunma, total: gkVal, team: goalkeeper.team }
              ]
            });

            if (shootVal > gkVal) {
              // GOL!
              goalScored = shooter.team;
              scorerObj = shooter;
              newScore[shooter.team] += 1;
            } else {
              // GK Saves!
              updatedBallCarrier = { team: opposingTeam, playerId: goalkeeper.player.id };
              updatedBallPosition = goalkeeper.position;
              reports.push({
                description: `🧤 İNANILMAZ KURTARIŞ! [${goalkeeper.player.name}] parmaklarının ucuyla golü önledi.`,
                rolls: []
              });
            }
          } else {
            // Empty goalpost shooting triggers goal
            goalScored = shooter.team;
            scorerObj = shooter;
            newScore[shooter.team] += 1;
          }
        }
      });

      // Store pending outcomes to be confirmed by user on screen
      setPendingResolution({
        placedPlayers: updatedPlaced,
        ballCarrier: updatedBallCarrier,
        ballPosition: updatedBallPosition,
        score: newScore,
        goalScored,
        scorerObj,
        reports,
        nextTurn: matchTurn + 1
      });
      setIsResolutionRolling(false);
    }, 1800);
  };

  // Restarts play from center after a Goal
  const handleKickoffAfterGoal = () => {
    setShowGoalCelebration(false);
    
    // Conceding team gets kick-off
    const concedingTeam: TeamColor = lastScorer?.team === 'Siyah' ? 'Beyaz' : 'Siyah';
    
    // Gol sonrası futbolcuları ilk dizilişlerine göre tekrar dizeceğiz (veya varolan oyuncular)
    const baseLineup = initialPlacedPlayers.length > 0 ? initialPlacedPlayers : placedPlayers;

    // Alıcı takımdaki santracıyı seç
    let taker = baseLineup.find(p => p.team === concedingTeam && p.player.positionGroup === 'FW');
    if (!taker) {
      taker = baseLineup.find(p => p.team === concedingTeam && p.player.positionGroup === 'MF');
    }
    if (!taker) {
      taker = baseLineup.find(p => p.team === concedingTeam && !p.isGK);
    }

    const santraPos = { x: 10, y: 6 };
    let finalPlacedList = baseLineup;
    let finalBallCarrier = null as { team: TeamColor; playerId: string } | null;

    if (taker) {
      // Find who is occupying the santra spot (10, 6) in the starting lineup to swap positions with the taker
      const occupant = baseLineup.find(p => p.position.x === santraPos.x && p.position.y === santraPos.y);

      finalPlacedList = baseLineup.map(p => {
        if (p.player.id === taker.player.id) {
          return { ...p, position: santraPos };
        }
        if (occupant && p.player.id === occupant.player.id) {
          return { ...p, position: taker.position };
        }
        return p;
      });

      finalBallCarrier = { team: concedingTeam, playerId: taker.player.id };
      setPlacedPlayers(finalPlacedList);
      setBallPosition(santraPos);
      setBallCarrier(finalBallCarrier);
      addLog(`Santra Atışı: Gol sonrası tüm oyuncular ilk dizilişlerine (başlangıç taktiklerine) geri döndü! Yeniden başlama santra noktasından yapılıyor. ${concedingTeam === 'Siyah' ? 'Siyah' : 'Beyaz'} Takım oyuncusu [${taker.player.name}] topu (10, 6) hücresinden oyuna sokuyor.`, "success", undefined, undefined, true);
    } else {
      setPlacedPlayers(baseLineup);
      setBallPosition(santraPos);
      setBallCarrier(null);
      addLog("Gol sonrası tüm oyuncular ilk dizilişlerine döndü. Santra Atışı yapıldı, top sahipsiz ortada.", "info", undefined, undefined, true);
    }

    setPhase('TACTICS_BLACK');
    setActiveTeam('Siyah');
    setMatchTurn(prev => prev + 1);
    setLastScorer(null);

    if (isOnlineMode && isHost) {
      syncOnlineState({
        placedPlayers: finalPlacedList,
        ballPosition: santraPos,
        ballCarrier: finalBallCarrier,
        phase: 'TACTICS_BLACK',
        activeTeam: 'Siyah',
        matchTurn: matchTurn + 1,
        logs: [
          { id: Math.random().toString(36).substring(2, 9), turn: matchTurn, phase: 'TACTICS_BLACK', text: `Yeni Başlama Santrası Yapıldı.`, type: 'success' },
          ...logs
        ]
      });
    }
  };

  // Applies physical outcome calculations to live pitch state after user clicks confirmation
  const applyPendingResolution = () => {
    if (!pendingResolution) return;

    if (isOnlineMode) {
      if (isHost) {
        // Host writes the accepted pitch updates directly to Firestore
        const nextPhase = pendingResolution.goalScored ? 'GOAL_CELEBRATION' : 'TACTICS_BLACK';
        
        const finalLogs = [
          ...pendingResolution.reports.map(rep => ({
            id: Math.random().toString(36).substring(2, 9),
            turn: matchTurn,
            phase: phase.toString(),
            text: rep.description,
            type: rep.description.includes('GOL!') ? ('goal' as const) : ('dice' as const)
          })),
          ...logs
        ];

        syncOnlineState({
          placedPlayers: pendingResolution.placedPlayers,
          ballCarrier: pendingResolution.ballCarrier,
          ballPosition: pendingResolution.ballPosition,
          score: pendingResolution.score,
          phase: nextPhase,
          activeTeam: 'Siyah',
          matchTurn: pendingResolution.nextTurn,
          submittedSiyah: false,
          submittedBeyaz: false,
          plannedActions: {},
          lastDiceResults: pendingResolution.reports,
          logs: finalLogs
        });
      }
      
      // Guest and Host both update local states for animation purposes
      setPlacedPlayers(pendingResolution.placedPlayers);
      setBallCarrier(pendingResolution.ballCarrier);
      setBallPosition(pendingResolution.ballPosition);
      setScore(pendingResolution.score);
      setSimulationDiceReports(pendingResolution.reports);
      
      if (pendingResolution.goalScored && pendingResolution.scorerObj) {
        setPhase('GOAL_CELEBRATION');
        setLastScorer(pendingResolution.scorerObj);
        setShowGoalCelebration(true);
      } else {
        setPhase('TACTICS_BLACK');
        setActiveTeam('Siyah');
        setMatchTurn(pendingResolution.nextTurn);
      }
      setPlannedActions({});
      setPendingResolution(null);
      setShowResolutionModal(false);
      return;
    }

    setPlacedPlayers(pendingResolution.placedPlayers);
    setBallCarrier(pendingResolution.ballCarrier);
    setBallPosition(pendingResolution.ballPosition);
    setScore(pendingResolution.score);
    
    // Save reports for permanent reference list
    setSimulationDiceReports(pendingResolution.reports);

    // Write all battle outcome statements directly in permanent logs ticker
    pendingResolution.reports.forEach(rep => {
      addLog(rep.description, "dice", undefined, undefined, true);
    });

    if (pendingResolution.goalScored && pendingResolution.scorerObj) {
      setPhase('GOAL_CELEBRATION');
      setLastScorer(pendingResolution.scorerObj);
      setShowGoalCelebration(true);
      addLog(`⚽ 🚀 GOL! GOL! GOL! [${pendingResolution.scorerObj.player.name}] muhteşem vuruşuyla ağları havalandırıyor!`, "goal", undefined, undefined, true);
    } else {
      setPhase('TACTICS_BLACK');
      setActiveTeam('Siyah');
      setMatchTurn(pendingResolution.nextTurn);
      addLog(`Aksiyonlar çözüldü. Tur ${pendingResolution.nextTurn} Başlıyor. Taktik ${teamATheme.name} takımında!`, "info", undefined, undefined, true);
    }

    setPlannedActions({});
    setPendingResolution(null);
    setShowResolutionModal(false);
  };

  // End active match and save statistics to Firestore
  const endActiveMatch = async () => {
    // Determine user team and opponent team
    const userTeam: TeamColor = isOnlineMode && myOnlineTeam ? myOnlineTeam : 'Siyah';
    const opponentTeam: TeamColor = userTeam === 'Siyah' ? 'Beyaz' : 'Siyah';
    
    const goalsScored = score[userTeam];
    const goalsConceded = score[opponentTeam];
    
    let outcome: 'win' | 'draw' | 'loss' = 'draw';
    if (goalsScored > goalsConceded) outcome = 'win';
    else if (goalsScored < goalsConceded) outcome = 'loss';
    
    let statsMsg = "";
    if (currentUser) {
      try {
        addLog(`Maç Sonlandırılıyor... İstatistikler kaydediliyor.`, "info", undefined, undefined, true);
        const updatedStats = await updateUserStatsAfterMatch(
          currentUser.uid,
          goalsScored,
          goalsConceded,
          outcome
        );
        setUserStats(updatedStats);
        statsMsg = "İstatistikleriniz başarıyla profilinize kaydedildi! 🏆";
      } catch (err: any) {
        console.error("Stats save error:", err);
        statsMsg = "İstatistikler kaydedilirken bir hata oluştu.";
      }
    } else {
      statsMsg = "Giriş yapmadığınız için istatistikler kaydedilmedi. Profil sekmesinden giriş yapabilirsiniz.";
    }

    setPhase('MATCH_OVER');
    addLog(`Maç Sona Erdi! Skor: ${score.Siyah} - ${score.Beyaz}. ${statsMsg}`, "success", undefined, undefined, true);
  };

  // Reset or Match restart triggers
  const executeMatchReset = () => {
    // Reset themes back to their clean template versions
    const cleanA = TEAMS.find(t => t.id === teamATheme.id) || TEAMS[0];
    const cleanB = TEAMS.find(t => t.id === teamBTheme.id) || TEAMS[2];
    setTeamATheme(cleanA);
    setTeamBTheme(cleanB);

    setHasStartedMatch(false);
    setPlacedPlayers([]);
    setInitialPlacedPlayers([]);
    setBallPosition({ x: 10, y: 6 });
    setBallCarrier(null);
    setScore({ Siyah: 0, Beyaz: 0 });
    setMatchTurn(1);
    setInitiativeRolls(null);
    setInitiativeWinner(null);
    setPlannedActions({});
    setDraftBlackIds([]);
    setDraftWhiteIds([]);
    setLogs([]);
    setSimulationDiceReports([]);
    setLastScorer(null);
    setSelectedPlacedPlayerId(null);
    addLog("Oyun sıfırlandı! Yeni kadrolar seçilebilir.", "info");
  };

  return (
    <div id="kafadan-taktik-root" className="min-h-screen bg-[var(--color-board-cream)] font-sans text-[var(--color-board-dark)] flex flex-col selection:bg-[var(--color-board-coral)] selection:text-white select-none">
      
      {/* 1. Header Navigation HUD - Tabletop Board Game Style */}
      <header id="HUD-header" className="h-16 bg-[var(--color-board-dark)] border-b-4 border-[var(--color-board-coral)] flex items-center justify-between px-4 md:px-6 shrink-0 sticky top-0 z-40 text-[var(--color-board-cream)] shadow-md">
        <div className="flex items-center gap-3">
          {/* Custom vector logo rendered nicely in header! */}
          <div className="bg-white p-0.5 rounded-lg border-2 border-[var(--color-board-dark)] shadow-sm">
            <KafadanTaktikLogo size="34px" />
          </div>
          
          <h1 className="text-lg md:text-xl font-extrabold font-display tracking-tight text-[var(--color-board-cream)] flex items-center gap-2">
            <span>Kafadan Taktik</span>
            <span className="text-[9px] font-mono not-italic bg-[var(--color-board-coral)] text-white px-2 py-0.5 rounded-full">
              Masaüstü
            </span>
          </h1>
        </div>

        {/* Live Scoreboard */}
        {hasStartedMatch ? (
          <div id="score-board-hud" className="flex items-center gap-10">
            <div className="flex items-center gap-3 font-mono text-sm bg-black/40 px-4 py-1.5 rounded-full border border-slate-700">
              <span className="font-bold flex items-center gap-1.5" style={{ color: teamATheme.secondaryBg }}>
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: teamATheme.primaryBg, border: `1px solid ${teamATheme.secondaryBg}` }}></span>
                {teamATheme.name.toUpperCase()} {score.Siyah}
              </span>
              <span className="text-slate-400 text-xs px-1">VS</span>
              <span className="font-bold flex items-center gap-1.5" style={{ color: teamBTheme.secondaryBg }}>
                {teamBTheme.name.toUpperCase()} {score.Beyaz}
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: teamBTheme.primaryBg, border: `1px solid ${teamBTheme.secondaryBg}` }}></span>
              </span>
            </div>
            <div className="text-xs font-bold font-display text-[var(--color-board-mustard)] uppercase tracking-widest leading-none hidden sm:block">
              {phase === 'PLACEMENT' ? 'Yerleştirme Aşaması' : 'Maç Taktik Aşaması'}
            </div>
          </div>
        ) : (
          <div className="text-xs font-bold font-mono text-[var(--color-board-cream)]/80 uppercase tracking-widest hidden md:block">
            Saha Taktik ve Kadro Kurulumu
          </div>
        )}

        <div className="flex items-center gap-2.5">
          {hasStartedMatch && (
            <div className="flex items-center gap-1.5 text-xs bg-[var(--color-board-coral)] border border-black/30 px-3 py-1.5 rounded-lg font-black text-white shadow-sm">
              <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
              TUR: {matchTurn < 10 ? `0${matchTurn}` : matchTurn}
            </div>
          )}

          <button
            id="profile-toggle-btn"
            onClick={() => setIsProfileOpen(true)}
            className="text-xs uppercase bg-emerald-600 hover:bg-emerald-500 text-white transition-all px-3 py-1.5 rounded-lg font-extrabold cursor-pointer hover:scale-102 hover:shadow-sm flex items-center gap-1.5 active:scale-95"
          >
            <Trophy className="w-3.5 h-3.5 text-yellow-300 animate-bounce" />
            <span>Profil & İstatistikler</span>
          </button>

          <button
            id="rules-toggle-btn"
            onClick={() => setIsRulesOpen(true)}
            className="text-xs uppercase bg-[#FAF7EE] text-[#0C251C] border-2 border-transparent hover:border-[#E75A51] transition-all px-3 py-1.5 rounded-lg font-extrabold cursor-pointer hover:scale-102 hover:shadow-sm"
          >
            Kurallar & KVKK
          </button>

          {hasStartedMatch && phase !== 'MATCH_OVER' && (
            <button
              id="end-match-btn"
              onClick={endActiveMatch}
              className="text-xs uppercase bg-amber-500 hover:bg-amber-400 border-2 border-transparent active:scale-95 px-3 py-1.5 rounded-lg font-extrabold text-slate-900 transition-all cursor-pointer shadow-md"
            >
              Maçı Bitir
            </button>
          )}

          {hasStartedMatch && (
            <button
              id="reset-match-btn"
              onClick={executeMatchReset}
              className="text-xs uppercase bg-rose-600 hover:bg-rose-500 border-2 border-transparent active:scale-95 px-3 py-1.5 rounded-lg font-extrabold text-white transition-all cursor-pointer shadow-md"
            >
              Sıfırla
            </button>
          )}
        </div>
      </header>

      {/* 2. Main Body App Grid */}
      <main id="app-workspace" className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 flex flex-col gap-6">

        {!hasStartedMatch ? (
          /* SQUAD RETAILING PICKER SCREEN */
          <SquadSelection
            blackSquad={blackSquad}
            whiteSquad={whiteSquad}
            isVsAI={isVsAI}
            isOnlineMode={isOnlineMode}
            onSelectMode={handleSelectMode}
            onConfirmStartingSquads={handleConfirmStartingSquads}
            teamATheme={teamATheme}
            teamBTheme={teamBTheme}
            onChangeTeamATheme={setTeamATheme}
            onChangeTeamBTheme={setTeamBTheme}
            onMatchConnected={handleMatchConnected}
          />
        ) : phase === 'SQUAD_DRAFT' ? (
          /* SQUAD DRAFT SELECTION STAGE */
          <SquadDraftScreen
            isVsAI={isVsAI}
            isOnlineMode={isOnlineMode}
            myOnlineTeam={myOnlineTeam}
            currentDrafter={activeTeam as 'Siyah' | 'Beyaz'}
            onChangeDrafter={handleDraftDrafterChange}
            blackSquad={blackSquad}
            whiteSquad={whiteSquad}
            teamATheme={teamATheme}
            teamBTheme={teamBTheme}
            draftBlackIds={draftBlackIds}
            draftWhiteIds={draftWhiteIds}
            setDraftBlackIds={handleSetDraftBlackIds}
            setDraftWhiteIds={handleSetDraftWhiteIds}
            onConfirmDraft={handleConfirmDraftPicks}
          />
        ) : (
          /* MAIN ACTIVE FOOTBALL INTERACTION */
          <div id="gameplay-arena" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* L1: Board View and HUD (9 cols) */}
            <div id="field-column" className="lg:col-span-9 flex flex-col gap-6">
              
              {/* Dynamic instruction status alert */}
              <div 
                id="tactical-guideline" 
                className={`
                  p-4 rounded border transition-all flex items-center justify-between gap-4 flex-wrap
                  ${phase === 'PLACEMENT' 
                    ? 'bg-[#0f172a] border-sky-600/50 text-sky-100' 
                    : 'bg-[#0f172a] border-slate-700 text-slate-100 font-display'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <span className="p-2 bg-[#020617] rounded block border border-slate-700">
                    {phase === 'PLACEMENT' ? '🛠️' : '⚽'}
                  </span>
                  <div>
                    <h3 className="font-bold text-white text-xs uppercase tracking-wider font-display">
                      {phase === 'PLACEMENT' ? `KADRO YERLEŞTİRME AŞAMASI` : `MAÇ TAKTİK PLANLAMA AŞAMASI`}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 animate-fade-in">
                      {phase === 'PLACEMENT' 
                        ? `${req.description} (Lütfen haritanın kendi yarı sahanızdaki uygun bir hücresine tıklayın)` 
                        : `${activeTeam === 'Siyah' ? teamATheme.name : teamBTheme.name} takımının her bir futbolcusunu tıklayarak komşu koğu hücresine yönlendirebilirsiniz.`
                      }
                    </p>
                  </div>
                </div>

                {/* Sub status details or button trigger */}
                {phase === 'TACTICS_BLACK' && (
                  <button
                    id="finish-black-tastic-btn"
                    onClick={handleEndTacticTurn}
                    className="bg-sky-600 hover:bg-sky-500 font-bold text-xs uppercase tracking-widest text-white px-5 py-2 rounded transition-all active:scale-95 cursor-pointer shadow-lg flex items-center gap-1.5"
                  >
                    <span>Talimatları Bitir & Zarı At</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}

                {phase === 'TACTICS_WHITE' && !isVsAI && (
                  <button
                    id="finish-white-tastic-btn"
                    onClick={handleEndTacticTurn}
                    className="bg-sky-600 hover:bg-sky-500 font-bold text-xs uppercase tracking-widest text-white px-5 py-2 rounded transition-all active:scale-95 cursor-pointer shadow-lg flex items-center gap-1.5"
                  >
                    <span>Beyaz Hamleleri Tamamla</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}

                {phase === 'INITIATIVE' && (
                  <button
                    id="roll-initiative-btn"
                    onClick={executeInitiativeRoll}
                    className="bg-sky-605 bg-sky-600 hover:bg-sky-500 font-bold text-xs uppercase tracking-widest text-white px-5 py-2 rounded transition-all active:scale-95 cursor-pointer shadow-lg flex items-center gap-1.5"
                  >
                    <Dice5 className="w-4 h-4" />
                    <span>Kur'a Zarlarını Fırlat</span>
                  </button>
                )}
              </div>

              {/* Pitch Renderer Section */}
              <Pitch
                placedPlayers={placedPlayers}
                ballPosition={ballPosition}
                ballCarrier={ballCarrier}
                phase={phase}
                activeTeam={activeTeam}
                onCellClick={handleCellClick}
                selectedPlayer={selectedPlayer}
                plannedActions={plannedActions}
                teamATheme={teamATheme}
                teamBTheme={teamBTheme}
                onPlanPassAction={planPassAction}
                onPlanShootAction={planShootAction}
                onClearPlayerAction={clearPlayerAction}
                isPassingModeActive={isPassingModeActive}
                onTogglePassingMode={() => setIsPassingModeActive(prev => !prev)}
                selectedPlacedPlayerId={selectedPlacedPlayerId}
              />

              {/* Action Controls Panel */}
               {selectedPlayer && (() => {
                 const isCarrier = ballCarrier?.playerId === selectedPlayer.player.id;
                 const plannedAct = plannedActions[selectedPlayer.player.id];
                 
                 return (
                   <div id="action-controller-bar" className="bg-[#0f172a] border border-slate-700 p-4 rounded grid grid-cols-1 md:grid-cols-12 gap-5 items-center animate-fade-in font-display">
                     {/* Col 1: Player info (jersey + name) */}
                     <div className="md:col-span-3 flex items-center gap-3">
                       <div className="bg-[#020617] text-sky-400 w-10 h-10 rounded border border-slate-700 flex items-center justify-center font-bold font-mono shrink-0">
                         #{selectedPlayer.player.number}
                       </div>
                       <div className="truncate">
                         <h4 className="text-white text-xs uppercase tracking-wider font-bold truncate">{selectedPlayer.player.name}</h4>
                         <p className="text-[10px] text-slate-400 font-mono leading-none mt-1">{selectedPlayer.player.role}</p>
                       </div>
                     </div>

                     {/* Col 2: Interactive planning choices */}
                     <div className="md:col-span-7">
                       {plannedAct ? (
                         <div className="flex items-center justify-between bg-black/40 py-2.5 px-4 rounded border border-slate-700">
                           <div className="text-xs">
                             <span className="text-slate-400">Planlanan Hamle:</span>{' '}
                             <strong className="text-sky-400 uppercase font-mono tracking-wider ml-1">
                               {plannedAct.type === 'MOVE' ? '🏃 KOŞU YOLU' : ''}
                               {plannedAct.type === 'PASS' ? '🎯 PAS TALİMATI' : ''}
                               {plannedAct.type === 'SHOOT' ? '💥 KALEYE ŞUT' : ''}
                               {plannedAct.type === 'DRIBBLE' ? '⚡ TOP SÜRME' : ''}
                             </strong>
                           </div>
                           <button
                             id="cancel-planned-action"
                             onClick={() => clearPlayerAction(selectedPlayer.player.id)}
                             className="text-xs text-red-400 hover:text-red-300 font-bold active:scale-95 cursor-pointer"
                           >
                             İptal Et
                           </button>
                         </div>
                       ) : (
                         <div className="w-full">
                           {isCarrier ? (
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                               {/* Shoot Section */}
                               <div className="flex flex-col gap-1.5">
                                 <span className="text-[10px] uppercase font-bold tracking-wider text-rose-400">⚽ Şut Çekme</span>
                                 {canPlayerShoot(selectedPlayer) ? (
                                   <button
                                     onClick={() => planShootAction(selectedPlayer)}
                                     className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] uppercase py-2 px-3 rounded shadow-md cursor-pointer transition-all active:scale-95 animate-pulse"
                                   >
                                     💥 Kaleye ŞUT ÇEK!
                                   </button>
                                 ) : (
                                   <div className="text-[9px] text-slate-400 bg-slate-950 p-2 rounded border border-slate-800/80 leading-normal">
                                     🔒 Şut çekebilmek için rakip sahanın son 3'ünde olmalısınız ({teamATheme.name}: x ≥ 13, {teamBTheme.name}: x ≤ 7).
                                   </div>
                                 )}
                               </div>

                               {/* Pass Section */}
                               <div className="flex flex-col gap-1.5 font-sans">
                                 <span className="text-[10px] uppercase font-bold tracking-wider text-sky-400">🎯 Pas Verme</span>
                                 {(() => {
                                   const teammates = getEligiblePassTeammates(selectedPlayer);
                                   if (teammates.length > 0) {
                                     return (
                                       <div className="flex flex-col gap-1 w-full">
                                         <button
                                           onClick={() => setIsPassingModeActive(prev => !prev)}
                                           className={`w-full py-2 px-3 rounded font-bold text-[10px] uppercase transition-all select-none cursor-pointer flex items-center justify-center gap-1.5 border
                                             ${isPassingModeActive 
                                               ? 'bg-sky-600 text-white animate-pulse border-sky-400 shadow-md' 
                                               : 'bg-sky-950 hover:bg-sky-900 border-sky-850 text-sky-300'
                                             }
                                           `}
                                         >
                                           <span>🎯</span>
                                           {isPassingModeActive ? 'SAHADAN ARKADAŞINA TIKLA!' : 'PAS VER!'}
                                         </button>
                                         <span className="text-[8px] text-slate-400 text-center select-none font-sans">
                                           {isPassingModeActive 
                                             ? 'Mavi parıltılı "PAS AL!" etiketli bir arkadaşınıza sahada tıklayın.' 
                                             : 'Butona bastıktan sonra sahada pas alacak arkadaşınızı seçin.'}
                                         </span>
                                       </div>
                                     );
                                   } else {
                                     return (
                                       <div className="text-[9px] text-slate-400 bg-slate-950 p-2 rounded border border-slate-800/80 leading-normal">
                                         ⚠️ Sahada pas atacak takım arkadaşınız bulunmuyor!
                                       </div>
                                     );
                                   }
                                 })()}
                               </div>
                             </div>
                           ) : (
                             <div className="text-xs text-slate-400 bg-slate-950/40 p-2.5 border border-slate-850 rounded leading-relaxed">
                               🏃 <strong className="text-sky-400">Koşu Yolu Planlama:</strong> Sahada parıldayan boş komşu hücrelerden birine tıklayarak oyuncunun yönünü belirleyin. Hızlı oyuncular tek turda 2 komşu kare gidebilir!
                             </div>
                           )}
                         </div>
                       )}
                     </div>

                     {/* Col 3: Actions Close */}
                     <div className="md:col-span-2 flex justify-end">
                       <button
                         id="deselect-player"
                         onClick={() => setSelectedPlayer(null)}
                         className="text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-4 py-1.5 rounded border border-slate-700 transition-colors cursor-pointer"
                       >
                         Seçimi Kaldır
                       </button>
                     </div>
                   </div>
                 );
               })()}

              {/* Dice Throw Arena Simulation View */}
              {simulationDiceReports.length > 0 && (
                <div id="dice-throw-dock" className="bg-[#0f172a] border border-slate-700 rounded p-5 flex flex-col gap-4 font-display">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-slate-800 pb-2.5 flex items-center gap-2">
                    <Dice5 className="w-5 h-5 text-sky-400 animate-spin" />
                    Zar Çarpışma Sonuçları (Tur Aksiyonları)
                  </h3>
                  <div id="dice-reports-list" className="grid grid-cols-1 md:grid-cols-2 text-slate-200 lg:grid-cols-3 gap-4">
                    {simulationDiceReports.map((rep, idx) => {
                      return (
                        <div key={`rep-${idx}`} className="bg-[#020617]/70 p-3.5 border border-slate-800/80 rounded flex flex-col gap-3">
                          <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider leading-tight block">
                            {rep.description}
                          </span>
                          <div className="flex gap-2 justify-center">
                            {rep.rolls.map((rl, rIdx) => {
                              const rollVal = rl.roll;
                              let statusColors = "bg-rose-950/20 border-rose-500/30 text-rose-300";
                              if (rollVal >= 14) {
                                statusColors = "bg-emerald-950/25 border-emerald-500/40 text-emerald-300";
                              } else if (rollVal >= 7) {
                                statusColors = "bg-amber-950/25 border-amber-500/40 text-amber-305 text-amber-300";
                              }
                              
                              return (
                                <div 
                                  key={`rl-${rIdx}`} 
                                  className={`p-2 rounded border text-center flex-1 max-w-[120px] transition-colors ${statusColors}`}
                                >
                                  <div className="text-[9px] font-bold uppercase truncate opacity-80 font-mono">{rl.name}</div>
                                  <div className="text-base font-black font-mono my-0.5">{rl.roll + rl.stat}</div>
                                  <div className="text-[8px] font-mono opacity-70">
                                    {rl.stat} + {rl.roll} Zar
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>

            {/* L2: Sidebar Roster Details and Actions Logs (3 cols) */}
            <div id="monitoring-column" className="lg:col-span-3 flex flex-col gap-6 font-display">
              
              {/* Placement List panel for planning tracking */}
              {phase === 'PLACEMENT' && (() => {
                const currentPlacingTeam = req.team;
                const placingTheme = currentPlacingTeam === 'Siyah' ? teamATheme : teamBTheme;
                const isAiPlacing = isVsAI && currentPlacingTeam === 'Beyaz';
                const unplaced = getUnplacedPlayersForTeam(currentPlacingTeam);

                return (
                  <div id="placement-tracker-card" className="bg-[#0f172a] border border-slate-700 rounded p-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-3 flex items-center gap-1.5 border-b border-slate-800 pb-2">
                      <ListFilter className="w-4 h-4 text-sky-400" />
                      Yerleşim Aşaması Kontrolü
                    </h3>
                    <div className="flex flex-col gap-2 font-mono text-xs">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="flex items-center gap-1.5 font-sans text-xs">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: teamATheme.primaryBg, border: `1px solid ${teamATheme.secondaryBg}` }} />
                          {teamATheme.name}:
                        </span>
                        <span className="text-sky-400 font-bold">{placedPlayers.filter(p => p.team === 'Siyah').length} / 11 Yerleşti</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
                        <span className="flex items-center gap-1.5 font-sans text-xs">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: teamBTheme.primaryBg, border: `1px solid ${teamBTheme.secondaryBg}` }} />
                          {teamBTheme.name}:
                        </span>
                        <span className="text-slate-300 font-bold">{placedPlayers.filter(p => p.team === 'Beyaz').length} / 11 Yerleşti</span>
                      </div>

                      {selectedPlacedPlayerId && (() => {
                        const playerToMove = placedPlayers.find(p => p.player.id === selectedPlacedPlayerId);
                        if (!playerToMove) return null;
                        return (
                          <div className="bg-[#020617] p-3 rounded border border-sky-500/20 my-2 text-center animate-fade-in font-sans">
                            <div className="text-[10px] uppercase font-bold text-sky-400 tracking-wider">
                              Eldeki Oyuncu:
                            </div>
                            <div className="text-xs font-black text-rose-400 mt-0.5">
                              [#{playerToMove.player.number}] {playerToMove.player.name}
                            </div>
                            <div className="text-[9px] text-slate-400 mt-1.5 leading-relaxed">
                              Sahada boş bir kareye tıklayarak bu oyuncuyu taşıyabilir veya aşağıdaki butona basıp kadrodan sökerek yedek kulübesine alabilirsiniz.
                            </div>
                            <div className="flex gap-1.5 mt-3">
                              <button
                                type="button"
                                onClick={() => {
                                  setPlacedPlayers(prev => prev.filter(p => p.player.id !== selectedPlacedPlayerId));
                                  addLog(`[${playerToMove.player.name}] kadrodan çıkarılarak yedek kulübesine devredildi.`, "info", undefined, undefined, false);
                                  setSelectedPlacedPlayerId(null);
                                }}
                                className="flex-1 bg-red-955 bg-red-900/60 text-red-200 border border-red-500/30 hover:bg-red-800 hover:text-white font-bold text-[9px] uppercase py-1 px-1 rounded transition-all cursor-pointer active:scale-95"
                              >
                                Kulübeye Al
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedPlacedPlayerId(null)}
                                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-305 text-slate-300 font-bold text-[9px] uppercase py-1 px-1 rounded transition-all cursor-pointer active:scale-95"
                              >
                                İptal
                              </button>
                            </div>
                          </div>
                        );
                      })()}

                      {isAiPlacing ? (
                        <div className="py-4 text-center text-xs text-sky-400 animate-pulse font-bold font-sans">
                          🤖 Yapay Zeka oyuncusunu otomatik yerleştiriyor...
                        </div>
                      ) : (
                        <div className="mt-2 space-y-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-sans">
                            Sıradaki Oyuncuyu Seçin ({placingTheme.name.toUpperCase()}):
                          </span>

                          {/* Position Tabs for 25-man pool */}
                          <div className="flex flex-wrap gap-1 bg-[#020617] p-1 rounded border border-slate-800">
                            {(['ALL', 'GK', 'DF', 'MF', 'FW'] as const).map(g => {
                              const labelMap = { ALL: 'Hepsi', GK: 'KL', DF: 'DF', MF: 'OS', FW: 'FOR' };
                              const isActive = placementPosFilter === g;
                              // Count of unplaced players in this category
                              const count = g === 'ALL' ? unplaced.length : unplaced.filter(p => p.positionGroup === g).length;
                              return (
                                <button
                                  key={`place-filter-btn-${g}`}
                                  type="button"
                                  onClick={() => setPlacementPosFilter(g)}
                                  className={`flex-1 text-[9px] font-sans font-bold py-1 px-1 rounded transition-all cursor-pointer text-center
                                    ${isActive 
                                      ? 'bg-sky-600 text-white shadow-sm font-extrabold' 
                                      : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                                    }
                                  `}
                                >
                                  {labelMap[g]} ({count})
                                </button>
                              );
                            })}
                          </div>

                          <div className="max-h-[300px] overflow-y-auto space-y-1.5 pr-1 font-sans">
                            {(() => {
                              const filteredList = placementPosFilter === 'ALL'
                                ? unplaced
                                : unplaced.filter(p => p.positionGroup === placementPosFilter);

                              if (filteredList.length === 0) {
                                return (
                                  <div className="text-center py-6 text-slate-500 font-sans text-[10px] italic">
                                    Bu pozisyonda oyuncu yok.
                                  </div>
                                );
                              }

                              return filteredList.map(player => {
                                const isSelected = selectedPlacementPlayerId === player.id;
                                return (
                                  <button
                                    key={`placement-sel-${player.id}`}
                                    type="button"
                                    onClick={() => {
                                      setSelectedPlacementPlayerId(player.id);
                                      setInspectingPlayer(player);
                                    }}
                                    className={`w-full p-2 rounded flex items-center justify-between text-left transition-all border cursor-pointer
                                      ${isSelected 
                                        ? 'bg-sky-600/20 border-sky-400 font-bold text-white shadow-md shadow-sky-500/10' 
                                        : 'bg-[#020617] border-slate-800 text-slate-300 hover:bg-slate-900/60 hover:text-white'
                                      }
                                    `}
                                  >
                                    <div className="flex items-center gap-2 font-sans text-xs">
                                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono
                                        ${player.positionGroup === 'GK' ? 'bg-purple-950 text-purple-300 border border-purple-800/60' :
                                          player.positionGroup === 'DF' ? 'bg-blue-950 text-blue-300 border border-blue-800/60' :
                                          player.positionGroup === 'MF' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60' :
                                          'bg-red-950 text-red-300 border border-red-800/60'}
                                      `}>
                                        {player.positionGroup}
                                      </span>
                                      <div className="truncate max-w-[140px]">
                                        <div className="text-xs font-bold leading-tight font-sans text-white">{player.name}</div>
                                        <div className="text-[9px] text-slate-400 truncate leading-none mt-0.5 font-sans">{player.role}</div>
                                      </div>
                                    </div>
                                    <div className="text-right flex items-center gap-1.5 font-mono">
                                      <span className="text-[10px] text-slate-500">#{player.number}</span>
                                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />}
                                    </div>
                                  </button>
                                );
                              });
                            })()}
                          </div>
                          
                          <p className="text-[10px] text-slate-500 italic leading-relaxed pt-2 border-t border-slate-800/60 font-sans">
                            * Yukarıdan taktiksel yerleştirmek istediğiniz oyuncuya tıklayın, ardından yer kaplamak istediğiniz boş kurgu karesine basın.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Selected Player Inspector */}
              {inspectingPlayer && (() => {
                const isSiyah = blackSquad.some(p => p.id === inspectingPlayer.id);
                const currentTheme = isSiyah ? teamATheme : teamBTheme;
                return (
                  <div id="player-profile-inspector" className="flex flex-col items-center gap-2.5 animate-fade-in bg-[#0f172a] p-4 border border-slate-800 rounded-lg">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5 border-b border-slate-800 pb-2 w-full justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
                      <span>Saha İçi Oyuncu Detayı</span>
                    </div>
                    <PlayerCard
                      player={inspectingPlayer}
                      teamTheme={currentTheme}
                      showSelector={false}
                    />
                    <div className="text-[10px] text-slate-400 italic text-center leading-relaxed mt-2 max-w-[240px]">
                      "{inspectingPlayer.description}"
                    </div>
                  </div>
                );
              })()}

              {/* Match Live Scrolling Log Ticker (3 cols) */}
              <div id="live-feed-card" className="bg-[#0f172a] border border-slate-700 rounded p-4 flex-1 flex flex-col gap-3 min-h-[300px]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
                  📻 Canlı Maç Tickerı
                </h3>
                <div id="logs-view-port" className="flex-1 overflow-y-auto max-h-[400px] pr-1.5 flex flex-col gap-2">
                  {logs.map(log => (
                    <div 
                      key={log.id} 
                      className={`
                        p-2.5 rounded border text-xs leading-normal font-sans animate-fade-in
                        ${log.type === 'goal' ? 'bg-red-950/40 border-red-500/50 text-red-150 font-bold shadow-md' : ''}
                        ${log.type === 'success' ? 'bg-slate-900 border-slate-700 text-slate-100' : ''}
                        ${log.type === 'warning' ? 'bg-amber-950/20 border-amber-900/40 text-amber-200' : ''}
                        ${log.type === 'dice' ? 'bg-black/40 border-slate-800 text-slate-300 font-mono' : ''}
                        ${log.type === 'info' ? 'bg-slate-900/30 border-slate-800/40 text-slate-400' : ''}
                      `}
                    >
                      <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono mb-1">
                        <span>TUR {log.turn}</span>
                        {log.roll1 && <span>[D20: {log.roll1}]</span>}
                      </div>
                      <p>{log.text}</p>
                    </div>
                  ))}
                  {logs.length === 0 && (
                    <div className="text-center py-10 text-xs text-slate-500 italic">
                      Henüz bir olay gerçekleşmedi.
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* Google AdSense Display Banner */}
        <AdSenseBanner className="mt-2" />

      </main>

      {/* 1. Pre-match Initiative / Kura Rolling Animation Screen */}
      {showInitiativeModal && (
        <div id="initiative-modal-cover" className="fixed inset-0 z-55 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center animate-fade-in select-none">
          <div className="max-w-xl w-full bg-[#0a0f1d] border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl flex flex-col items-center gap-6 font-display ring-1 ring-emerald-500/20">
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-mono tracking-widest font-extrabold px-3 py-1 rounded-full uppercase">
                🏷️ MAÇ BAŞLANGICI
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-wide uppercase italic mt-1 font-sans">
                Kafadan Taktik Kur'a Çekimi
              </h2>
              <p className="text-xs text-slate-400 max-w-sm mt-1 leading-relaxed">
                Maç başlamadan önce ilk taktiksel yerleşim üstünlüğünü ve topu alacak tarafı belirlemek için fiziksel zarlar atılır.
              </p>
            </div>

            {isInitiativeRolling ? (
              <div className="flex flex-col items-center gap-6 py-8 w-full animate-pulse">
                {/* Visual Spinning Dice Simulator */}
                <div className="flex gap-8 justify-center items-center">
                  <div className="w-16 h-16 rounded-xl bg-amber-500/15 border-2 border-amber-500/60 flex items-center justify-center animate-spin text-3xl shadow-lg border-dashed">
                    🎲
                  </div>
                  <span className="text-slate-500 font-mono text-xl animate-bounce">VS</span>
                  <div className="w-16 h-16 rounded-xl bg-sky-500/15 border-2 border-sky-500/60 flex items-center justify-center animate-spin text-3xl shadow-lg border-dashed" style={{ animationDirection: 'reverse' }}>
                    🎲
                  </div>
                </div>
                
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs text-emerald-400 font-mono font-bold uppercase tracking-wider animate-pulse">
                    Fiziksel Zarlar Sahaya Fırlatılıyor...
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Yerel depolamalı simülasyon motoru kura zarlarını dönderiyor.
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-5 w-full animate-fade-in">
                {/* Dice scores overview */}
                <div className="grid grid-cols-2 gap-4 w-full mt-2">
                  <div className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all
                    ${initiativeWinner === 'Siyah' 
                      ? 'bg-amber-950/20 border-amber-550/50 shadow-xl shadow-amber-950/25 scale-102' 
                      : 'bg-slate-900/40 border-slate-800'
                    }
                  `}>
                    <span className="text-[10px] text-amber-400 uppercase tracking-widest font-extrabold font-mono">{teamATheme.name} Zarı</span>
                    <div className="text-4xl md:text-5xl font-black font-mono text-white mt-1">
                      {initiativeRolls?.Siyah}
                    </div>
                    <span className="text-[9px] text-slate-500">D20 Şans Zarı</span>
                  </div>

                  <div className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all
                    ${initiativeWinner === 'Beyaz' 
                      ? 'bg-sky-950/20 border-sky-550/50 shadow-xl shadow-sky-950/25 scale-102' 
                      : 'bg-slate-900/40 border-slate-800'
                    }
                  `}>
                    <span className="text-[10px] text-sky-400 uppercase tracking-widest font-extrabold font-mono">{teamBTheme.name} Zarı</span>
                    <div className="text-4xl md:text-5xl font-black font-mono text-white mt-1">
                      {initiativeRolls?.Beyaz}
                    </div>
                    <span className="text-[9px] text-slate-500">D20 Şans Zarı</span>
                  </div>
                </div>

                {/* Winner Declaration Banner */}
                <div className="bg-[#020617] border border-slate-800 rounded-xl p-4 w-full flex flex-col items-center gap-1.5 shadow-inner">
                  <span className="text-[9px] text-emerald-400 font-mono font-bold uppercase tracking-wider">KUR'A BİRİNCİSİ</span>
                  <h3 className="text-xl font-extrabold text-white uppercase flex items-center gap-2 tracking-wide font-sans mt-0.5">
                    ✨ {initiativeWinner === 'Siyah' ? teamATheme.name : teamBTheme.name} TAKIM!
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-sm text-center leading-relaxed">
                    Zar üstünlüğünü alan {initiativeWinner === 'Siyah' ? teamATheme.name : teamBTheme.name}, sahaya ilk oyuncu (Kaleci) yerleştirme avantajını ve top zilyetliğini elde etti!
                  </p>
                  
                  {isVsAI && (
                    <div className="mt-2.5 pt-2.5 border-t border-slate-900 w-full flex items-center justify-center gap-1.5">
                      <span className="bg-sky-950 text-sky-400 text-[8.5px] font-extrabold uppercase px-2 py-0.5 rounded font-mono border border-sky-900/60">
                        YAPAY ZEKA SEÇİMİ
                      </span>
                      <span className="text-[10.5px] text-slate-400 font-medium">
                        Rakip {teamBTheme.name} dizilişi: <strong className="text-white font-mono">{aiFormation}</strong>
                      </span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowInitiativeModal(false);
                    setPhase('PLACEMENT');
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 hover:brightness-110 text-white font-extrabold text-xs uppercase tracking-wider py-3.5 px-6 rounded-xl transition-all duration-200 active:scale-98 shadow-lg shadow-emerald-950/40 cursor-pointer border border-emerald-500/20"
                >
                  Sahaya Yerleşimi Başlat ➜
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Tactical Resolution / Savaş Simülasyonu Modal with Dice details */}
      {showResolutionModal && (
        <div id="resolution-modal-cover" className="fixed inset-0 z-55 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fade-in select-none">
          <div className="max-w-2xl w-full bg-[#0a0f1d] border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            
            {/* Header section */}
            <div className="bg-[#0f172a] border-b border-slate-850 p-5 shrink-0 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[9.5px] bg-sky-950 text-sky-400 border border-sky-800/60 font-mono tracking-widest font-extrabold px-2.5 py-0.5 rounded uppercase">
                  🎲 TUR BATTLE RESÜMESİ
                </span>
                <span className="text-[10px] text-slate-500 font-mono font-bold">TUR {matchTurn} AKSİYONLARI</span>
              </div>
              <h2 className="text-xl font-black text-white uppercase italic tracking-wide font-sans mt-1">
                Aksiyon Re-Kalkülasyon Sonuçları
              </h2>
            </div>

            {/* Scrollable Combat log list or loading simulator */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {isResolutionRolling ? (
                <div className="flex flex-col items-center justify-center py-16 gap-6 animate-pulse text-center">
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-dashed border-sky-500/40 animate-spin"></div>
                    <Dice5 className="w-10 h-10 text-sky-400 animate-bounce" />
                  </div>

                  <div className="flex flex-col items-center gap-1 max-w-sm">
                    <span className="text-xs text-sky-400 font-mono font-extrabold uppercase tracking-widest leading-none">
                      İkili Mücadele Savaşları Hesaplanıyor...
                    </span>
                    <p className="text-[10.5px] text-slate-500 mt-2 font-sans leading-relaxed">
                      Oyuncularınızın gönderdiği taktikler (Koşu, Top Sürme, Pas, Şut) d20 fiziksel zarları ve oyuncu yetenek katsayıları eşliğinde simüle ediliyor.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3.5 pr-1 animate-fade-in">
                  
                  <div className="text-[11px] font-sans text-slate-400 leading-normal bg-slate-900/30 p-3 rounded-lg border border-slate-855/50">
                    💡 <strong>Analiz Raporu:</strong> Aşağıdaki kartlarda her oyuncunun planladığı taktik eylemin d20 zar eşleşmesi, yetenek puanı katkısı ve toplam fiziksel güç düzeyi listelenmiştir. Detayları inceleyip sahaya uygulayabilirsiniz.
                  </div>

                  {pendingResolution?.reports.map((report, idx) => {
                    const isGoalEvent = report.description.includes('GOL!') || report.description.includes('ağları havalandırıyor');
                    const isSaveEvent = report.description.includes('🧤') || report.description.includes('KURTARIŞ');
                    const isSuccessEvent = report.description.includes('Hızlı Koşu Başarılı') || report.description.includes('Pas Başarılı') || report.description.includes('mücadeleyi kazandı');

                    return (
                      <div 
                        key={`resolution-report-card-${idx}`}
                        className={`p-4 rounded-xl border flex flex-col gap-3 transition-colors
                          ${isGoalEvent ? 'bg-red-950/20 border-red-500/40 shadow-md shadow-red-950/10' : ''}
                          ${isSaveEvent ? 'bg-purple-950/10 border-purple-800/40' : ''}
                          ${(!isGoalEvent && !isSaveEvent) ? 'bg-[#0f172a]/70 border-slate-850' : ''}
                        `}
                      >
                        {/* Title statement */}
                        <div className="flex items-start gap-2">
                          <span className="text-base leading-none shrink-0 mt-0.5">
                            {isGoalEvent ? '⚽' : isSaveEvent ? '🧤' : isSuccessEvent ? '⚡' : '🏃'}
                          </span>
                          <span className={`text-xs font-semibold font-sans leading-relaxed
                            ${isGoalEvent ? 'text-rose-300 font-extrabold' : ''}
                            ${isSaveEvent ? 'text-purple-300 font-bold' : ''}
                            ${(!isGoalEvent && !isSaveEvent) ? 'text-slate-200' : ''}
                          `}>
                            {report.description}
                          </span>
                        </div>

                        {/* Interactive Dice comparisons list */}
                        {report.rolls && report.rolls.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1.5 pt-2.5 border-t border-slate-850/60">
                            {report.rolls.map((roll, rIdx) => {
                              const isBlackTeam = roll.team === 'Siyah';
                              
                              return (
                                <div 
                                  key={`report-roll-badge-${rIdx}`}
                                  className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2.5
                                    ${isBlackTeam 
                                      ? 'bg-amber-950/10 border-amber-500/30 text-amber-100' 
                                      : 'bg-indigo-950/30 border-indigo-500/30 text-indigo-150'
                                    }
                                  `}
                                >
                                  <div className="flex flex-col">
                                    <span className="text-[10px] uppercase font-bold truncate max-w-[120px] tracking-tight">
                                      {roll.name}
                                    </span>
                                    <span className={`text-[8px] font-bold mt-0.5 uppercase tracking-wider
                                      ${isBlackTeam ? 'text-amber-500' : 'text-indigo-400'}
                                    `}>
                                      {isBlackTeam ? teamATheme.name : teamBTheme.name} Oyuncusu
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0 font-mono">
                                    <div className="text-[10.5px] text-right text-slate-400">
                                      {roll.roll} <span className="text-[8px] text-slate-500">Zar</span> + {roll.stat} <span className="text-[8px] text-slate-500">Yet.</span>
                                    </div>
                                    <div className={`px-2 py-0.5 rounded text-[11px] font-black text-center min-w-[28px] border
                                      ${isBlackTeam 
                                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm' 
                                        : 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
                                      }
                                    `}>
                                      {roll.total}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {pendingResolution?.reports.length === 0 && (
                    <div className="text-center py-12 text-xs text-slate-500 italic">
                      Bu tur hiçbir aktif aksiyon planlanmadığından ikili mücadele yaşanmadı. Oyuncular yerlerini koruyor!
                    </div>
                  )}

                  {/* Goal or save special message */}
                  {pendingResolution?.goalScored && (
                    <div className="bg-red-950/30 border border-red-500/50 rounded-xl p-4 flex flex-col items-center gap-1 text-center animate-bounce mt-4 shadow-lg shadow-red-950/20">
                      <Trophy className="w-10 h-10 text-yellow-500" />
                      <h4 className="text-base font-extrabold text-red-200 mt-1 uppercase">ŞANLI SKOR GÜNCELLENDİ!</h4>
                      <p className="text-xs text-slate-400 max-w-sm mt-0.5">
                        {pendingResolution.scorerObj?.player.name} oyuncusunun topu ağlarla buluştu ve skor tabelası değişti!
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom action bar */}
            {!isResolutionRolling && (
              <div className="bg-[#0f172a] border-t border-slate-850 p-4 shrink-0 flex gap-3">
                <button
                  type="button"
                  onClick={applyPendingResolution}
                  className="w-full bg-sky-600 hover:bg-sky-500 hover:brightness-110 text-white font-extrabold text-xs uppercase tracking-wider py-3.5 px-6 rounded-xl transition-all duration-200 active:scale-98 shadow-md cursor-pointer border border-sky-500/20 text-center"
                >
                  Analizleri Onayla & Sahaya Uygula ➜
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Goal Celebration Animations Screen */}
      {showGoalCelebration && lastScorer && (
        <div id="goal-flash-cover" className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in">
          <div className="max-w-md bg-[#0f172a] border border-slate-700 rounded-lg p-8 shadow-2xl flex flex-col items-center gap-5 font-display">
            <Trophy className="w-16 h-16 text-yellow-500 animate-bounce" />
            
            <h2 className="text-3xl font-extrabold text-white tracking-widest uppercase italic">
              ⚽ GOL OOOOOL!
            </h2>

            <div className="bg-[#020617] border border-slate-800 p-4 rounded w-full">
              <span className="text-[10px] text-sky-400 uppercase tracking-widest font-bold font-mono">GOLÜN SAHİBİ</span>
              <h3 className="text-lg font-bold text-white mt-1 uppercase">{lastScorer.player.name}</h3>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">{lastScorer.player.role} (#{lastScorer.player.number})</p>
            </div>

            <div className="flex gap-4 w-full">
              <button
                id="continue-after-goal-btn"
                onClick={handleKickoffAfterGoal}
                className="flex-1 bg-sky-600 hover:bg-sky-500 font-bold text-xs uppercase tracking-wider py-3 px-6 rounded text-white transition-all active:scale-95 cursor-pointer shadow-lg"
              >
                Yeniden Başla (Santra)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rules and KVKK Declaration Modal */}
      <RulesModal 
        isOpen={isRulesOpen} 
        onClose={() => setIsRulesOpen(false)} 
      />

      {/* Profile and Stats Dashboard Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentUser={currentUser}
        userStats={userStats}
        onStatsUpdate={(newStats) => setUserStats(newStats)}
      />

      {/* Clean legislative footer */}
      <footer id="regulatory-footer" className="bg-[#0a0f1d] border-t border-slate-800/80 py-4 px-6 text-center text-[10px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3 font-sans">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-3.5 h-3.5 text-slate-650" />
          <span>Kafadan Taktik %100 Yerel Depolamalı, KVKK-Uyumlu & Ücretsiz Eğlence Yazılımıdır.</span>
        </div>
        <span>© 2026 Kafadan Taktik • T.C. Bilişim Mevzuatı ve Lisans Güvencesi</span>
      </footer>

    </div>
  );
}
