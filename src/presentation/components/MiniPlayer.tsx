import React from 'react';
import { useAudio } from '../context/AudioContext';
import { Play, Pause, SkipForward, Disc } from 'lucide-react';

export const MiniPlayer: React.FC = () => {
  const { playbackState, tracks, togglePlay, nextTrack, setActiveScreen } = useAudio();

  const currentTrack = tracks.find((t) => t.id === playbackState.currentTrackId);
  if (!currentTrack) return null;

  const progressPercent = playbackState.duration
    ? (playbackState.currentTime / playbackState.duration) * 100
    : 0;

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent opening full screen
    togglePlay();
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent opening full screen
    nextTrack();
  };

  return (
    <div 
      className="mini-player glass"
      onClick={() => setActiveScreen('player')}
    >
      {/* Top micro progress line */}
      <div 
        className="mini-player-progress-bar" 
        style={{ width: `${progressPercent}%` }}
      ></div>

      {/* Album Art (spinning disc style) */}
      <div className={`track-artwork-wrapper ${playbackState.isPlaying ? 'disc-wrapper playing' : ''}`} style={{ width: 40, height: 40 }}>
        {currentTrack.coverUrl ? (
          <img src={currentTrack.coverUrl} alt="Cover" className="track-artwork" />
        ) : (
          <div className="artwork-placeholder">
            <Disc size={20} className={playbackState.isPlaying ? 'animate-spin' : ''} style={{ animationDuration: '4s' }} />
          </div>
        )}
      </div>

      {/* Title & Artist */}
      <div className="track-info">
        <div className="track-title" style={{ fontSize: '13px' }}>{currentTrack.title}</div>
        <div className="track-artist-album" style={{ fontSize: '10px' }}>{currentTrack.artist}</div>
      </div>

      {/* Controls */}
      <div className="mini-player-controls">
        <button 
          className="mini-control-btn"
          onClick={handlePlayPause}
        >
          {playbackState.isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
        </button>
        <button 
          className="mini-control-btn"
          onClick={handleNext}
        >
          <SkipForward size={18} fill="currentColor" />
        </button>
      </div>
    </div>
  );
};
