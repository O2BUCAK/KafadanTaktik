/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PositionRole = 
  | 'Kaleci (Libero)' 
  | 'Kaleci (Çizgi)'
  | 'Sağ Bek (Defansif)'
  | 'Sağ Bek (Ofansif)'
  | 'Sol Bek (Defansif)'
  | 'Sol Bek (Ofansif)'
  | 'Defans (Hızlı Teknik)'
  | 'Defans (Ağır Pasör)'
  | 'Defans (Dengeli)'
  | 'Defansif Orta Saha'
  | 'Merkez Orta Saha'
  | 'Ofansif Orta Saha'
  | 'Sol Kanat (Çizgiye İnen)'
  | 'Sol Kanat (İçeri Giren)'
  | 'Sağ Kanat (Çizgiye İnen)'
  | 'Sağ Kanat (İçeri Giren)'
  | 'Pivot Forvet'
  | 'Fırsatçı Golcü'
  | 'Sahte 9'
  | 'Komple Forvet';

export interface PlayerStats {
  hiz: number;       // Hız (1-20)
  guc: number;       // Güç (1-20)
  teknik: number;    // Teknik (1-20)
  pas: number;       // Pas (1-20)
  sut: number;       // Şut (1-20)
  savunma: number;   // Savunma (1-20)
}

export interface Player {
  id: string;
  name: string;
  number: number;
  positionGroup: 'GK' | 'DF' | 'MF' | 'FW';
  role: PositionRole;
  stats: PlayerStats;
  description: string;
}

export type TeamColor = 'Siyah' | 'Beyaz';

export interface Position {
  x: number; // 0 to 20
  y: number; // 0 to 12
}

export interface PlacedPlayer {
  player: Player;
  team: TeamColor;
  position: Position;
  isGK: boolean;
}

export type ActionType = 
  | 'WAIT'       // Bekle
  | 'MOVE'       // Hareket Et
  | 'PASS'       // Pas At
  | 'SHOOT'      // Şut Çek
  | 'DRIBBLE'    // Top Sür
  | 'TACKLE';    // Müdahale Et (Otomatik/Yarı-aktif veya komşu hücre savunması)

export interface PlannedAction {
  playerId: string;
  type: ActionType;
  targetPos: Position; // Where they move or where they pass/shoot
  targetPlayerId?: string; // For passes
}

export interface GameLog {
  id: string;
  turn: number;
  phase: string;
  text: string;
  roll1?: number; // Dice 1
  roll2?: number; // Dice 2
  type: 'info' | 'success' | 'warning' | 'goal' | 'dice';
}

export type PerformanceBracket = 'WEAK' | 'MEDIUM' | 'GOOD' | 'EXCELLENT';

export type GamePhase = 
  | 'INITIATIVE'       // Kur'a Atışı / Başlama hakkı belirleme
  | 'SQUAD_DRAFT'       // Başlama zarından sonra oyuncu seçimi / 11 belirleme
  | 'PLACEMENT'        // Oyuncu yerleştirme
  | 'TACTICS_BLACK'    // Siyah takım taktik belirleme
  | 'TACTICS_WHITE'    // Beyaz takım taktik belirleme
  | 'RESOLUTION'       // Zar atma ve tur hesaplama
  | 'GOAL_CELEBRATION' // Gol sevinci
  | 'MATCH_OVER';      // Maç bitti

export interface GameState {
  phase: GamePhase;
  score: { Siyah: number; Beyaz: number };
  turn: number;
  ballPosition: Position;
  ballCarrier: { team: TeamColor; playerId: string } | null; // null if loose ball
  placedPlayers: PlacedPlayer[]; // Currently on field (11 of Black, 11 of White)
  blackSquad: Player[]; // Full 25-man
  whiteSquad: Player[]; // Full 25-man
  placementTurnIndex: number; // For tracking placement sequence
  plannedActions: Record<string, PlannedAction>; // Key: playerId
  logs: GameLog[];
  initiativeRolls: { Siyah: number; Beyaz: number } | null;
  initiativeWinner: TeamColor | null;
  activeTeam: TeamColor; // Whose turn to plan
  isVsAI: boolean; // Single player mode vs AI or local PvP
  lastDiceResults: {
    description: string;
    rolls: { name: string; roll: number; stat: number; total: number; team: TeamColor }[];
  } | null;
}
