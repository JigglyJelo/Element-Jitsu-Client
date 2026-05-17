// src/App.tsx
import React, { useState, useEffect } from 'react';
import './App.css';
import { getUsername }      from './globals';
import { HomeScreen }       from './components/HomeScreen';
import { JoinLobbyScreen }  from './components/JoinLobbyScreen';
import { LobbyScreen }      from './components/LobbyScreen';
import { GameScreen }       from './components/Game Screen/GameScreen';
import { socket }           from './socket';
import type { PlayerStats } from './types';

type Scene = 'home' | 'join' | 'lobby' | 'game';

export const App: React.FC = () => {
  const [currentScene, setCurrentScene] = useState<Scene>('home');
  const [lobbyId, setLobbyId]           = useState<number | null>(null);

  const [gamePlayers, setGamePlayers] = useState<string[]>([]);

  useEffect(() => {
    // Listen for server’s "gameStarted" broadcast
    const handleGameStarted = (data: {
      lobbyId: number;
      stats: Record<string, PlayerStats>;
      players: string[];
    }) => {
      setLobbyId(data.lobbyId);

      // 'players' is exactly ["hostUsername", "otherUsername"]
      setGamePlayers(data.players);

      // Now that we have both players' names, go to GameScreen
      setCurrentScene('game');
    };

    socket.on('gameStarted', handleGameStarted);
    return () => {
      socket.off('gameStarted', handleGameStarted);
    };
  }, []);

  function joinLobbyAndShow(lid: number) {
    setLobbyId(lid);
    setCurrentScene('lobby');
  }

  return (
    <>
      {currentScene === 'home' && (
        <HomeScreen
          // HomeScreen already emits createLobby → onCreate just navigates
          onCreate={(newLobbyId: number) => {
            joinLobbyAndShow(newLobbyId);
          }}
          onJoin={() => {
            setCurrentScene('join');
          }}
        />
      )}

      {currentScene === 'join' && (
        <JoinLobbyScreen
          onSubmit={(enteredCode: number) => {
            socket.emit(
              'joinLobby',
              { lobbyId: enteredCode, username: getUsername() },
              (res: { success: boolean; error?: string }) => {
                if (!res.success) {
                  alert('Join failed: ' + (res.error || 'Unknown'));
                  return;
                }
                joinLobbyAndShow(enteredCode);
              }
            );
          }}
          onBack={() => {
            setCurrentScene('home');
          }}
        />
      )}

      {currentScene === 'lobby' && lobbyId !== null && (
        <LobbyScreen
          lobbyId={lobbyId}
          onBack={() => {
            socket.emit('leaveLobby');
            setCurrentScene('home');
          }}
          onStartGame={() => {
            setCurrentScene('game');
          }}
        />
      )}

      {currentScene === 'game' && lobbyId !== null && (
        <GameScreen
          lobbyId={lobbyId}
          players={gamePlayers}
          onBack={() => {
            setCurrentScene('lobby');
          }}
        />
      )}
    </>
  );
};

export default App;
