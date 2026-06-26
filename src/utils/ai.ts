/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Player, PlacedPlayer, Position, TeamColor, PlannedAction, ActionType } from '../types';

/**
 * Helper to calculate grid distance between two positions
 */
export const getDistance = (p1: Position, p2: Position): number => {
  return Math.max(Math.abs(p1.x - p2.x), Math.abs(p1.y - p2.y));
};

/**
 * Find adjacent empty cells or check if step is valid
 */
export const isAdjacent = (p1: Position, p2: Position): boolean => {
  return getDistance(p1, p2) === 1;
};

/**
 * Filter and select a balanced starting 11 from a 25-man squad for AI placement
 */
export const selectAIStartingEleven = (squad: Player[]): Player[] => {
  const gks = squad.filter(p => p.positionGroup === 'GK');
  const dfs = squad.filter(p => p.positionGroup === 'DF');
  const mfs = squad.filter(p => p.positionGroup === 'MF');
  const fws = squad.filter(p => p.positionGroup === 'FW');

  const selected: Player[] = [];
  
  // 1 Goalkeeper (prefer Çizgi Kalecisi for defensive strength or Libero)
  if (gks.length > 0) selected.push(gks[1] || gks[0]);

  // 4 Defenders (2 fullbacks, 2 centerbacks)
  const fullbacks = dfs.filter(p => p.role.includes('Bek'));
  const centerbacks = dfs.filter(p => !p.role.includes('Bek'));
  
  selected.push(fullbacks[0] || dfs[0]);
  selected.push(fullbacks[1] || dfs[1]);
  selected.push(centerbacks[0] || dfs[2]);
  selected.push(centerbacks[1] || dfs[3]);

  // 4 Midfielders
  const dms = mfs.filter(p => p.role.includes('Defansif'));
  const oms = mfs.filter(p => p.role.includes('Ofansif'));
  const cms = mfs.filter(p => p.role.includes('Merkez'));

  selected.push(dms[0] || mfs[0]);
  selected.push(oms[0] || mfs[1]);
  selected.push(cms[0] || mfs[2]);
  selected.push(cms[1] || mfs[3]);

  // 2 Forwards
  selected.push(fws[0]);
  selected.push(fws[1] || fws[0]);

  return selected;
};

/**
 * Determine a tactical position for placing an AI player on the board during PLACEMENT
 * White Attacking: Left goal (x=0, y=5..7), defending Right goal (x=20, y=5..7)
 * Valid Placement for White: x: 10 .. 20 (Own half)
 */
export const getAIPlacementPosition = (
  player: Player,
  existingPlaced: PlacedPlayer[],
  formation: '4-4-2' | '3-5-2' | '4-3-3' | '5-4-1' = '4-4-2'
): Position => {
  const whitePlaced = existingPlaced.filter(p => p.team === 'Beyaz');

  // Goalkeeper choice
  if (player.positionGroup === 'GK') {
    const targets = [{ x: 20, y: 6 }, { x: 20, y: 5 }, { x: 20, y: 7 }];
    for (const pos of targets) {
      const isOccupied = existingPlaced.some(p => p.position.x === pos.x && p.position.y === pos.y);
      if (!isOccupied) return pos;
    }
    return { x: 20, y: 6 };
  }

  // Get ordered list of 10 outfield spots for each tactical formation
  let outfieldTargets: Position[] = [];

  if (formation === '3-5-2') {
    outfieldTargets = [
      // 3 DF
      { x: 18, y: 6 },  // CB Center
      { x: 17, y: 3 },  // CB Left
      { x: 17, y: 9 },  // CB Right
      // 5 MF
      { x: 15, y: 6 },  // DM
      { x: 14, y: 4 },  // AM Left
      { x: 14, y: 8 },  // AM Right
      { x: 14, y: 2 },  // LM Left
      { x: 14, y: 10 }, // RM Right
      // 2 FW
      { x: 12, y: 4 },  // ST Left
      { x: 12, y: 8 },  // ST Right
    ];
  } else if (formation === '4-3-3') {
    outfieldTargets = [
      // 4 DF
      { x: 18, y: 5 },  // CB Left
      { x: 18, y: 7 },  // CB Right
      { x: 17, y: 2 },  // LB
      { x: 17, y: 10 }, // RB
      // 3 MF
      { x: 15, y: 6 },  // DM Center
      { x: 14, y: 4 },  // CM Left
      { x: 14, y: 8 },  // CM Right
      // 3 FW
      { x: 12, y: 6 },  // ST Striker
      { x: 12, y: 2 },  // LW Winger Left
      { x: 12, y: 10 }, // RW Winger Right
    ];
  } else if (formation === '5-4-1') {
    outfieldTargets = [
      // 5 DF
      { x: 18, y: 6 },  // CB Center
      { x: 18, y: 4 },  // CB Left
      { x: 18, y: 8 },  // CB Right
      { x: 17, y: 2 },  // LB
      { x: 17, y: 10 }, // RB
      // 4 MF
      { x: 15, y: 5 },  // CM Left
      { x: 15, y: 7 },  // CM Right
      { x: 14, y: 2 },  // LM
      { x: 14, y: 10 }, // RM
      // 1 FW
      { x: 12, y: 6 },  // ST Centered
    ];
  } else {
    // default 4-4-2
    outfieldTargets = [
      // 4 DF
      { x: 18, y: 5 },  // CB Left
      { x: 18, y: 7 },  // CB Right
      { x: 17, y: 2 },  // LB
      { x: 17, y: 10 }, // RB
      // 4 MF
      { x: 15, y: 5 },  // CM Left
      { x: 15, y: 7 },  // CM Right
      { x: 14, y: 2 },  // LM Left
      { x: 14, y: 10 }, // RM Right
      // 2 FW
      { x: 12, y: 4 },  // ST Left
      { x: 12, y: 8 },  // ST Right
    ];
  }

  // Count how many outfield White players are already placed
  const outfieldPlacedCount = whitePlaced.filter(p => !p.isGK).length;
  const target = outfieldTargets[outfieldPlacedCount] || outfieldTargets[0];

  const isOccupied = (pos: Position) => {
    return existingPlaced.some(p => p.position.x === pos.x && p.position.y === pos.y);
  };

  if (!isOccupied(target)) {
    return target;
  }

  // Fail safe: try to scan all defined targets in order to find an empty one
  for (const pos of outfieldTargets) {
    if (!isOccupied(pos)) return pos;
  }

  // Ultimate fallback of the entire White starting half (x: 11..20, y: 1..11)
  for (let x = 11; x <= 20; x++) {
    for (let y = 1; y <= 11; y++) {
      if (!isOccupied({ x, y })) {
        return { x, y };
      }
    }
  }

  return { x: 19, y: 11 };
};

/**
 * Generates planned actions for the entire AI team (White)
 * Objectives:
 * - If carrying the ball: Shoot if in range (x <= 5, y: 3..9), or Pass to a forward open player, or Dribble forward (decrease x).
 * - If not carrying the ball: 
 *      - Closest player runs to intercept the ball.
 *      - Defenders protect the goalkeeper zone (stay near Siyah attackers).
 *      - Midfielders / Forwards run to open spaces or get closer to left goal.
 */
export const planAIActions = (
  placedPlayers: PlacedPlayer[],
  ballPos: Position,
  ballCarrier: { team: TeamColor; playerId: string } | null
): Record<string, PlannedAction> => {
  const actions: Record<string, PlannedAction> = {};
  const whitePlayers = placedPlayers.filter(p => p.team === 'Beyaz');
  
  // Find out who is carrying the ball
  const isWhiteCarrying = ballCarrier?.team === 'Beyaz';
  const carrierPlayer = isWhiteCarrying ? whitePlayers.find(p => p.player.id === ballCarrier.playerId) : null;

  // Track intended destinations to avoid AI players stacking up
  const reservedDestinations: string[] = [];
  const reservePos = (pos: Position) => reservedDestinations.push(`${pos.x},${pos.y}`);
  const isReserved = (pos: Position) => reservedDestinations.includes(`${pos.x},${pos.y}`);

  whitePlayers.forEach(p => {
    // Reserve current position as baseline or if staying
    if (p.player.id !== carrierPlayer?.player.id) {
       // Keep track of general positions
    }
  });

  // 1. Process BALL CARRIER first
  if (carrierPlayer) {
    const carrierPos = carrierPlayer.position;
    
    // Check if in shooting range (x is small, close to left goal of Siyah which is x = 0, y = 5..7)
    // Shooting range is usually x <= 5
    if (carrierPos.x <= 6 && carrierPos.y >= 3 && carrierPos.y <= 9) {
      // Shoot at center of the goal
      actions[carrierPlayer.player.id] = {
        playerId: carrierPlayer.player.id,
        type: 'SHOOT',
        targetPos: { x: 0, y: 6 }
      };
      reservePos(carrierPos);
    } else {
      // Try to PASS or DRIBBLE
      // Look for a teammate in a better (smaller x) position that is open (no Siyah adjacent)
      const teammates = whitePlayers.filter(tm => tm.player.id !== carrierPlayer.player.id && !tm.isGK);
      
      let bestPassTarget: PlacedPlayer | null = null;
      let bestPassScore = -999;

      teammates.forEach(tm => {
        // Distance can be any length (up to 20 for full pitch)
        const dist = getDistance(carrierPos, tm.position);
        if (dist <= 20) {
          // Score teammate based on forwardness (smaller x is better)
          let score = (carrierPos.x - tm.position.x) * 3; 
          
          // Distance penalty on AI's pass preference
          const maxFreeDistance = 5;
          const distancePenalty = dist > maxFreeDistance ? Math.floor((dist - maxFreeDistance) * 1.5) : 0;
          score -= distancePenalty; // AI dislikes passing extremely long distance unless extremely forward/open

          // Check if any Siyah is near the teammate
          const opponentsNear = placedPlayers.filter(
            op => op.team === 'Siyah' && getDistance(op.position, tm.position) <= 1
          );
          score -= opponentsNear.length * 4; // penalty for marking
          
          // Is it forward?
          if (tm.position.x < carrierPos.x && score > bestPassScore) {
            bestPassScore = score;
            bestPassTarget = tm;
          }
        }
      });

      // Pass if we found a good target and roll dice, otherwise DRIBBLE
      if (bestPassTarget && bestPassScore > 0) {
        actions[carrierPlayer.player.id] = {
          playerId: carrierPlayer.player.id,
          type: 'PASS',
          targetPos: (bestPassTarget as PlacedPlayer).position,
          targetPlayerId: (bestPassTarget as PlacedPlayer).player.id
        };
        reservePos(carrierPos);
      } else {
        // Dribble forward (decrease x, and maybe align slightly with y center)
        let idealNextX = carrierPos.x - 1;
        if (idealNextX < 0) idealNextX = 0;

        let idealNextY = carrierPos.y;
        if (carrierPos.y < 5) idealNextY += 1;
        else if (carrierPos.y > 7) idealNextY -= 1;

        // Ensure we don't dribble directly into a defender block unless we have to
        const opponentsNearIdeal = placedPlayers.filter(
          op => op.team === 'Siyah' && getDistance(op.position, { x: idealNextX, y: idealNextY }) <= 0
        );

        if (opponentsNearIdeal.length > 0) {
          // try alternate diagonal steps
          const diagonals = [
            { x: idealNextX, y: carrierPos.y + 1 },
            { x: idealNextX, y: carrierPos.y - 1 }
          ].filter(p => p.y >= 0 && p.y <= 12);
          
          let foundDiago = false;
          for (const d of diagonals) {
            const block = placedPlayers.some(op => op.position.x === d.x && op.position.y === d.y);
            if (!block) {
              actions[carrierPlayer.player.id] = {
                playerId: carrierPlayer.player.id,
                type: 'DRIBBLE',
                targetPos: d
              };
              reservePos(d);
              foundDiago = true;
              break;
            }
          }

          if (!foundDiago) {
            // just push forward and fight it with d20!
            const targetPos = { x: idealNextX, y: idealNextY };
            actions[carrierPlayer.player.id] = {
              playerId: carrierPlayer.player.id,
              type: 'DRIBBLE',
              targetPos
            };
            reservePos(targetPos);
          }
        } else {
          const targetPos = { x: idealNextX, y: idealNextY };
          actions[carrierPlayer.player.id] = {
            playerId: carrierPlayer.player.id,
            type: 'DRIBBLE',
            targetPos
          };
          reservePos(targetPos);
        }
      }
    }
  }

  // 2. Process NON-CARRIER players
  // Identify who is closest to the ball among non-goalkeeping White players
  let closestPlayerId: string | null = null;
  let minBallDist = 999;

  whitePlayers.forEach(p => {
    if (p.isGK || p.player.id === carrierPlayer?.player.id) return;
    const dist = getDistance(p.position, ballPos);
    if (dist < minBallDist) {
      minBallDist = dist;
      closestPlayerId = p.player.id;
    }
  });

  whitePlayers.forEach(p => {
    // If we've already set the ball carrier action, skip
    if (p.player.id === carrierPlayer?.player.id) return;

    if (p.isGK) {
      // Goalkeeper: Shift back and forth in front of the goal (x=20) to align with ball carrier's Y
      const currentPos = p.position;
      let targetY = ballPos.y;
      if (targetY < 5) targetY = 5;
      if (targetY > 7) targetY = 7;

      if (currentPos.y !== targetY) {
        // move 1 cell towards ideal goal Y
        const nextY = currentPos.y < targetY ? currentPos.y + 1 : currentPos.y - 1;
        actions[p.player.id] = {
          playerId: p.player.id,
          type: 'MOVE',
          targetPos: { x: 20, y: nextY }
        };
      } else {
        actions[p.player.id] = {
          playerId: p.player.id,
          type: 'WAIT',
          targetPos: currentPos
        };
      }
      return;
    }

    // Determine movement speed based on Speed stat (1, 2, or 3 cells)
    const speedStat = p.player.stats.hiz;
    const maxSteps = speedStat >= 16 ? 2 : 1; // standard d20 board movement speed limits 

    const currentPos = p.position;

    // A. If closest player and Ball is LOOSE or carried by Siyah: RUSH TO BALL
    if (p.player.id === closestPlayerId && (!ballCarrier || ballCarrier.team === 'Siyah')) {
      // path towards ball
      let bestPos = currentPos;
      let bestDist = getDistance(currentPos, ballPos);

      // Analyze cells around us up to maxSteps to reach ball
      for (let dx = -maxSteps; dx <= maxSteps; dx++) {
        for (let dy = -maxSteps; dy <= maxSteps; dy++) {
          const testPos = { x: currentPos.x + dx, y: currentPos.y + dy };
          
          // boundary checks
          if (testPos.x >= 0 && testPos.x <= 20 && testPos.y >= 0 && testPos.y <= 12) {
            // is cell closer?
            const dist = getDistance(testPos, ballPos);
            if (dist < bestDist && !isReserved(testPos)) {
              bestDist = dist;
              bestPos = testPos;
            }
          }
        }
      }

      actions[p.player.id] = {
        playerId: p.player.id,
        type: 'MOVE',
        targetPos: bestPos
      };
      reservePos(bestPos);
      return;
    }

    // B. Other players (Defenders, mid, forwards)
    if (p.player.positionGroup === 'DF') {
      // Defenders: Maintain deep line, block closest Siyah players
      const closestOpponent = placedPlayers.find(
        op => op.team === 'Siyah' && op.player.positionGroup === 'FW'
      ) || placedPlayers.find(op => op.team === 'Siyah');

      if (closestOpponent) {
        // move to standard blocking zone between opponent and White goal (20, 6)
        const targetX = Math.round((closestOpponent.position.x + 20) / 2);
        const targetY = Math.round((closestOpponent.position.y + 6) / 2);

        let bestPos = currentPos;
        let bestDist = getDistance(currentPos, { x: targetX, y: targetY });

        for (let dx = -maxSteps; dx <= maxSteps; dx++) {
          for (let dy = -maxSteps; dy <= maxSteps; dy++) {
            const testPos = { x: currentPos.x + dx, y: currentPos.y + dy };
            if (testPos.x >= 13 && testPos.x <= 19 && testPos.y >= 0 && testPos.y <= 12) {
              const dist = getDistance(testPos, { x: targetX, y: targetY });
              if (dist < bestDist && !isReserved(testPos)) {
                bestDist = dist;
                bestPos = testPos;
              }
            }
          }
        }

        actions[p.player.id] = {
          playerId: p.player.id,
          type: 'MOVE',
          targetPos: bestPos
        };
        reservePos(bestPos);
      } else {
        // default wait or move back
        actions[p.player.id] = {
          playerId: p.player.id,
          type: 'WAIT',
          targetPos: currentPos
        };
      }
    } else if (p.player.positionGroup === 'MF') {
      // Midfielders: general positioning, support ball or back up
      let targetX = ballPos.x + 2; // hover around ball
      if (targetX > 18) targetX = 18;

      let bestPos = currentPos;
      let bestDist = getDistance(currentPos, { x: targetX, y: ballPos.y });

      for (let dx = -maxSteps; dx <= maxSteps; dx++) {
        for (let dy = -maxSteps; dy <= maxSteps; dy++) {
          const testPos = { x: currentPos.x + dx, y: currentPos.y + dy };
          if (testPos.x >= 7 && testPos.x <= 16 && testPos.y >= 0 && testPos.y <= 12) {
            const dist = getDistance(testPos, { x: targetX, y: ballPos.y });
            if (dist < bestDist && !isReserved(testPos)) {
              bestDist = dist;
              bestPos = testPos;
            }
          }
        }
      }

      actions[p.player.id] = {
        playerId: p.player.id,
        type: 'MOVE',
        targetPos: bestPos
      };
      reservePos(bestPos);
    } else {
      // Forwards: run towards Siyah penalty box to receive passes (x decrease, y around goal range 4..8)
      let targetX = 4;
      let targetY = p.player.role.includes('Çizgi') ? (p.player.id.includes('left') ? 2 : 10) : 6;

      let bestPos = currentPos;
      let bestDist = getDistance(currentPos, { x: targetX, y: targetY });

      for (let dx = -maxSteps; dx <= maxSteps; dx++) {
        for (let dy = -maxSteps; dy <= maxSteps; dy++) {
          const testPos = { x: currentPos.x + dx, y: currentPos.y + dy };
          if (testPos.x >= 1 && testPos.x <= 12 && testPos.y >= 0 && testPos.y <= 12) {
            const dist = getDistance(testPos, { x: targetX, y: targetY });
            if (dist < bestDist && !isReserved(testPos)) {
              bestDist = dist;
              bestPos = testPos;
            }
          }
        }
      }

      actions[p.player.id] = {
        playerId: p.player.id,
        type: 'MOVE',
        targetPos: bestPos
      };
      reservePos(bestPos);
    }
  });

  return actions;
};
