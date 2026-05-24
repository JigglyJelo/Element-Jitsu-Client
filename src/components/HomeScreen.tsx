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
  const [error, setError] = useState(''); 

  useEffect(() => {
    socket.emit('leaveLobby');
  }, []);

  function createLobby(): void {
    const trimmedName = localName.trim();
    if (!trimmedName) {
      setError('Please enter a username to play!');
      return;
    }

    setGlobalUsername(trimmedName);

    socket.emit(
      'createLobby',
      trimmedName,
      (response: { success: boolean; lobbyId?: number; error?: string }) => {
        if (!response.success || response.lobbyId === undefined) {
          setError('Could not create lobby: ' + (response.error || 'Unknown error'));
          return;
        }
        onCreate(response.lobbyId);
      }
    );
  }

  function handleJoinClick(): void {
    const trimmedName = localName.trim();
    if (!trimmedName) {
      setError('Please enter a username to join!');
      return;
    }
    setGlobalUsername(trimmedName);
    onJoin();
  }

  return (
    <div className="main-wrapper">
      
      {/* 1. TOP SECTION */}
      <div className="header-section">
        <h1 className="main-title">Element-Jitsu</h1>
        <div className="element-icons">
          <span>🔥</span> 
          <span>💧</span> 
          <span>🌿</span>
        </div>
      </div>

      {/* 2. MIDDLE SECTION */}
      <div className="middle-section">
        <div className="page-wrapper">
          
          <h2 className="card-title">Play now!</h2>
          
          <p className="description-text">
            Master the elements and outsmart your opponents.<br />
            Enter your username below to create a new lobby or join an existing battle!
          </p>

          <input
            type="text"
            value={localName}
            placeholder="Enter username"
            className="username-input"
            maxLength={20} 
            onChange={(e) => {
              setLocalName(e.target.value);
              setError(''); // Smoothly collapses the error when they type
            }}
          />

          {/* Smooth Expanding Error Container */}
          <div className={`error-container ${error ? 'show' : ''}`}>
            <div className="error-text">{error}</div>
          </div>

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

      {/* 3. BOTTOM SECTION */}
      <div className="footer-wrapper">
        <a 
          href="https://github.com/jigglyjelo/element-jitsu-client" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="github-link"
        >
          View on GitHub
        </a>
      </div>

    </div>
  );
}