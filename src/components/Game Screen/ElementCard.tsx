/* src/components/ElementCard.tsx */
import React from 'react';
import type { MoveElement } from '../../types';
import './ElementCard.css';

export interface ElementCardProps {
  /** Which element this card represents: 'fire' | 'water' | 'grass' */
  element: MoveElement;

  /** A human-readable label (e.g. "🔥 Fire" / "💧 Water" / "🌿 Grass") */
  elementLabel: string;

  /** How many points this player currently has for that element */
  availablePoints: number;

  /**
   * The max the slider may go:
   *   sliderMax = min(maxElementalPower, availablePoints).
   * Passed in from GameScreen.tsx.
   */
  sliderMax: number;

  /** Is this card currently “selected” by the user? */
  isSelected: boolean;

  /** If selected, what is the current slider value (0 … sliderMax)? */
  selectedPower: number;

  /** Called when the user clicks on the card to select it */
  onSelect: () => void;

  /** Called when the user drags the slider (only if isSelected) */
  onChangePower: (newVal: number) => void;

  /** Called when the user clicks “Choose” (only if isSelected) */
  onSubmit: () => void;
}

export const ElementCard: React.FC<ElementCardProps> = ({
  elementLabel,
  availablePoints,
  sliderMax,
  isSelected,
  selectedPower,
  onSelect,
  onChangePower,
  onSubmit,
}) => {
  return (
    <div
      className={`element-card ${isSelected ? 'selected' : ''}`}
      onClick={() => {
        if (!isSelected) {
          onSelect();
        }
      }}
    >
      {/* Icon centered */}
      <div className="element-icon-container">
        {/* pull the emoji and the text apart */}
        {(() => {
          const [emoji, ...words] = elementLabel.split(' ')
          return (
            <>
              <span className="element-icon">{emoji}</span>
              <span className="element-name">{words.join(' ')}</span>
            </>
          )
        })()}
      </div>

      {/* Available below the icon */}
      <div className="available-row">
        Available: {availablePoints}
      </div>

      {isSelected && (
        <>
          {/* Desktop: drag-bar */}
          <div className="slider-row">
            <input
              type="range"
              className="element-slider"
              min={0}
              max={sliderMax}
              value={selectedPower}
              onMouseDown={(e) => e.stopPropagation()}
              onChange={(e) => onChangePower(parseInt(e.target.value, 10))}
              disabled={sliderMax <= 0}
            />
            <span className="power-display">
              {selectedPower} / {sliderMax}
            </span>
          </div>

          {/* Mobile: – / + buttons */}
          <div className="mobile-power-controls">
            <button
              className="power-btn"
              onClick={(e) => { e.stopPropagation(); onChangePower(Math.max(0, selectedPower - 1)); }}
              disabled={selectedPower <= 0}
            >
              −
            </button>
            <span className="mobile-power-display">
              {selectedPower}
            </span>
            <button
              className="power-btn"
              onClick={(e) => { e.stopPropagation(); onChangePower(Math.min(sliderMax, selectedPower + 1)); }}
              disabled={selectedPower >= sliderMax}
            >
              +
            </button>
          </div>

          {/* “Choose” button at bottom */}
          <button
            className="choose-button action-btn"
            onClick={(e) => {
              e.stopPropagation();
              onSubmit();
            }}
          >
            Choose
          </button>
        </>
      )}
    </div>
  );
};

export default ElementCard;