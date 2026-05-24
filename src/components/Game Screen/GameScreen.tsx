// ───────────────────────────────────────────────────────────────────────────────
// GameScreen.tsx
// ───────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import PlayerScoreboard from './PlayerScoreboard';
import './GameScreen.css';
import { useGameScreenLogic } from './GameScreenLogic';
import ElementCard from './ElementCard';
import WinCard from './WinCard'; // your large-card component

export interface GameScreenProps {
  lobbyId: number;
  onBack: () => void;
  players: string[]; // exactly two usernames: [hostUsername, otherUsername]
}

export function GameScreen({ lobbyId, onBack, players }: GameScreenProps) {
  const {
    username,
    lobbySettings,
    phase,
    opponentName,
    yourStats,
    oppStats,
    selectedElement,
    selectedPower,
    chosenCards,
    hasPicked,
    labelElement,
    submitMove,
    selectElement,
    changePower,
    gameOverResult,
    gameOverMessage,
    revealTextVisible, // ← the flag for delayed text when both cards are present
  } = useGameScreenLogic(lobbyId, players);

  // Compute whether opponent has clicked “Choose” (use hasPicked, not chosenCards)
  const oppHasChosen = Boolean(opponentName && hasPicked[opponentName]);
  // Compute whether you have clicked “Choose”
  const youHaveChosen = Boolean(hasPicked[username]);

  // Grab “myCard” and “oppCard” out of chosenCards; these will be null if no one has picked.
  const myCard = chosenCards[username];
  const oppCard = opponentName ? chosenCards[opponentName] : null;

  // Decide what header to show in the reveal phase
  let revealHeaderText = '';
  if (phase === 'reveal') {
    if (!myCard && oppCard) {
      revealHeaderText = 'Waiting for your choice…';
    } else if (myCard && !oppCard) {
      revealHeaderText = 'Waiting for opponent…';
    } else if (myCard && oppCard) {
      const { element: e1, power: p1 } = myCard!;
      const { element: e2, power: p2 } = oppCard!;
      if (e1 === e2) {
        revealHeaderText = p1 === p2 ? 'Draw!' : p1 > p2 ? 'You won that round!' : 'You lost that round.';
      } else if (
        (e1 === 'fire' && e2 === 'grass') ||
        (e1 === 'grass' && e2 === 'water') ||
        (e1 === 'water' && e2 === 'fire')
      ) {
        revealHeaderText = 'You won that round!';
      } else {
        revealHeaderText = 'You lost that round.';
      }
    }
  }

  // ───────────────────────────────────────────────────────────────────────────────
  // FLIP ANIMATION STATE FOR OPPONENT’S CARD (unchanged)
  const [flipOppCard, setFlipOppCard] = useState(false);

  useEffect(() => {
    if (phase === 'reveal' && oppCard) {
      // First show “?” on back face, then flip to front face a tick later
      setFlipOppCard(false);
      const t = setTimeout(() => setFlipOppCard(true), 50);
      return () => clearTimeout(t);
    } else {
      setFlipOppCard(false);
    }
  }, [phase, oppCard]);
  // ───────────────────────────────────────────────────────────────────────────────

  // If lobbySettings aren’t loaded yet, show a loading state
  if (phase === 'pick' && !lobbySettings) {
    return (
      <div className="game-screen">
        <p>Loading settings…</p>
      </div>
    );
  }

  return (
    <div className="game-screen">
      {/* ─── Two Scoreboards at the Top ─── */}
      <PlayerScoreboard
        username={username}
        stats={yourStats}
        startingPoints={lobbySettings?.maxStoredPower ?? 0}
        winGoal={lobbySettings?.duplicatesToWin ?? 0}
        alignment="left"
      />
      <PlayerScoreboard
        username={opponentName || 'Waiting...'}
        stats={oppStats}
        startingPoints={lobbySettings?.maxStoredPower ?? 0}
        winGoal={lobbySettings?.duplicatesToWin ?? 0}
        alignment="right"
      />

      {/* ─── PHASE-SPECIFIC HEADER & Pick Controls ─── */}
      {phase === 'pick' && lobbySettings && (
        <>
          <h2>
            {youHaveChosen && !oppHasChosen
              ? "Waiting for opponent’s choice"
              : !youHaveChosen && oppHasChosen
              ? 'Opponent has chosen—pick your card!'
              : 'Choose Element & Power'}
          </h2>

          <div className="element-card-container">
            {/* 🔥 Fire Card */}
            <ElementCard
              element="fire"
              elementLabel="🔥 Fire"
              availablePoints={yourStats.firePoints}
              sliderMax={Math.min(lobbySettings.maxElementalPower, yourStats.firePoints)}
              isSelected={selectedElement === 'fire'}
              selectedPower={selectedPower}
              onSelect={() => selectElement('fire')}
              onChangePower={(val) => changePower(val)}
              onSubmit={() => submitMove({ element: 'fire', power: selectedPower })}
            />

            {/* 💧 Water Card */}
            <ElementCard
              element="water"
              elementLabel="💧 Water"
              availablePoints={yourStats.waterPoints}
              sliderMax={Math.min(lobbySettings.maxElementalPower, yourStats.waterPoints)}
              isSelected={selectedElement === 'water'}
              selectedPower={selectedPower}
              onSelect={() => selectElement('water')}
              onChangePower={(val) => changePower(val)}
              onSubmit={() => submitMove({ element: 'water', power: selectedPower })}
            />

            {/* 🌿 Grass Card */}
            <ElementCard
              element="grass"
              elementLabel="🌿 Grass"
              availablePoints={yourStats.grassPoints}
              sliderMax={Math.min(lobbySettings.maxElementalPower, yourStats.grassPoints)}
              isSelected={selectedElement === 'grass'}
              selectedPower={selectedPower}
              onSelect={() => selectElement('grass')}
              onChangePower={(val) => changePower(val)}
              onSubmit={() => submitMove({ element: 'grass', power: selectedPower })}
            />
          </div>
        </>
      )}

      {/* ─── DELAYED/CONDITIONAL REVEAL HEADER ─── */}
      {phase === 'reveal' && (
        <>
          {/* If only one card is present, show immediately */}
          {(myCard && !oppCard) || (!myCard && oppCard) ? (
            <h2>{revealHeaderText}</h2>
          ) : null}

          {/* If both cards are present, wait for revealTextVisible */}
          {myCard && oppCard && revealTextVisible && (
            <h2>{revealHeaderText}</h2>
          )}
        </>
      )}

      {/* ─── REVEAL CONTAINER (always visible during pick & reveal) ─── */}
      {(phase === 'pick' || phase === 'reveal') && (
        <div className="reveal-container">
          {/* Left Slot: YOUR card or placeholder */}
          <div className="reveal-slot">
            {myCard ? (
              <WinCard icon={labelElement(myCard.element)} power={myCard.power} size="large" />
            ) : (
              <div className="win-card-placeholder" />
            )}
          </div>

          {/* Right Slot: OPPONENT with conditional flip */}
          <div className="reveal-slot">
            {phase === 'pick' ? (
              // In pick-phase: show “?” if oppHasChosen, else blank placeholder
              oppHasChosen ? (
                <div className="win-card-placeholder placeholder-with-question">
                  <span className="question-mark">?</span>
                </div>
              ) : (
                <div className="win-card-placeholder" />
              )
            ) : (
              // phase === 'reveal'
              // Only flip if oppCard exists; otherwise show blank placeholder
              oppCard ? (
                <div className="flip-card">
                  <div className={`flip-card-inner ${flipOppCard ? 'flipped' : ''}`}>
                    <div className="flip-card-face flip-card-back">
                      {/* BACK FACE = “?” placeholder */}
                      <div className="win-card-placeholder placeholder-with-question">
                        <span className="question-mark">?</span>
                      </div>
                    </div>
                    <div className="flip-card-face flip-card-front">
                      {/* FRONT FACE = actual WinCard */}
                      <WinCard
                        icon={labelElement(oppCard.element)}
                        power={oppCard.power}
                        size="large"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="win-card-placeholder" />
              )
            )}
          </div>
        </div>
      )}

      {/* ─── PHASE: gameOver ─── */}
      {phase === 'gameOver' && gameOverResult && (
        <div className="game-screen">
          <h2>{gameOverMessage}</h2>
          <h3>Final Stats</h3>
          <div className="stats-container">
            <div className="player-stats">
              <h4>{username}:</h4>
              <ul>
                <li>
                  🔥 Fire Wins: {gameOverResult.stats[username].fireWinPowers.length} • Points:{' '}
                  {gameOverResult.stats[username].firePoints}
                </li>
                <li>
                  💧 Water Wins: {gameOverResult.stats[username].waterWinPowers.length} • Points:{' '}
                  {gameOverResult.stats[username].waterPoints}
                </li>
                <li>
                  🌿 Grass Wins: {gameOverResult.stats[username].grassWinPowers.length} • Points:{' '}
                  {gameOverResult.stats[username].grassPoints}
                </li>
              </ul>
            </div>
            <div className="player-stats">
              <h4>{opponentName}:</h4>
              <ul>
                <li>
                  🔥 Fire Wins: {gameOverResult.stats[opponentName!].fireWinPowers.length} • Points:{' '}
                  {gameOverResult.stats[opponentName!].firePoints}
                </li>
                <li>
                  💧 Water Wins: {gameOverResult.stats[opponentName!].waterWinPowers.length} • Points:{' '}
                  {gameOverResult.stats[opponentName!].waterPoints}
                </li>
                <li>
                  🌿 Grass Wins: {gameOverResult.stats[opponentName!].grassWinPowers.length} • Points:{' '}
                  {gameOverResult.stats[opponentName!].grassPoints}
                </li>
              </ul>
            </div>
          </div>
          <button className="action-btn return-btn" onClick={onBack}>
            Return to Lobby
          </button>
        </div>
      )}
    </div>
  );
}

export default GameScreen;
