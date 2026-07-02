import React, { useState, useEffect } from 'react';
import { useAudio } from '../context/AudioContext';
import { Music, ListMusic, ListCollapse, Signal, Wifi, Battery } from 'lucide-react';
import { MiniPlayer } from './MiniPlayer';
import { PlayerScreen } from './PlayerScreen';

export const MobileShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeScreen, setActiveScreen, playbackState } = useAudio();
  const [time, setTime] = useState('');

  // Clock in status bar
  useEffect(() => {
    const updateTime = () => {
      const date = new Date();
      let hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      setTime(`${hours}:${minutes} ${ampm}`);
    };
    updateTime();
    const timerId = setInterval(updateTime, 60000);
    return () => clearInterval(timerId);
  }, []);

  return (
    <div className="device-shell">
      {/* Smartphone Notch */}
      <div className="device-notch"></div>

      {/* Background Decorative Glow Orbs */}
      <div className="ambient-glows">
        <div className="glow-orb glow-orb-1"></div>
        <div className="glow-orb glow-orb-2"></div>
      </div>

      <div className="screen-container">
        {/* Status Bar */}
        <div className="status-bar">
          <div className="time">{time}</div>
          <div className="icons">
            <Signal size={12} strokeWidth={2.5} />
            <Wifi size={12} strokeWidth={2.5} />
            <Battery size={16} strokeWidth={2} />
          </div>
        </div>

        {/* Dynamic Screen Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
          {children}
        </div>

        {/* Floating Mini Player (visible on all screens except when in full-screen player) */}
        {playbackState.currentTrackId && activeScreen !== 'player' && (
          <MiniPlayer />
        )}

        {/* Full Screen Player overlay (slides up) */}
        {activeScreen === 'player' && (
          <PlayerScreen />
        )}

        {/* Navigation Bar */}
        <nav className="tab-navigation">
          <div
            className={`nav-item ${activeScreen === 'library' ? 'active' : ''}`}
            onClick={() => setActiveScreen('library')}
          >
            <Music size={20} />
            <span>Biblioteca</span>
          </div>
          <div
            className={`nav-item ${activeScreen === 'playlists' ? 'active' : ''}`}
            onClick={() => setActiveScreen('playlists')}
          >
            <ListMusic size={20} />
            <span>Listas</span>
          </div>
          <div
            className={`nav-item ${activeScreen === 'queue' ? 'active' : ''}`}
            onClick={() => setActiveScreen('queue')}
          >
            <ListCollapse size={20} />
            <span>Cola</span>
          </div>
        </nav>
      </div>
    </div>
  );
};
