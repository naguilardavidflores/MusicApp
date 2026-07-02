import React, { useState } from 'react';
import { useAudio } from '../context/AudioContext';
import { ListMusic, Heart, Trash2, Plus, Disc, X, Play, Music, MinusCircle } from 'lucide-react';
import type { Track } from '../../domain/entities';

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

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  // Sub-browsing: Selected Playlist details view
  if (selectedPlaylistId && activePlaylist) {
    const playlistTracks = getPlaylistTracks(selectedPlaylistId);

    return (
      <div className="screen-content">
        <div className="screen-header" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="player-btn" onClick={() => setSelectedPlaylistId(null)} style={{ width: '36px', height: '36px' }}>
            ←
          </button>
          <h1 style={{ fontSize: '20px', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {activePlaylist.name}
          </h1>
          {!activePlaylist.isSystem && (
            <button
              className="player-btn"
              style={{ color: '#ff4b5c', border: '1px solid rgba(255, 75, 92, 0.2)', width: '36px', height: '36px' }}
              onClick={() => deletePlaylist(activePlaylist.id)}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>

        {/* Play all button if playlist has tracks */}
        {playlistTracks.length > 0 ? (
          <button
            className="scan-btn-label"
            style={{ width: '100%', justifyContent: 'center', marginBottom: '20px' }}
            onClick={() => playAll(playlistTracks, 0)}
          >
            <Play size={16} fill="currentColor" /> Reproducir Todo
          </button>
        ) : (
          <div className="empty-state">
            <Music size={32} />
            <h3>Lista vacía</h3>
            <p>Añade canciones a esta lista desde la biblioteca usando el botón "+" en las canciones.</p>
          </div>
        )}

        {/* Track Rows */}
        {playlistTracks.map((track, idx) => {
          const isPlaying = playbackState.currentTrackId === track.id;
          return (
            <div
              key={track.id}
              className={`track-item ${isPlaying ? 'playing' : ''}`}
              onClick={() => playAll(playlistTracks, idx)}
            >
              <div className="track-artwork-wrapper">
                {track.coverUrl ? (
                  <img src={track.coverUrl} alt="Artwork" className="track-artwork" />
                ) : (
                  <div className="artwork-placeholder">
                    {isPlaying && playbackState.isPlaying ? (
                      <div className="wave-visualizer">
                        <div className="wave-bar"></div>
                        <div className="wave-bar"></div>
                        <div className="wave-bar"></div>
                        <div className="wave-bar"></div>
                      </div>
                    ) : (
                      <Disc size={20} />
                    )}
                  </div>
                )}
              </div>

              <div className="track-info">
                <div className="track-title">{track.title}</div>
                <div className="track-artist-album">{track.artist}</div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  className="mini-control-btn"
                  style={{ color: '#ff4b5c' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTrackFromPlaylist(activePlaylist.id, track.id);
                  }}
                  title="Eliminar de la lista"
                >
                  <MinusCircle size={16} />
                </button>
                <span className="track-duration">{formatDuration(track.duration)}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="screen-content">
      {/* Playlists lists view header */}
      <div className="playlist-header-action">
        <h1 style={{ fontFamily: 'var(--font-title)', fontSize: '26px', fontWeight: 700 }}>Mis Listas</h1>
        <button onClick={() => setShowCreateModal(true)}>
          <Plus size={14} /> Nueva Lista
        </button>
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
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#fff' }}>{pl.name}</h3>
                <p style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>
                  {pTracks.length} {pTracks.length === 1 ? 'canción' : 'canciones'}
                </p>
              </div>

              {!pl.isSystem && (
                <button
                  className="mini-control-btn"
                  style={{ color: 'hsl(var(--text-muted))' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    deletePlaylist(pl.id);
                  }}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal Dialog for New Playlist (Modern aesthetic overlay) */}
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
              background: '#0e1017',
              boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Crear Lista</h3>
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: 'hsl(var(--text-muted))', cursor: 'pointer' }}
                onClick={() => setShowCreateModal(false)}
              >
                <X size={16} />
              </button>
            </div>
            
            <input
              type="text"
              className="search-input"
              style={{ paddingLeft: '14px', marginBottom: '16px' }}
              placeholder="Nombre de la lista"
              autoFocus
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
            />

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="tab-btn"
                style={{ background: 'rgba(255,255,255,0.04)' }}
                onClick={() => setShowCreateModal(false)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="scan-btn-label"
                style={{ padding: '8px 16px', fontSize: '11px', flex: 1, borderRadius: '10px', boxShadow: 'none' }}
              >
                Crear
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
