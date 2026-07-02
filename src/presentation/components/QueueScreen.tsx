import React from 'react';
import { useAudio } from '../context/AudioContext';
import { ArrowUp, ArrowDown, Trash2, Disc, Layers } from 'lucide-react';
import type { Track } from '../../domain/entities';

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
        <h1>Cola de Reproducción</h1>
        <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', fontWeight: 600 }}>
          {queueTracks.length} canciones
        </span>
      </div>

      {queueTracks.length === 0 ? (
        <div className="empty-state" style={{ height: '350px' }}>
          <Layers size={36} style={{ color: 'hsl(var(--text-muted))' }} />
          <h3>Cola vacía</h3>
          <p>Reproduce una canción en la biblioteca o añade canciones a la cola para verlas aquí.</p>
        </div>
      ) : (
        <div>
          {/* Currently Playing Card */}
          {currentTrack && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '11px', color: 'hsl(var(--accent-secondary))', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                Reproduciendo ahora
              </div>
              <div 
                className="glass-card" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px',
                  background: 'linear-gradient(135deg, rgba(138, 92, 246, 0.15) 0%, rgba(20, 23, 38, 0.6) 100%)',
                  border: '1px solid rgba(138, 92, 246, 0.2)'
                }}
              >
                <div className="track-artwork-wrapper" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                  {currentTrack.coverUrl ? (
                    <img src={currentTrack.coverUrl} alt="Cover" className="track-artwork" />
                  ) : (
                    <div className="artwork-placeholder">
                      <Disc size={20} />
                    </div>
                  )}
                </div>
                <div className="track-info">
                  <div className="track-title" style={{ color: '#fff', fontWeight: 700 }}>{currentTrack.title}</div>
                  <div className="track-artist-album" style={{ color: 'rgba(255,255,255,0.6)' }}>{currentTrack.artist}</div>
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
          <div className="queue-header-actions" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            <span>Siguiente en la cola</span>
          </div>

          {/* List of queue items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {queueTracks.map((track, index) => {
              const isCurrent = index === playbackState.currentIndex;
              if (isCurrent) return null; // Already rendered above as currently playing

              return (
                <div
                  key={`${track.id}-${index}`}
                  className="track-item"
                  style={{ opacity: index < playbackState.currentIndex ? 0.5 : 1 }}
                  onClick={() => {
                    // Jump to click index
                    playAll(queueTracks, index);
                  }}
                >
                  <div style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', width: '16px', textAlign: 'center' }}>
                    {index + 1}
                  </div>

                  <div className="track-artwork-wrapper" style={{ width: '36px', height: '36px' }}>
                    {track.coverUrl ? (
                      <img src={track.coverUrl} alt="Cover" className="track-artwork" />
                    ) : (
                      <div className="artwork-placeholder">
                        <Disc size={16} />
                      </div>
                    )}
                  </div>

                  <div className="track-info">
                    <div className="track-title" style={{ fontSize: '13px' }}>{track.title}</div>
                    <div className="track-artist-album" style={{ fontSize: '10px' }}>{track.artist}</div>
                  </div>

                  {/* Move actions & delete button */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button
                      className="mini-control-btn"
                      disabled={index === 0}
                      style={{ opacity: index === 0 ? 0.3 : 1 }}
                      onClick={(e) => handleMoveUp(e, index)}
                      title="Subir en la cola"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      className="mini-control-btn"
                      disabled={index === queueTracks.length - 1}
                      style={{ opacity: index === queueTracks.length - 1 ? 0.3 : 1 }}
                      onClick={(e) => handleMoveDown(e, index)}
                      title="Bajar en la cola"
                    >
                      <ArrowDown size={14} />
                    </button>
                    <button
                      className="mini-control-btn"
                      style={{ color: '#ff4b5c' }}
                      onClick={(e) => handleRemove(e, index)}
                      title="Eliminar de la cola"
                    >
                      <Trash2 size={14} />
                    </button>
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
