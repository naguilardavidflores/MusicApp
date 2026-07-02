import React from 'react';
import { useAudio } from '../context/AudioContext';
import { ArrowUp, ArrowDown, Trash2, Layers } from 'lucide-react';
import type { Track } from '../../domain/entities';
import { Title, Subtitle, BodyText, MutedText } from './ui/Typography';
import { IconButton } from './ui/IconButton';
import { Artwork } from './ui/Artwork';
import { TrackRow } from './ui/TrackRow';

export const QueueScreen: React.FC = () => {
  const {
    playbackState,
    tracks,
    playAll,
    reorderQueue,
    removeFromQueue,
  } = useAudio();

  const currentTrack = tracks.find((t) => t.id === playbackState.currentTrackId);
  const queueTracks = playbackState.queue
    .map((id) => tracks.find((t) => t.id === id))
    .filter((t): t is Track => t !== undefined);

  const handleMoveUp = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (index > 0) {
      reorderQueue(index, index - 1);
    }
  };

  const handleMoveDown = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (index < queueTracks.length - 1) {
      reorderQueue(index, index + 1);
    }
  };

  const handleRemove = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    removeFromQueue(index);
  };

  return (
    <div className="screen-content">
      {/* Header */}
      <div className="screen-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title>Cola de Reproducción</Title>
        <MutedText style={{ fontSize: '11px', fontWeight: 600 }}>
          {queueTracks.length} canciones
        </MutedText>
      </div>

      {queueTracks.length === 0 ? (
        <div className="empty-state" style={{ height: '350px' }}>
          <Layers size={36} style={{ color: 'hsl(var(--text-muted))' }} />
          <Subtitle>Cola vacía</Subtitle>
          <MutedText>Reproduce una canción en la biblioteca o añade canciones a la cola para verlas aquí.</MutedText>
        </div>
      ) : (
        <div>
          {/* Currently Playing Card */}
          {currentTrack && (
            <div style={{ marginBottom: '24px' }}>
              <MutedText style={{ color: 'hsl(var(--accent))', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontSize: '10px' }}>
                Reproduciendo ahora
              </MutedText>
              <div 
                className="glass-card" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px',
                  background: 'linear-gradient(135deg, rgba(29, 185, 84, 0.1) 0%, rgba(18, 18, 18, 0.8) 100%)',
                  border: '1px solid rgba(29, 185, 84, 0.15)',
                  padding: '12px'
                }}
              >
                <Artwork coverUrl={currentTrack.coverUrl} size={44} iconSize={18} />
                <div className="track-info">
                  <BodyText style={{ fontWeight: 700 }}>{currentTrack.title}</BodyText>
                  <MutedText style={{ color: 'rgba(255,255,255,0.6)' }}>{currentTrack.artist}</MutedText>
                </div>
                {playbackState.isPlaying && (
                  <div className="wave-visualizer" style={{ marginRight: '8px' }}>
                    <div className="wave-bar"></div>
                    <div className="wave-bar"></div>
                    <div className="wave-bar"></div>
                    <div className="wave-bar"></div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Next Up Header */}
          <div style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
            <MutedText style={{ fontSize: '10px', color: '#a7a7a7' }}>Siguiente en la cola</MutedText>
          </div>

          {/* List of queue items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {queueTracks.map((track, index) => {
              const isCurrent = index === playbackState.currentIndex;
              if (isCurrent) return null; // Already rendered above

              const rowActions = (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <IconButton
                    disabled={index === 0}
                    style={{ opacity: index === 0 ? 0.3 : 1, width: '28px', height: '28px' }}
                    onClick={(e) => handleMoveUp(e, index)}
                    title="Subir en la cola"
                  >
                    <ArrowUp size={14} />
                  </IconButton>
                  <IconButton
                    disabled={index === queueTracks.length - 1}
                    style={{ opacity: index === queueTracks.length - 1 ? 0.3 : 1, width: '28px', height: '28px' }}
                    onClick={(e) => handleMoveDown(e, index)}
                    title="Bajar en la cola"
                  >
                    <ArrowDown size={14} />
                  </IconButton>
                  <IconButton
                    style={{ color: '#ff4b5c', width: '28px', height: '28px' }}
                    onClick={(e) => handleRemove(e, index)}
                    title="Eliminar de la cola"
                  >
                    <Trash2 size={14} />
                  </IconButton>
                </div>
              );

              return (
                <div key={`${track.id}-${index}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: index < playbackState.currentIndex ? 0.5 : 1 }}>
                  <MutedText style={{ fontSize: '11px', width: '16px', textAlign: 'center' }}>
                    {index + 1}
                  </MutedText>
                  <div style={{ flex: 1 }}>
                    <TrackRow
                      track={track}
                      isCurrent={false}
                      isPlaying={false}
                      onClick={() => playAll(queueTracks, index)}
                      rightAction={rowActions}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
