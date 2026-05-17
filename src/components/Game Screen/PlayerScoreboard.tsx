import React from 'react';
import type { PlayerStats } from '../../types';
import WinCard from './WinCard';
import './PlayerScoreboard.css';

export interface PlayerScoreboardProps {
  /** The player’s username (will be centered at top) */
  username: string;

  /** Current stats for this player (points and wins per element) */
  stats: PlayerStats;

  /**
   * How many starting points each element began with (used as the denominator),
   * so that we can display “Fire 10 / 20”, etc.
   */
  startingPoints: number;

  /**
   * How many wins are required to win by duplicates (used for reference, but
   * in this version we simply render as many cards as there are wins).
   */
  winGoal: number;

  /**
   * Where to pin this scoreboard on screen:
   *   - "left"  → top-left corner
   *   - "right" → top-right corner
   */
  alignment: 'left' | 'right';
}

/**
 * Renders a “Club Penguin–style” scoreboard for one player:
 *   • username centered at top,
 *   • under it, three element‐blocks (fire, water, grass) in a horizontal row,
 *     each showing the element on one line, then “X / Y” on the next line,
 *     plus a vertical stack of <WinCard> components.
 */
export const PlayerScoreboard: React.FC<PlayerScoreboardProps> = ({
  username,
  stats,
  startingPoints,
  alignment,
}) => {
  // Build an array for the three elements, capturing both points & the array of win‐powers
  const elements: {
    key: 'fire' | 'water' | 'grass';
    label: string;
    points: number;
    winPowers: number[];
    icon: string;
  }[] = [
    {
      key: 'fire',
      label: 'Fire',
      points: stats.firePoints,
      winPowers: stats.fireWinPowers,
      icon: '🔥',
    },
    {
      key: 'water',
      label: 'Water',
      points: stats.waterPoints,
      winPowers: stats.waterWinPowers,
      icon: '💧',
    },
    {
      key: 'grass',
      label: 'Grass',
      points: stats.grassPoints,
      winPowers: stats.grassWinPowers,
      icon: '🌿',
    },
  ];

  return (
    <div className={`player-scoreboard ${alignment}`}>
      {/* Username centered */}
      <h3 className="ps-username">{username}</h3>

      {/* Three element blocks in a row */}
      <div className="ps-elements">
        {elements.map((el) => (
          <div key={el.key} className="ps-element-block">
            {/* Header: icon on its own line; label next; then points/startingPoints */}
            <div className="ps-element-header">
              <span className="ps-element-icon">{el.icon}</span>
              <span className="ps-element-label">{el.label}</span>
              <span className="ps-element-points">
                {el.points} / {startingPoints}
              </span>
            </div>

            {/* Vertical stack of WinCard (size="small") */}
            <div className="ps-win-stack">
              {el.winPowers.map((power, idx) => (
                <WinCard
                  key={idx}
                  icon={el.icon}
                  power={power}
                  size="small"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlayerScoreboard;
