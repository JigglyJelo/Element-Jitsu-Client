// src/components/JoinLobbyScreen.tsx
import { useState } from 'react';
import type { ChangeEvent } from 'react';
import './JoinLobbyScreen.css';

export interface JoinLobbyScreenProps {
  onSubmit: (lobbyId: number) => void;
  onBack: () => void;
}

export function JoinLobbyScreen({ onSubmit, onBack }: JoinLobbyScreenProps) {
  const [codeInput, setCodeInput] = useState<string>('');
  const [error, setError] = useState<string>('');

  function handleChange(e: ChangeEvent<HTMLInputElement>): void {
    // Only allow digits as the user types
    const val = e.target.value;
    if (/^\d*$/.test(val)) {
      setCodeInput(val);
      setError(''); // Clear the error as soon as they type a valid number
    }
  }

  function handleJoinClick() {
    // Prevent empty submissions
    if (!codeInput.trim()) {
      setError('Please enter a lobby code.');
      return;
    }

    const numericCode: number = parseInt(codeInput, 10);
    
    if (isNaN(numericCode) || numericCode < 0) {
      setError('Please enter a valid numeric code.');
      return;
    }
    
    onSubmit(numericCode);
  }

  return (
    <div className="join-wrapper">
      <h2>Enter Lobby Code:</h2>
      
      <input
        type="text"
        value={codeInput}
        onChange={handleChange}
        placeholder="e.g. 1234"
        className="code-input"
        maxLength={6}
      />
      
      {/* Conditionally render the error text if it exists */}
      {error && <div className="error-text">{error}</div>}
      
      <div className="button-row">
        <button className="action-btn" onClick={handleJoinClick}>
          Join
        </button>
        <button className="action-btn" onClick={onBack}>
          Back
        </button>
      </div>
    </div>
  );
}