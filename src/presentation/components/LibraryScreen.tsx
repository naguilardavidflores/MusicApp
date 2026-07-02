import React, { useState } from 'react';
import { useAudio } from '../context/AudioContext';
import type { Track } from '../../domain/entities';
import { Search, Folder, User, Disc, Upload, Trash2, Plus, Clock, CornerDownRight, Heart } from 'lucide-react';

export const LibraryScreen: React.FC = () => {
  const {
    tracks,
    playlists,
    playbackState,
    activeTab,
    searchQuery,
    isScanning,
    setActiveTab,
    setSearchQuery,
    scanDirectory,
    clearLibrary,
    playAll,
    addToQueue,
    playNext,
    toggleFavorite,
  } = useAudio();

  // Internal browsing states for Artists, Albums, and Folders
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [showOptionsTrackId, setShowOptionsTrackId] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await scanDirectory(e.target.files);
    }
  };

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  // 1. Filtering logic based on search
  const filteredTracks = tracks.filter((track) => {
    const query = searchQuery.toLowerCase();
    return (
      track.title.toLowerCase().includes(query) ||
      track.artist.toLowerCase().includes(query) ||
      track.album.toLowerCase().includes(query)
    );
  });

  // Check if current track is in Favorites
  const isTrackFavorite = (trackId: string) => {
    const favPlaylist = playlists.find((p) => p.isSystem && p.id === 'favorites');
    return favPlaylist ? favPlaylist.trackIds.includes(trackId) : false;
  };

  // 2. Classifications (Artists, Albums, Folders)
  const uniqueArtists = Array.from(new Set(tracks.map((t) => t.artist))).sort();
  const uniqueAlbums = Array.from(new Set(tracks.map((t) => t.album))).sort();
  const uniqueFolders = Array.from(new Set(tracks.map((t) => t.parentFolder))).sort();

  // Sub-browsing renders
  if (selectedArtist) {
    const artistTracks = tracks.filter((t) => t.artist === selectedArtist);
    return (
      <div className="screen-content">
        <div className="screen-header" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="player-btn" onClick={() => setSelectedArtist(null)} style={{ width: '36px', height: '36px' }}>
            ←
          </button>
          <h1 style={{ fontSize: '20px' }}>{selectedArtist}</h1>
        </div>
        <div style={{ marginBottom: '16px', fontSize: '12px', color: 'hsl(var(--text-muted))' }}>
          {artistTracks.length} canciones
        </div>
        {renderTrackList(artistTracks)}
      </div>
    );
  }

  if (selectedAlbum) {
    const albumTracks = tracks.filter((t) => t.album === selectedAlbum);
    return (
      <div className="screen-content">
        <div className="screen-header" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="player-btn" onClick={() => setSelectedAlbum(null)} style={{ width: '36px', height: '36px' }}>
            ←
          </button>
          <h1 style={{ fontSize: '20px' }}>{selectedAlbum}</h1>
        </div>
        <div style={{ marginBottom: '16px', fontSize: '12px', color: 'hsl(var(--text-muted))' }}>
          {albumTracks.length} canciones
        </div>
        {renderTrackList(albumTracks)}
      </div>
    );
  }

  if (selectedFolder) {
    const folderTracks = tracks.filter((t) => t.parentFolder === selectedFolder);
    return (
      <div className="screen-content">
        <div className="screen-header" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="player-btn" onClick={() => setSelectedFolder(null)} style={{ width: '36px', height: '36px' }}>
            ←
          </button>
          <h1 style={{ fontSize: '20px' }}>Carpeta: {selectedFolder}</h1>
        </div>
        <div style={{ marginBottom: '16px', fontSize: '12px', color: 'hsl(var(--text-muted))' }}>
          {folderTracks.length} canciones
        </div>
        {renderTrackList(folderTracks)}
      </div>
    );
  }

  // Render a list of tracks helper
  function renderTrackList(trackList: Track[]) {
    if (trackList.length === 0) {
      return (
        <div className="empty-state">
          <p>No se encontraron canciones.</p>
        </div>
      );
    }

    return (
      <div>
        {trackList.map((track, index) => {
          const isPlaying = playbackState.currentTrackId === track.id;
          const isFav = isTrackFavorite(track.id);
          
          return (
            <div key={track.id} style={{ display: 'flex', flexDirection: 'column' }}>
              <div
                className={`track-item ${isPlaying ? 'playing' : ''}`}
                onClick={() => playAll(trackList, index)}
              >
                {/* Cover artwork */}
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

                {/* Track Details */}
                <div className="track-info">
                  <div className="track-title">{track.title}</div>
                  <div className="track-artist-album">
                    {track.artist} • {track.album}
                  </div>
                </div>

                {/* Duration or options menu trigger */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    className="mini-control-btn"
                    style={{ color: isFav ? '#ff4b72' : 'hsl(var(--text-muted))' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(track.id);
                    }}
                  >
                    <Heart size={14} fill={isFav ? '#ff4b72' : 'none'} />
                  </button>
                  <button
                    className="mini-control-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowOptionsTrackId(showOptionsTrackId === track.id ? null : track.id);
                    }}
                  >
                    <Plus size={16} />
                  </button>
                  <span className="track-duration">{formatDuration(track.duration)}</span>
                </div>
              </div>

              {/* Inline Quick Action Panel (Queue / Playlist actions - RF-P03) */}
              {showOptionsTrackId === track.id && (
                <div
                  className="glass-card"
                  style={{
                    margin: '-4px 12px 10px 12px',
                    padding: '8px 12px',
                    borderRadius: '0 0 12px 12px',
                    display: 'flex',
                    justifyContent: 'space-around',
                    fontSize: '11px',
                    gap: '10px',
                    animation: 'fade-in 0.2s ease',
                  }}
                >
                  <button
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'hsl(var(--text-secondary))',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      playNext(track.id);
                      setShowOptionsTrackId(null);
                    }}
                  >
                    <CornerDownRight size={14} /> Reproducir siguiente
                  </button>
                  <button
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'hsl(var(--text-secondary))',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      addToQueue(track.id);
                      setShowOptionsTrackId(null);
                    }}
                  >
                    <Plus size={14} /> Añadir a la cola
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="screen-content">
      {/* Header */}
      <div className="screen-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Mi Biblioteca</h1>
        {tracks.length > 0 && (
          <button
            className="player-btn"
            style={{ color: '#ff4b5c', border: '1px solid rgba(255, 75, 92, 0.2)' }}
            onClick={clearLibrary}
            title="Limpiar biblioteca"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* Real-time search bar (RF-B04) */}
      <div className="search-container">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder="Buscar canciones, artistas, álbumes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Categorized Segmented Tabs (RF-B03) */}
      <div className="segmented-tabs">
        <button
          className={`tab-btn ${activeTab === 'songs' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('songs');
            setSelectedArtist(null);
            setSelectedAlbum(null);
            setSelectedFolder(null);
          }}
        >
          Canciones
        </button>
        <button
          className={`tab-btn ${activeTab === 'artists' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('artists');
            setSelectedArtist(null);
            setSelectedAlbum(null);
            setSelectedFolder(null);
          }}
        >
          Artistas
        </button>
        <button
          className={`tab-btn ${activeTab === 'albums' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('albums');
            setSelectedArtist(null);
            setSelectedAlbum(null);
            setSelectedFolder(null);
          }}
        >
          Álbumes
        </button>
        <button
          className={`tab-btn ${activeTab === 'folders' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('folders');
            setSelectedArtist(null);
            setSelectedAlbum(null);
            setSelectedFolder(null);
          }}
        >
          Carpetas
        </button>
      </div>

      {/* Screen body depending on tabs */}
      {isScanning && (
        <div className="empty-state">
          <Clock size={36} className="animate-pulse" style={{ color: 'hsl(var(--accent))' }} />
          <h3>Escaneando archivos...</h3>
          <p>Extrayendo metadatos ID3 y organizando canciones.</p>
        </div>
      )}

      {!isScanning && tracks.length === 0 && (
        <div className="empty-state" style={{ height: '350px' }}>
          <Disc size={48} style={{ color: 'hsl(var(--text-muted))' }} />
          <h3>Biblioteca vacía</h3>
          <p>Importa archivos de música locales para empezar.</p>
          <label className="scan-btn-label" style={{ marginTop: '12px' }}>
            <Upload size={16} /> Escanear Carpeta
            <input
              type="file"
              {...{ webkitdirectory: "", directory: "" }}
              multiple
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </label>
        </div>
      )}

      {!isScanning && tracks.length > 0 && (
        <div>
          {/* TAB: Songs */}
          {activeTab === 'songs' && renderTrackList(filteredTracks)}

          {/* TAB: Artists */}
          {activeTab === 'artists' && (
            <div className="grid-container">
              {uniqueArtists
                .filter((artist) => artist.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((artist) => (
                  <div
                    key={artist}
                    className="glass-card card-category"
                    onClick={() => setSelectedArtist(artist)}
                  >
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, hsl(var(--accent) / 0.2) 0%, hsl(var(--accent) / 0.6) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                      }}
                    >
                      <User size={18} />
                    </div>
                    <div className="card-category-title">{artist}</div>
                    <div className="card-category-subtitle">
                      {tracks.filter((t) => t.artist === artist).length} canciones
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* TAB: Albums */}
          {activeTab === 'albums' && (
            <div className="grid-container">
              {uniqueAlbums
                .filter((album) => album.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((album) => (
                  <div
                    key={album}
                    className="glass-card card-category"
                    onClick={() => setSelectedAlbum(album)}
                  >
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, hsl(var(--accent-secondary) / 0.2) 0%, hsl(var(--accent) / 0.5) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                      }}
                    >
                      <Disc size={18} />
                    </div>
                    <div className="card-category-title">{album}</div>
                    <div className="card-category-subtitle">
                      {tracks.filter((t) => t.album === album).length} canciones
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* TAB: Folders */}
          {activeTab === 'folders' && (
            <div>
              {uniqueFolders
                .filter((folder) => folder.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((folder) => (
                  <div
                    key={folder}
                    className="folder-item"
                    onClick={() => setSelectedFolder(folder)}
                  >
                    <Folder size={20} style={{ color: 'hsl(var(--accent-secondary))' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{folder}</div>
                      <div style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>
                        {tracks.filter((t) => t.parentFolder === folder).length} archivos de audio
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
