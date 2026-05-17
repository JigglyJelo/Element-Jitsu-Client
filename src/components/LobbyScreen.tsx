// src/components/LobbyScreen.tsx
import { useEffect, useState } from 'react';
import { getUsername } from '../globals';
import { socket } from '../socket';
import './LobbyScreen.css';
import type { LobbySettings, LobbyUpdatePayload } from '../types';

export interface LobbyScreenProps {
  lobbyId: number;
  onBack: () => void;
  onStartGame: () => void;
}

interface LobbyReadyPayload {
  ready: string[];
}

export function LobbyScreen({ lobbyId, onBack, onStartGame }: LobbyScreenProps) {
  const username = getUsername();
  const [members, setMembers] = useState<string[]>([]);
  const [host, setHost] = useState<string>('');
  const [readyPlayers, setReadyPlayers] = useState<string[]>([]);
  const [canStart, setCanStart] = useState<boolean>(false);

  // Local copy of lobbySettings (updated whenever we get a new "lobbyUpdate")
  const [lobbySettings, setLobbySettings] = useState<LobbySettings | null>(null);

  useEffect(() => {
    // STEP A: join lobby & signal “ready”
    socket.emit(
      'joinLobby',
      { lobbyId, username },
      (response: { success: boolean; error?: string }) => {
        if (!response.success) {
          alert('Could not join lobby: ' + (response.error || 'Unknown'));
          onBack();
          return;
        }
        socket.emit('playerReady', (res: { success: boolean; error?: string }) => {
          if (!res.success) {
            console.warn('playerReady error:', res.error || 'unknown');
          }
        });
      }
    );

    // STEP B: listen for lobbyUpdate (members + host + lobbySettings)
    const handleLobbyUpdate = (payload: LobbyUpdatePayload) => {
      setMembers(payload.members);
      setHost(payload.host);
      setLobbySettings(payload.lobbySettings); // ← pull in the updated settings
      // Recompute canStart here—(we also do it in the next useEffect)
      setCanStart(
        payload.members.length === 2 &&
          payload.host === username &&
          readyPlayers.length === payload.members.length
      );
    };
    socket.on('lobbyUpdate', handleLobbyUpdate);

    // STEP C: listen for lobbyReadyUpdate
    const handleLobbyReady = (payload: LobbyReadyPayload) => {
      setReadyPlayers(payload.ready);
      setCanStart(
        members.length === 2 &&
          host === username &&
          payload.ready.length === members.length
      );
    };
    socket.on('lobbyReadyUpdate', handleLobbyReady);

    return () => {
      socket.off('lobbyUpdate', handleLobbyUpdate);
      socket.off('lobbyReadyUpdate', handleLobbyReady);
    };
  }, [lobbyId, username, onBack, members.length, host, readyPlayers.length]);

  // Whenever members, host, or readyPlayers changes, recompute canStart:
  useEffect(() => {
    setCanStart(
      members.length === 2 &&
        host === username &&
        readyPlayers.length === members.length
    );
  }, [members, host, readyPlayers, username]);

  // ───────────────────────────────────────────────────────────────────────────────
  // New: rather than computing newVal in the client, we ask the server to bump +1 or –1
  function updateSetting<Field extends keyof LobbySettings>(
    field: Field,
    delta: number
  ): void {
    if (!lobbySettings) return;

    // Tell the server: “host, please add delta to lobbySettings[field], clamp it to 1–99.”
    socket.emit(
      'changeLobbySetting',
      { field, delta },
      (res: { success: boolean; error?: string }) => {
        if (!res.success) {
          alert('Could not update setting: ' + (res.error || 'Unknown'));
        }
        // On success, server will broadcast "lobbyUpdate" with the updated lobbySettings.
      }
    );
  }

  function handleLeave() {
    socket.emit('leaveLobby');
    onBack();
  }

  function handleStart() {
    socket.emit('startGame', (res: { success: boolean; error?: string }) => {
      if (!res.success) {
        alert('Cannot start: ' + (res.error || 'Unknown'));
      } else {
        onStartGame();
      }
    });
  }

  return (
    <div className="lobby-screen">
      <h2>Lobby Code: {lobbyId}</h2>
      <p>
        Logged in as: {username} {host === username && '(host)'}
      </p>

      <h3>Members:</h3>
      <ul>
        {members.map((m) => (
          <li key={m}>
            {m} {m === host && '(host)'}{' '}
            {readyPlayers.includes(m) && <span>✅</span>}
          </li>
        ))}
      </ul>

      {/* ─── SETTINGS PANEL ─────────────────────────────────────────────────────── */}
      {lobbySettings && (
        <div className="settings-panel">
          <h3>Lobby Settings:</h3>

          {/* startingElementPoints */}
          <div className="setting-row">
            <span>Starting Element Points:</span>
            {host === username ? (
              <>
                <button
                  className="small-btn"
                  onClick={() => updateSetting('startingElementPoints', -1)}
                >
                  –
                </button>
                <span className="setting-value">
                  {lobbySettings.startingElementPoints}
                </span>
                <button
                  className="small-btn"
                  onClick={() => updateSetting('startingElementPoints', +1)}
                >
                  +
                </button>
              </>
            ) : (
              <span className="setting-value">
                {lobbySettings.startingElementPoints}
              </span>
            )}
          </div>

          {/* duplicatesToWin */}
          <div className="setting-row">
            <span>Duplicates to Win:</span>
            {host === username ? (
              <>
                <button
                  className="small-btn"
                  onClick={() => updateSetting('duplicatesToWin', -1)}
                >
                  –
                </button>
                <span className="setting-value">
                  {lobbySettings.duplicatesToWin}
                </span>
                <button
                  className="small-btn"
                  onClick={() => updateSetting('duplicatesToWin', +1)}
                >
                  +
                </button>
              </>
            ) : (
              <span className="setting-value">
                {lobbySettings.duplicatesToWin}
              </span>
            )}
          </div>

          {/* uniqueElementsToWin */}
          <div className="setting-row">
            <span>Unique Elements to Win:</span>
            {host === username ? (
              <>
                <button
                  className="small-btn"
                  onClick={() => updateSetting('uniqueElementsToWin', -1)}
                >
                  –
                </button>
                <span className="setting-value">
                  {lobbySettings.uniqueElementsToWin}
                </span>
                <button
                  className="small-btn"
                  onClick={() => updateSetting('uniqueElementsToWin', +1)}
                >
                  +
                </button>
              </>
            ) : (
              <span className="setting-value">
                {lobbySettings.uniqueElementsToWin}
              </span>
            )}
          </div>

          {/* maxElementalPower */}
          <div className="setting-row">
            <span>Max Elemental Power:</span>
            {host === username ? (
              <>
                <button
                  className="small-btn"
                  onClick={() => updateSetting('maxElementalPower', -1)}
                >
                  –
                </button>
                <span className="setting-value">
                  {lobbySettings.maxElementalPower}
                </span>
                <button
                  className="small-btn"
                  onClick={() => updateSetting('maxElementalPower', +1)}
                >
                  +
                </button>
              </>
            ) : (
              <span className="setting-value">
                {lobbySettings.maxElementalPower}
              </span>
            )}
          </div>

          {/* maxStoredPower */}
          <div className="setting-row">
            <span>Max Stored Power:</span>
            {host === username ? (
              <>
                <button
                  className="small-btn"
                  onClick={() => updateSetting('maxStoredPower', -1)}
                >
                  –
                </button>
                <span className="setting-value">
                  {lobbySettings.maxStoredPower}
                </span>
                <button
                  className="small-btn"
                  onClick={() => updateSetting('maxStoredPower', +1)}
                >
                  +
                </button>
              </>
            ) : (
              <span className="setting-value">
                {lobbySettings.maxStoredPower}
              </span>
            )}
          </div>

          {/* overchargeBonus */}
          <div className="setting-row">
            <span>Overcharge Bonus:</span>
            {host === username ? (
              <>
                <button
                  className="small-btn"
                  onClick={() => updateSetting('overchargeBonus', -1)}
                >
                  –
                </button>
                <span className="setting-value">
                  {lobbySettings.overchargeBonus}
                </span>
                <button
                  className="small-btn"
                  onClick={() => updateSetting('overchargeBonus', +1)}
                >
                  +
                </button>
              </>
            ) : (
              <span className="setting-value">
                {lobbySettings.overchargeBonus}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ─── Start Game & Leave Lobby Buttons ─────────────────────── */}
      {canStart && (
        <button className="action-btn" onClick={handleStart}>
          Start Game
        </button>
      )}
      <button className="action-btn" onClick={handleLeave}>
        Leave Lobby
      </button>
    </div>
  );
}
