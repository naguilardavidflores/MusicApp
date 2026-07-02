import React from 'react';
import { useAudio } from '../context/AudioContext';
import { Music, ListMusic, ListCollapse } from 'lucide-react';
import { MiniPlayer } from './MiniPlayer';
import { PlayerScreen } from './PlayerScreen';

export const MobileShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeScreen, setActiveScreen, playbackState } = useAudio();

  return (
    <div className="app-shell">
      <div className="screen-container">
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

        {/* Navigation Bar (Spotify Style) */}
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
