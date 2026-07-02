import React from 'react';
import type { Track } from '../../../domain/entities';
import { Artwork } from './Artwork';
import { BodyText, MutedText } from './Typography';

interface TrackRowProps {
  track: Track;
  isCurrent: boolean;
  isPlaying: boolean;
  onClick: () => void;
  rightAction?: React.ReactNode;
}

export const TrackRow: React.FC<TrackRowProps> = ({
  track,
  isCurrent,
  isPlaying,
  onClick,
  rightAction
}) => {
  const formatDuration = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className={`track-item ${isCurrent ? 'playing' : ''}`} onClick={onClick}>
      <Artwork coverUrl={track.coverUrl} size={48} iconSize={20} />
      
      <div className="track-info">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BodyText 
            className="track-title" 
            style={{ 
              color: isCurrent ? 'hsl(var(--accent))' : '#fff',
              fontSize: '14px',
              fontWeight: 600,
              flex: 1
            }}
          >
            {track.title}
          </BodyText>
          {isCurrent && isPlaying && (
            <div className="wave-visualizer" style={{ marginBottom: '2px' }}>
              <div className="wave-bar"></div>
              <div className="wave-bar"></div>
              <div className="wave-bar"></div>
              <div className="wave-bar"></div>
            </div>
          )}
        </div>
        <MutedText className="track-artist-album">
          {track.artist} • {track.album}
        </MutedText>
      </div>
      
      {rightAction ? (
        <div onClick={(e) => e.stopPropagation()}>{rightAction}</div>
      ) : (
        <MutedText className="track-duration" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {formatDuration(track.duration)}
        </MutedText>
      )}
    </div>
  );
};
