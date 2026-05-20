// src/components/HomeScreen.tsx
import { useState, useEffect } from 'react';
import { setUsername as setGlobalUsername, getUsername } from '../globals';
import { socket } from '../socket'; 
import './HomeScreen.css';

export interface HomeScreenProps {
  onCreate: (lobbyId: number) => void;
  onJoin: () => void;
}

export function HomeScreen({ onCreate, onJoin }: HomeScreenProps) {
  const [localName, setLocalName] = useState(getUsername() || '');

  // Auto-cleanup if they used the browser Back button to get here
  useEffect(() => {
    socket.emit('leaveLobby');
  }, []);

  function createLobby(): void {
    const trimmedName = localName.trim();
    if (!trimmedName) {
      alert('Please enter a username');
      return;
    }

    // Save it to your globals right before emitting
    setGlobalUsername(trimmedName);

    socket.emit(
      'createLobby',
      trimmedName,
      (response: { success: boolean; lobbyId?: number; error?: string }) => {
        if (!response.success || response.lobbyId === undefined) {
          alert('Could not create lobby: ' + (response.error || 'Unknown error'));
          return;
        }
        onCreate(response.lobbyId);
      }
    );
  }

  // Ensure Join also saves the username to globals if they typed one before clicking
  function handleJoinClick(): void {
    const trimmedName = localName.trim();
    if (trimmedName) {
      setGlobalUsername(trimmedName);
    }
    onJoin();
  }

  return (
    <div className="main-wrapper">
      <h1>Element-Jitsu</h1>

      <div className="page-wrapper">
        <input
          type="text"
          value={localName}
          placeholder="Enter username"
          className="username-input"
          maxLength={20} // Match server-side length
          onChange={(e) => setLocalName(e.target.value)}
        />

        <div className="button-row">
          <button className="action-btn" onClick={createLobby}>
            Create Lobby
          </button>
          <button className="action-btn" onClick={handleJoinClick}>
            Join Lobby
          </button>
        </div>
      </div>
    </div>
  );
}