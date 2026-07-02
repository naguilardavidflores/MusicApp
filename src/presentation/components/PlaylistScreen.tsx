import React, { useState } from 'react';
import { useAudio } from '../context/AudioContext';
import { ListMusic, Heart, Trash2, Plus, X, Play, Music, MinusCircle } from 'lucide-react';
import type { Track } from '../../domain/entities';
import { Title, Subtitle, MutedText } from './ui/Typography';
import { Button } from './ui/Button';
import { IconButton } from './ui/IconButton';
import { TrackRow } from './ui/TrackRow';

export const PlaylistScreen: React.FC = () => {
  const {
    playlists,
    tracks,
    playbackState,
    selectedPlaylistId,
    createPlaylist,
    deletePlaylist,
    setSelectedPlaylistId,
    removeTrackFromPlaylist,
    playAll,
  } = useAudio();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const activePlaylist = playlists.find((p) => p.id === selectedPlaylistId);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlaylistName.trim()) {
      await createPlaylist(newPlaylistName);
      setNewPlaylistName('');
      setShowCreateModal(false);
    }
  };

  const getPlaylistTracks = (playlistId: string): Track[] => {
    const pl = playlists.find((p) => p.id === playlistId);
    if (!pl) return [];
    return pl.trackIds
      .map((id) => tracks.find((t) => t.id === id))
      .filter((t): t is Track => t !== undefined);
  };

  // Sub-browsing: Selected Playlist details view
  if (selectedPlaylistId && activePlaylist) {
    const playlistTracks = getPlaylistTracks(selectedPlaylistId);

    return (
      <div className="screen-content">
        <div className="screen-header" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <IconButton onClick={() => setSelectedPlaylistId(null)} style={{ color: '#fff' }}>
            ←
          </IconButton>
          <Title style={{ fontSize: '20px', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {activePlaylist.name}
          </Title>
          {!activePlaylist.isSystem && (
            <IconButton
              style={{ color: '#ff4b5c', border: '1px solid rgba(255, 75, 92, 0.2)', borderRadius: '50%' }}
              onClick={() => deletePlaylist(activePlaylist.id)}
            >
              <Trash2 size={16} />
            </IconButton>
          )}
        </div>

        {/* Play all button if playlist has tracks */}
        {playlistTracks.length > 0 ? (
          <Button
            variant="primary"
            style={{ width: '100%', marginBottom: '20px' }}
            onClick={() => playAll(playlistTracks, 0)}
          >
            <Play size={16} fill="currentColor" /> Reproducir Todo
          </Button>
        ) : (
          <div className="empty-state">
            <Music size={32} />
            <Subtitle>Lista vacía</Subtitle>
            <MutedText>Añade canciones a esta lista desde la biblioteca usando el botón "+" en las canciones.</MutedText>
          </div>
        )}

        {/* Reusable Track Rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {playlistTracks.map((track, idx) => {
            const isPlaying = playbackState.currentTrackId === track.id;
            
            const removeAction = (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IconButton
                  style={{ color: '#ff4b5c', width: '32px', height: '32px', padding: 0 }}
                  onClick={() => removeTrackFromPlaylist(activePlaylist.id, track.id)}
                  title="Eliminar de la lista"
                >
                  <MinusCircle size={16} />
                </IconButton>
                <MutedText style={{ fontVariantNumeric: 'tabular-nums', fontSize: '12px' }}>
                  {(() => {
                    const mins = Math.floor(track.duration / 60);
                    const secs = Math.floor(track.duration % 60).toString().padStart(2, '0');
                    return `${mins}:${secs}`;
                  })()}
                </MutedText>
              </div>
            );

            return (
              <TrackRow
                key={track.id}
                track={track}
                isCurrent={isPlaying}
                isPlaying={playbackState.isPlaying}
                onClick={() => playAll(playlistTracks, idx)}
                rightAction={removeAction}
              />
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="screen-content">
      {/* Playlists lists view header */}
      <div className="playlist-header-action">
        <Title>Mis Listas</Title>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus size={14} /> Nueva Lista
        </Button>
      </div>

      {/* Playlist Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {playlists.map((pl) => {
          const isFav = pl.isSystem && pl.id === 'favorites';
          const pTracks = getPlaylistTracks(pl.id);

          return (
            <div
              key={pl.id}
              className="glass-card"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                cursor: 'pointer',
                borderLeft: isFav ? '4px solid #ff4b72' : '4px solid hsl(var(--accent))',
                padding: '16px',
              }}
              onClick={() => setSelectedPlaylistId(pl.id)}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  background: isFav
                    ? 'linear-gradient(135deg, #ff4b72 0%, #ff809b 100%)'
                    : 'linear-gradient(135deg, hsl(var(--accent)) 0%, hsl(var(--accent-glow)) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                }}
              >
                {isFav ? <Heart size={20} fill="#fff" /> : <ListMusic size={20} />}
              </div>

              <div style={{ flex: 1 }}>
                <Subtitle style={{ fontSize: '15px' }}>{pl.name}</Subtitle>
                <MutedText style={{ marginTop: '2px' }}>
                  {pTracks.length} {pTracks.length === 1 ? 'canción' : 'canciones'}
                </MutedText>
              </div>

              {!pl.isSystem && (
                <IconButton
                  style={{ color: 'hsl(var(--text-muted))', width: '32px', height: '32px' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    deletePlaylist(pl.id);
                  }}
                  title="Eliminar lista"
                >
                  <Trash2 size={16} />
                </IconButton>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal Dialog for New Playlist */}
      {showCreateModal && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
            padding: '24px',
          }}
        >
          <form
            onSubmit={handleCreate}
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '300px',
              padding: '20px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: '#181818',
              boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <Subtitle>Nueva Lista</Subtitle>
              <IconButton 
                type="button" 
                style={{ width: '28px', height: '28px' }} 
                onClick={() => setShowCreateModal(false)}
              >
                <X size={16} />
              </IconButton>
            </div>
            <input
              type="text"
              className="search-input"
              placeholder="Nombre de la lista"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              autoFocus
              style={{ marginBottom: '16px', background: '#282828' }}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <Button type="button" variant="secondary" onClick={() => setShowCreateModal(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="accent">
                Crear
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
