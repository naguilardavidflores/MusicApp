import React from 'react';
import { useAudio } from '../context/AudioContext';
import { Play, Pause, SkipForward } from 'lucide-react';
import { Artwork } from './ui/Artwork';
import { IconButton } from './ui/IconButton';
import { BodyText, MutedText } from './ui/Typography';

export const MiniPlayer: React.FC = () => {
  const { playbackState, tracks, togglePlay, nextTrack, setActiveScreen } = useAudio();

  const currentTrack = tracks.find((t) => t.id === playbackState.currentTrackId);
  if (!currentTrack) return null;

  const progressPercent = playbackState.duration
    ? (playbackState.currentTime / playbackState.duration) * 100
    : 0;

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    togglePlay();
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    nextTrack();
  };

  return (
    <div 
      className="mini-player"
      onClick={() => setActiveScreen('player')}
    >
      {/* Top micro progress line */}
      <div 
        className="mini-player-progress-bar" 
        style={{ width: `${progressPercent}%` }}
      ></div>

      {/* Reusable Artwork component */}
      <Artwork coverUrl={currentTrack.coverUrl} size={40} iconSize={16} />

      {/* Title & Artist */}
      <div className="track-info">
        <BodyText style={{ fontSize: '13px', fontWeight: 600 }}>{currentTrack.title}</BodyText>
        <MutedText style={{ fontSize: '10px' }}>{currentTrack.artist}</MutedText>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <IconButton 
          style={{ width: '36px', height: '36px', color: '#fff' }}
          onClick={handlePlayPause}
        >
          {playbackState.isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
        </IconButton>
        <IconButton 
          style={{ width: '36px', height: '36px', color: '#fff' }}
          onClick={handleNext}
        >
          <SkipForward size={18} fill="currentColor" />
        </IconButton>
      </div>
    </div>
  );
};
