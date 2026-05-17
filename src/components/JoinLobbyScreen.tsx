// src/components/JoinLobbyScreen.tsx
import {useState} from 'react';
import type {ChangeEvent} from 'react';
import './JoinLobbyScreen.css';

export interface JoinLobbyScreenProps {
  onSubmit: (lobbyId: number) => void;
  onBack: () => void;
}

export function JoinLobbyScreen({ onSubmit, onBack }: JoinLobbyScreenProps) {
  const [codeInput, setCodeInput] = useState<string>('');

  function handleChange(e: ChangeEvent<HTMLInputElement>): void {
    // Only allow digits as the user types
    const val = e.target.value;
    if (/^\d*$/.test(val)) {
      setCodeInput(val);
    }
  }

  function handleJoinClick() {
    const numericCode: number = parseInt(codeInput, 10);
    if (isNaN(numericCode) || numericCode < 0) {
      alert('Please enter a valid numeric code.');
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
      />
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
