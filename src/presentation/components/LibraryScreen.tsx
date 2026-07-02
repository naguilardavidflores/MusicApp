import React, { useState } from 'react';
import { useAudio } from '../context/AudioContext';
import type { Track } from '../../domain/entities';
import { Search, Folder, User, Disc, Upload, Trash2, Plus, Clock, CornerDownRight, Heart, Play } from 'lucide-react';
import { Title, Subtitle, BodyText, MutedText } from './ui/Typography';
import { Button } from './ui/Button';
import { IconButton } from './ui/IconButton';
import { TrackRow } from './ui/TrackRow';

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

  // 1. Filtering logic based on search
  const filteredTracks = tracks.filter((track) => {
    const query = searchQuery.toLowerCase();
    return (
      track.title.toLowerCase().includes(query) ||
      track.artist.toLowerCase().includes(query) ||
      track.album.toLowerCase().includes(query)
    );
  });

  // 2. Classifications logic
  const uniqueArtists = Array.from(new Set(tracks.map((t) => t.artist))).sort();
  const uniqueAlbums = Array.from(new Set(tracks.map((t) => t.album))).sort();
  const uniqueFolders = Array.from(new Set(tracks.map((t) => t.parentFolder))).sort();

  // Filter lists by selected group when browsing
  const songsByArtist = selectedArtist ? tracks.filter((t) => t.artist === selectedArtist) : [];
  const songsByAlbum = selectedAlbum ? tracks.filter((t) => t.album === selectedAlbum) : [];
  const songsByFolder = selectedFolder ? tracks.filter((t) => t.parentFolder === selectedFolder) : [];

  const handlePlayTrack = (trackList: Track[], index: number) => {
    playAll(trackList, index);
  };

  // Helper to render track lists with options panels
  const renderTrackList = (trackList: Track[]) => {
    const favPlaylist = playlists.find((p) => p.isSystem && p.id === 'favorites');
    const favIds = favPlaylist ? favPlaylist.trackIds : [];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {trackList.map((track) => {
          const isFav = favIds.includes(track.id);
          const isCurrent = playbackState.currentTrackId === track.id;

          const trackActions = (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IconButton
                style={{ width: '32px', height: '32px', color: isFav ? '#1DB954' : 'hsl(var(--text-muted))', padding: 0 }}
                onClick={() => toggleFavorite(track.id)}
              >
                <Heart size={16} fill={isFav ? '#1DB954' : 'none'} strokeWidth={isFav ? 0 : 2} />
              </IconButton>
              <IconButton
                style={{ width: '32px', height: '32px', color: '#fff', padding: 0 }}
                onClick={() => setShowOptionsTrackId(showOptionsTrackId === track.id ? null : track.id)}
              >
                <Plus size={18} />
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
            <div key={track.id}>
              <TrackRow
                track={track}
                isCurrent={isCurrent}
                isPlaying={playbackState.isPlaying}
                onClick={() => {
                  const idx = trackList.findIndex((t) => t.id === track.id);
                  handlePlayTrack(trackList, idx);
                }}
                rightAction={trackActions}
              />

              {/* Quick Actions Sub-drawer */}
              {showOptionsTrackId === track.id && (
                <div
                  className="glass-card"
                  style={{
                    margin: '-4px 8px 10px 8px',
                    padding: '8px 12px',
                    borderRadius: '0 0 8px 8px',
                    display: 'flex',
                    justifyContent: 'space-around',
                    animation: 'fade-in 0.2s ease',
                  }}
                >
                  <button
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'hsl(var(--text-secondary))',
                      fontSize: '11px',
                      fontWeight: 600,
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
                    <CornerDownRight size={14} /> Siguiente
                  </button>
                  <button
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'hsl(var(--text-secondary))',
                      fontSize: '11px',
                      fontWeight: 600,
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
                    <Plus size={14} /> Añadir a cola
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Browsing detail view header
  if (selectedArtist || selectedAlbum || selectedFolder) {
    const title = selectedArtist || selectedAlbum || selectedFolder || '';
    const subtracks = selectedArtist 
      ? songsByArtist 
      : selectedAlbum 
      ? songsByAlbum 
      : songsByFolder;

    const handleBack = () => {
      setSelectedArtist(null);
      setSelectedAlbum(null);
      setSelectedFolder(null);
    };

    return (
      <div className="screen-content">
        <div className="screen-header" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <IconButton onClick={handleBack} style={{ color: '#fff' }}>
            ←
          </IconButton>
          <Title style={{ fontSize: '20px', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {title}
          </Title>
        </div>

        {subtracks.length > 0 && (
          <Button
            variant="primary"
            style={{ width: '100%', marginBottom: '20px' }}
            onClick={() => playAll(subtracks, 0)}
          >
            <Play size={16} fill="currentColor" /> Reproducir Todo
          </Button>
        )}

        {renderTrackList(subtracks)}
      </div>
    );
  }

  return (
    <div className="screen-content">
      {/* Header */}
      <div className="screen-header">
        <Title>Mi Biblioteca</Title>
        {tracks.length > 0 && (
          <IconButton
            style={{ color: '#ff4b5c', border: '1px solid rgba(255, 75, 92, 0.2)', borderRadius: '50%' }}
            onClick={clearLibrary}
            title="Limpiar biblioteca"
          >
            <Trash2 size={16} />
          </IconButton>
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
        <Button
          variant={activeTab === 'songs' ? 'accent' : 'secondary'}
          onClick={() => {
            setActiveTab('songs');
            setSelectedArtist(null);
            setSelectedAlbum(null);
            setSelectedFolder(null);
          }}
        >
          Canciones
        </Button>
        <Button
          variant={activeTab === 'artists' ? 'accent' : 'secondary'}
          onClick={() => {
            setActiveTab('artists');
            setSelectedArtist(null);
            setSelectedAlbum(null);
            setSelectedFolder(null);
          }}
        >
          Artistas
        </Button>
        <Button
          variant={activeTab === 'albums' ? 'accent' : 'secondary'}
          onClick={() => {
            setActiveTab('albums');
            setSelectedArtist(null);
            setSelectedAlbum(null);
            setSelectedFolder(null);
          }}
        >
          Álbumes
        </Button>
        <Button
          variant={activeTab === 'folders' ? 'accent' : 'secondary'}
          onClick={() => {
            setActiveTab('folders');
            setSelectedArtist(null);
            setSelectedAlbum(null);
            setSelectedFolder(null);
          }}
        >
          Carpetas
        </Button>
      </div>

      {/* Screen body depending on tabs */}
      {isScanning && (
        <div className="empty-state">
          <Clock size={36} className="animate-pulse" style={{ color: 'hsl(var(--accent))' }} />
          <Subtitle>Escaneando archivos...</Subtitle>
          <MutedText>Buscando audios en el dispositivo.</MutedText>
        </div>
      )}

      {!isScanning && tracks.length === 0 && (
        <div className="empty-state" style={{ height: '350px' }}>
          <Disc size={48} style={{ color: 'hsl(var(--text-muted))' }} />
          <Subtitle>Biblioteca vacía</Subtitle>
          <MutedText>Importa archivos de música locales para empezar.</MutedText>
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
                        background: 'linear-gradient(135deg, hsl(var(--accent) / 0.15) 0%, hsl(var(--accent) / 0.5) 100%)',
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
                    <Folder size={20} style={{ color: 'hsl(var(--accent))' }} />
                    <div style={{ flex: 1 }}>
                      <BodyText style={{ fontSize: '13px', fontWeight: 600 }}>{folder}</BodyText>
                      <MutedText style={{ fontSize: '11px' }}>
                        {tracks.filter((t) => t.parentFolder === folder).length} archivos de audio
                      </MutedText>
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
