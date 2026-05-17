import React from 'react';
import './WinCard.css';

export interface WinCardProps {
  /** The element icon (e.g. "🔥", "💧", "🌿") */
  icon: string;

  /** The power value to display in the corners */
  power: number;

  /**
   * Two possible sizes:
   *  - "small"  → 56×56px (used in the scoreboard)
   *  - "large"  → 120×120px (for future round‐end display)
   */
  size?: 'small' | 'large';
}

export const WinCard: React.FC<WinCardProps> = ({
  icon,
  power,
  size = 'small',
}) => {
  return (
    <div className={`win-card ${size}`}>
      {/* Power in top-left */}
      <span className="win-power-top-left">{power}</span>
      {/* Icon centered */}
      <span className="win-icon">{icon}</span>
      {/* Power in bottom-right */}
      <span className="win-power-bottom-right">{power}</span>
    </div>
  );
};

export default WinCard;
