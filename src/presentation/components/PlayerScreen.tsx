import React from 'react';
import { useAudio } from '../context/AudioContext';
import { ChevronDown, Play, Pause, SkipForward, SkipBack, Shuffle, Repeat, Heart, Volume2, VolumeX, Disc } from 'lucide-react';

export const PlayerScreen: React.FC = () => {
  const {
    playbackState,
    tracks,
    playlists,
    togglePlay,
    nextTrack,
    previousTrack,
    seek,
    setVolume,
    toggleShuffle,
    toggleRepeatMode,
    toggleFavorite,
    setActiveScreen,
  } = useAudio();

  const currentTrack = tracks.find((t) => t.id === playbackState.currentTrackId);
  if (!currentTrack) return null;

  // Check if current track is in Favorites
  const favPlaylist = playlists.find((p) => p.isSystem && p.id === 'favorites');
  const isFavorite = favPlaylist ? favPlaylist.trackIds.includes(currentTrack.id) : false;

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    seek(parseFloat(e.target.value));
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  };

  const toggleMute = () => {
    if (playbackState.volume > 0) {
      setVolume(0);
    } else {
      setVolume(0.8);
    }
  };

  return (
    <div className="player-screen">
      {/* Ambient background styling */}
      <div className="player-ambient-bg"></div>

      {/* Header */}
      <div className="player-header" style={{ zIndex: 10 }}>
        <button className="player-btn" onClick={() => setActiveScreen('library')}>
          <ChevronDown size={24} />
        </button>
        <h2>Reproduciendo</h2>
        <div style={{ width: 40 }}></div>
      </div>

      {/* Album Artwork - Spotify Style Square */}
      <div className="artwork-container" style={{ zIndex: 10 }}>
        <div className="artwork-wrapper-spotify">
          {currentTrack.coverUrl ? (
            <img src={currentTrack.coverUrl} alt="Cover" className="artwork-spotify" />
          ) : (
            <div className="artwork-placeholder">
              <Disc size={80} />
            </div>
          )}
        </div>
      </div>

      {/* Info labels - Left aligned with Heart on right (Spotify style) */}
      <div className="playback-details" style={{ zIndex: 10 }}>
        <div className="playback-title-wrapper">
          <h3 className="playback-title">{currentTrack.title}</h3>
          <p className="playback-artist">{currentTrack.artist}</p>
        </div>
        <button 
          className="player-btn" 
          style={{ color: isFavorite ? '#1DB954' : '#b3b3b3', padding: 0 }}
          onClick={() => toggleFavorite(currentTrack.id)}
        >
          <Heart size={26} fill={isFavorite ? '#1DB954' : 'none'} strokeWidth={isFavorite ? 0 : 2} />
        </button>
      </div>

      {/* Seekbar Slider */}
      <div className="seekbar-container" style={{ zIndex: 10 }}>
        <input
          type="range"
          className="slider"
          min={0}
          max={playbackState.duration || 100}
          value={playbackState.currentTime}
          onChange={handleSeekChange}
          style={{
            background: `linear-gradient(to right, #ffffff 0%, #ffffff ${
              playbackState.duration ? (playbackState.currentTime / playbackState.duration) * 100 : 0
            }%, rgba(255,255,255,0.2) ${
              playbackState.duration ? (playbackState.currentTime / playbackState.duration) * 100 : 0
            }%, rgba(255,255,255,0.2) 100%)`
          }}
        />
        <div className="time-display">
          <span>{formatTime(playbackState.currentTime)}</span>
          <span>{formatTime(playbackState.duration)}</span>
        </div>
      </div>

      {/* Media Controls (Play Button is solid white circle) */}
      <div className="player-controls" style={{ zIndex: 10 }}>
        <button
          className={`control-btn ${playbackState.shuffle ? 'active' : ''}`}
          onClick={toggleShuffle}
        >
          <Shuffle size={20} />
        </button>

        <button className="control-btn" onClick={previousTrack}>
          <SkipBack size={24} fill="currentColor" />
        </button>

        <button className="control-btn control-btn-main" onClick={togglePlay}>
          {playbackState.isPlaying ? (
            <Pause size={28} fill="#000" color="#000" />
          ) : (
            <Play size={28} fill="#000" color="#000" style={{ marginLeft: 3 }} />
          )}
        </button>

        <button className="control-btn" onClick={nextTrack}>
          <SkipForward size={24} fill="currentColor" />
        </button>

        <button
          className={`control-btn ${playbackState.repeatMode !== 'none' ? 'active' : ''}`}
          onClick={toggleRepeatMode}
          style={{ position: 'relative' }}
        >
          <Repeat size={20} />
          {playbackState.repeatMode === 'one' && (
            <span
              style={{
                position: 'absolute',
                top: '6px',
                right: '4px',
                fontSize: '8px',
                fontWeight: '900',
                background: '#1DB954',
                color: '#000',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              1
            </span>
          )}
        </button>
      </div>

      {/* Volume slider */}
      <div className="volume-control-bar" style={{ zIndex: 10 }}>
        <button
          className="control-btn"
          onClick={toggleMute}
          style={{ width: 'auto', height: 'auto', padding: 0 }}
        >
          {playbackState.volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
        <input
          type="range"
          className="slider"
          min={0}
          max={1}
          step={0.01}
          value={playbackState.volume}
          onChange={handleVolumeChange}
          style={{
            background: `linear-gradient(to right, #ffffff 0%, #ffffff ${
              playbackState.volume * 100
            }%, rgba(255,255,255,0.2) ${playbackState.volume * 100}%, rgba(255,255,255,0.2) 100%)`
          }}
        />
      </div>
    </div>
  );
};
