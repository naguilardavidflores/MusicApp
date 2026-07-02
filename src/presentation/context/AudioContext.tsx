import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Track, Playlist, PlaybackState, RepeatMode } from '../../domain/entities';
import { dbHelper } from '../../data/IndexedDBHelper';
import { audioEngine } from '../../data/AudioEngine';
import { MetadataScanner } from '../../data/MetadataScanner';

interface AudioContextType {
  tracks: Track[];
  playlists: Playlist[];
  playbackState: PlaybackState;
  activeScreen: 'library' | 'player' | 'playlists' | 'queue';
  activeTab: 'songs' | 'artists' | 'albums' | 'folders';
  searchQuery: string;
  isScanning: boolean;
  selectedPlaylistId: string | null;
  
  // Navigation Actions
  setActiveScreen: (screen: 'library' | 'player' | 'playlists' | 'queue') => void;
  setActiveTab: (tab: 'songs' | 'artists' | 'albums' | 'folders') => void;
  setSearchQuery: (query: string) => void;
  setSelectedPlaylistId: (id: string | null) => void;

  // Scanner Actions
  scanDirectory: (files: FileList) => Promise<void>;
  clearLibrary: () => Promise<void>;

  // Playback Actions
  playTrack: (trackId: string) => Promise<void>;
  playAll: (tracksToPlay: Track[], startIndex?: number) => Promise<void>;
  togglePlay: () => Promise<void>;
  nextTrack: () => void;
  previousTrack: () => void;
  seek: (seconds: number) => void;
  setVolume: (vol: number) => void;
  toggleShuffle: () => void;
  toggleRepeatMode: () => void;

  // Queue Actions
  addToQueue: (trackId: string) => void;
  playNext: (trackId: string) => void;
  reorderQueue: (startIndex: number, endIndex: number) => void;
  removeFromQueue: (index: number) => void;

  // Playlist Actions
  createPlaylist: (name: string) => Promise<void>;
  deletePlaylist: (playlistId: string) => Promise<void>;
  toggleFavorite: (trackId: string) => Promise<void>;
  addTrackToPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => Promise<void>;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

// --- Dynamic Mock Synthwave Track Generator Helpers ---
const writeString = (view: DataView, offset: number, string: string) => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};

const audioBufferToWavBlob = (buffer: AudioBuffer): Blob => {
  const numOfChan = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // raw PCM
  const bitDepth = 16;
  
  let result;
  if (numOfChan === 1) {
    result = buffer.getChannelData(0);
  } else {
    const c0 = buffer.getChannelData(0);
    const c1 = buffer.getChannelData(1);
    result = new Float32Array(c0.length * 2);
    for (let i = 0; i < c0.length; i++) {
      result[i * 2] = c0[i];
      result[i * 2 + 1] = c1[i];
    }
  }
  
  const bufferLength = result.length * 2;
  const arrayBuffer = new ArrayBuffer(44 + bufferLength);
  const view = new DataView(arrayBuffer);
  
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + bufferLength, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numOfChan, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numOfChan * (bitDepth / 8), true);
  view.setUint16(32, numOfChan * (bitDepth / 8), true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, bufferLength, true);
  
  let offset = 44;
  for (let i = 0; i < result.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, result[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
  
  return new Blob([view], { type: 'audio/wav' });
};

const generateMockWav = async (frequency: number, durationSec: number): Promise<Blob> => {
  const sampleRate = 22050; // Render fast
  const numSamples = sampleRate * durationSec;
  const offlineCtx = new OfflineAudioContext(1, numSamples, sampleRate);
  
  const osc = offlineCtx.createOscillator();
  const gain = offlineCtx.createGain();
  
  osc.type = 'triangle';
  
  // Melodic arpeggio patterns
  const baseFreq = frequency;
  const intervals = [1.0, 1.2, 1.5, 1.8]; // Root, minor 3rd, 5th, minor 7th
  for (let t = 0; t < durationSec; t += 0.4) {
    const noteIdx = Math.floor(t * 2.5) % intervals.length;
    osc.frequency.setValueAtTime(baseFreq * intervals[noteIdx], t);
  }
  
  gain.gain.setValueAtTime(0.12, 0);
  gain.gain.setValueAtTime(0.12, durationSec - 1.5);
  gain.gain.linearRampToValueAtTime(0.001, durationSec);
  
  osc.connect(gain);
  gain.connect(offlineCtx.destination);
  
  osc.start(0);
  osc.stop(durationSec);
  
  const renderedBuffer = await offlineCtx.startRendering();
  return audioBufferToWavBlob(renderedBuffer);
};

const generateMockTracks = async (): Promise<Track[]> => {
  const tracksList: Track[] = [];
  const songsData = [
    { title: 'Neon Dreams', artist: 'Retro Wave', album: 'Sunset Blvd', freq: 130.81, len: 20 },
    { title: 'Aqua Breeze', artist: 'Lofi Chords', album: 'Chill Ocean', freq: 146.83, len: 25 },
    { title: 'Cosmic Voyager', artist: 'Astro Pad', album: 'Deep Space', freq: 164.81, len: 30 }
  ];
  
  for (const s of songsData) {
    try {
      const blob = await generateMockWav(s.freq, s.len);
      const file = new File([blob], `${s.title.toLowerCase().replace(/\s+/g, '_')}.wav`, { type: 'audio/wav' });
      
      // Cover canvas gradient
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const grad = ctx.createLinearGradient(0, 0, 300, 300);
        if (s.title === 'Neon Dreams') {
          grad.addColorStop(0, '#f43f5e');
          grad.addColorStop(1, '#8b5cf6');
        } else if (s.title === 'Aqua Breeze') {
          grad.addColorStop(0, '#06b6d4');
          grad.addColorStop(1, '#10b981');
        } else {
          grad.addColorStop(0, '#6366f1');
          grad.addColorStop(1, '#ec4899');
        }
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 300, 300);
        
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(150, 150, 80, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(s.title, 150, 140);
        
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '14px Plus Jakarta Sans, sans-serif';
        ctx.fillText(s.artist, 150, 175);
      }
      
      const coverUrl = canvas.toDataURL('image/png');
      const id = btoa(encodeURIComponent(`${file.name}-${file.size}-${s.len}`));
      
      tracksList.push({
        id,
        title: s.title,
        artist: s.artist,
        album: s.album,
        genre: 'Synthwave',
        duration: s.len,
        filePath: file.name,
        parentFolder: 'Preloaded',
        coverUrl,
        file
      });
    } catch (e) {
      console.error('Error creating mock track: ' + s.title, e);
    }
  }
  return tracksList;
};

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [activeScreen, setActiveScreen] = useState<'library' | 'player' | 'playlists' | 'queue'>('library');
  const [activeTab, setActiveTab] = useState<'songs' | 'artists' | 'albums' | 'folders'>('songs');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);

  // Playback State
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.8,
    shuffle: false,
    repeatMode: 'none',
    queue: [],
    currentIndex: -1,
    currentTrackId: null,
  });

  // Initialize DB and Load Data
  useEffect(() => {
    const initApp = async () => {
      try {
        await dbHelper.init();

        // 1. Load Tracks
        const savedTracks = await dbHelper.getAllTracks();
        let processedTracks = [...savedTracks];
        
        // Generate preloaded synthetic tracks if empty
        if (processedTracks.length === 0) {
          setIsScanning(true);
          const generated = await generateMockTracks();
          await dbHelper.saveTracks(generated);
          processedTracks = generated;
          setIsScanning(false);
        }

        setTracks(processedTracks);

        // 2. Load Playlists
        let savedPlaylists = await dbHelper.getAllPlaylists();
        
        // Ensure "Favorites" system playlist exists
        let favs = savedPlaylists.find((p) => p.isSystem && p.id === 'favorites');
        if (!favs) {
          favs = {
            id: 'favorites',
            name: 'Favoritos',
            trackIds: [],
            createdAt: Date.now(),
            isSystem: true,
          };
          await dbHelper.savePlaylist(favs);
          savedPlaylists.push(favs);
        }
        setPlaylists(savedPlaylists);

        // 3. Restore Last Playback State (RF-A04)
        const lastVolume = await dbHelper.getSetting<number>('volume');
        const lastShuffle = await dbHelper.getSetting<boolean>('shuffle');
        const lastRepeat = await dbHelper.getSetting<RepeatMode>('repeatMode');
        const lastTrackId = await dbHelper.getSetting<string>('lastTrackId');
        const lastPosition = await dbHelper.getSetting<number>('lastPosition');
        const lastQueue = await dbHelper.getSetting<string[]>('queue');
        const lastIndex = await dbHelper.getSetting<number>('currentIndex');

        const initialVol = lastVolume !== null ? lastVolume : 0.8;
        audioEngine.setVolume(initialVol);

        setPlaybackState((prev) => ({
          ...prev,
          volume: initialVol,
          shuffle: lastShuffle || false,
          repeatMode: lastRepeat || 'none',
          queue: lastQueue || [],
          currentIndex: lastIndex !== null ? lastIndex : -1,
          currentTrackId: lastTrackId || null,
          currentTime: lastPosition || 0,
        }));

        // Load the song into audio element without playing immediately
        if (lastTrackId && lastQueue && lastQueue.length > 0) {
          const track = processedTracks.find((t) => t.id === lastTrackId);
          if (track && track.file) {
            try {
              await audioEngine.playTrack(track, lastPosition || 0);
              audioEngine.pause(); // keep paused on startup
            } catch (err) {
              console.warn('Could not preload last track', err);
            }
          }
        }
      } catch (err) {
        console.error('Failed to initialize app', err);
        setIsScanning(false);
      }
    };

    initApp();
  }, []);

  // Sync Audio Engine with State Callbacks
  useEffect(() => {
    audioEngine.onTimeUpdate = (time) => {
      setPlaybackState((prev) => {
        // Save seek bar position locally every 5 seconds or on track load (RF-A04)
        if (Math.floor(time) % 5 === 0 && prev.currentTime !== time) {
          dbHelper.setSetting('lastPosition', time);
        }
        return { ...prev, currentTime: time };
      });
    };

    audioEngine.onDurationChange = (duration) => {
      setPlaybackState((prev) => ({ ...prev, duration }));
    };

    audioEngine.onEnded = () => {
      nextTrack();
    };

    audioEngine.onPlayStateChange = (isPlaying) => {
      setPlaybackState((prev) => ({ ...prev, isPlaying }));
    };

    audioEngine.onError = (err) => {
      console.error('Playback error:', err);
      setPlaybackState((prev) => ({ ...prev, isPlaying: false }));
    };
  }, [playbackState.queue, playbackState.currentIndex]);

  // Sync Media Session Next/Previous controls (RF-S02 / RF-S04)
  useEffect(() => {
    audioEngine.setSkipHandlers(
      playbackState.queue.length > 0 ? () => nextTrack() : null,
      playbackState.queue.length > 0 ? () => previousTrack() : null
    );
  }, [playbackState.queue, playbackState.currentIndex]);

  // Save Settings when changed
  const saveStateSettings = useCallback(async (state: PlaybackState) => {
    await dbHelper.setSetting('shuffle', state.shuffle);
    await dbHelper.setSetting('repeatMode', state.repeatMode);
    await dbHelper.setSetting('queue', state.queue);
    await dbHelper.setSetting('currentIndex', state.currentIndex);
    await dbHelper.setSetting('lastTrackId', state.currentTrackId);
  }, []);

  // Playback control functions
  const playTrack = useCallback(async (trackId: string) => {
    const track = tracks.find((t) => t.id === trackId);
    if (!track) return;

    // Check if it's already in the queue. If not, add/rebuild queue.
    let newQueue = [...playbackState.queue];
    let newIdx = newQueue.indexOf(trackId);

    if (newIdx === -1) {
      newQueue = [trackId];
      newIdx = 0;
    }

    setPlaybackState((prev) => {
      const nextState = {
        ...prev,
        queue: newQueue,
        currentIndex: newIdx,
        currentTrackId: trackId,
        isPlaying: true,
      };
      saveStateSettings(nextState);
      return nextState;
    });

    try {
      await audioEngine.playTrack(track);
    } catch (e) {
      console.error('PlayTrack error', e);
    }
  }, [tracks, playbackState.queue, saveStateSettings]);

  const playAll = useCallback(async (tracksToPlay: Track[], startIndex = 0) => {
    if (tracksToPlay.length === 0) return;

    let trackIds = tracksToPlay.map((t) => t.id);
    
    // Apply shuffle if active
    let activeQueue = [...trackIds];
    let playIdx = startIndex;
    
    if (playbackState.shuffle) {
      // Shuffle everything EXCEPT the starting track, which goes first
      const firstTrackId = trackIds[startIndex];
      const remainingTracks = trackIds.filter((_, i) => i !== startIndex);
      // Fisher-Yates shuffle
      for (let i = remainingTracks.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [remainingTracks[i], remainingTracks[j]] = [remainingTracks[j], remainingTracks[i]];
      }
      activeQueue = [firstTrackId, ...remainingTracks];
      playIdx = 0;
    }

    const startTrack = tracks.find((t) => t.id === activeQueue[playIdx]);
    if (!startTrack) return;

    setPlaybackState((prev) => {
      const nextState = {
        ...prev,
        queue: activeQueue,
        currentIndex: playIdx,
        currentTrackId: startTrack.id,
        isPlaying: true,
      };
      saveStateSettings(nextState);
      return nextState;
    });

    try {
      await audioEngine.playTrack(startTrack);
    } catch (e) {
      console.error('PlayAll error', e);
    }
  }, [tracks, playbackState.shuffle, saveStateSettings]);

  const togglePlay = useCallback(async () => {
    if (playbackState.isPlaying) {
      audioEngine.pause();
    } else {
      if (playbackState.currentTrackId) {
        await audioEngine.resume();
      } else if (tracks.length > 0) {
        await playTrack(tracks[0].id);
      }
    }
  }, [playbackState.isPlaying, playbackState.currentTrackId, tracks, playTrack]);

  const nextTrack = useCallback(() => {
    const { queue, currentIndex, repeatMode } = playbackState;
    if (queue.length === 0) return;

    let nextIndex = currentIndex;

    if (repeatMode === 'one') {
      // Repeat the same song
      nextIndex = currentIndex;
    } else {
      nextIndex = currentIndex + 1;
      if (nextIndex >= queue.length) {
        if (repeatMode === 'all') {
          nextIndex = 0; // Wrap around
        } else {
          // Stop playback at end of queue
          audioEngine.stop();
          setPlaybackState((prev) => ({
            ...prev,
            isPlaying: false,
            currentTime: 0,
          }));
          return;
        }
      }
    }

    const nextTrackId = queue[nextIndex];
    const track = tracks.find((t) => t.id === nextTrackId);
    
    if (track) {
      setPlaybackState((prev) => {
        const nextState = {
          ...prev,
          currentIndex: nextIndex,
          currentTrackId: nextTrackId,
          isPlaying: true,
        };
        saveStateSettings(nextState);
        return nextState;
      });
      audioEngine.playTrack(track);
    }
  }, [playbackState, tracks, saveStateSettings]);

  const previousTrack = useCallback(() => {
    const { queue, currentIndex, repeatMode } = playbackState;
    if (queue.length === 0) return;

    // If song is past 3 seconds, restart the song instead of going to previous
    if (audioEngine.getCurrentTime() > 3) {
      audioEngine.seek(0);
      return;
    }

    let prevIndex = currentIndex;

    if (repeatMode === 'one') {
      prevIndex = currentIndex;
    } else {
      prevIndex = currentIndex - 1;
      if (prevIndex < 0) {
        if (repeatMode === 'all') {
          prevIndex = queue.length - 1; // Wrap around to end
        } else {
          prevIndex = 0; // Stay on first track
        }
      }
    }

    const prevTrackId = queue[prevIndex];
    const track = tracks.find((t) => t.id === prevTrackId);

    if (track) {
      setPlaybackState((prev) => {
        const nextState = {
          ...prev,
          currentIndex: prevIndex,
          currentTrackId: prevTrackId,
          isPlaying: true,
        };
        saveStateSettings(nextState);
        return nextState;
      });
      audioEngine.playTrack(track);
    }
  }, [playbackState, tracks, saveStateSettings]);

  const seek = useCallback((seconds: number) => {
    audioEngine.seek(seconds);
    setPlaybackState((prev) => ({ ...prev, currentTime: seconds }));
    dbHelper.setSetting('lastPosition', seconds);
  }, []);

  const setVolume = useCallback((vol: number) => {
    const safeVol = Math.max(0, Math.min(1, vol));
    audioEngine.setVolume(safeVol);
    setPlaybackState((prev) => ({ ...prev, volume: safeVol }));
    dbHelper.setSetting('volume', safeVol);
  }, []);

  const toggleShuffle = useCallback(() => {
    setPlaybackState((prev) => {
      let newQueue = [...prev.queue];
      let newIdx = prev.currentIndex;

      if (!prev.shuffle) {
        // Turning shuffle ON: Shuffle remaining queue
        if (newQueue.length > 0 && prev.currentTrackId) {
          const currentId = prev.currentTrackId;
          const otherIds = newQueue.filter((id) => id !== currentId);
          
          for (let i = otherIds.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [otherIds[i], otherIds[j]] = [otherIds[j], otherIds[i]];
          }
          
          newQueue = [currentId, ...otherIds];
          newIdx = 0;
        }
      } else {
        // Turning shuffle OFF: Sort queue back to library order
        if (prev.currentTrackId) {
          // Re-align with tracks list
          const activeTrackIds = tracks.map((t) => t.id);
          const currentQueueTracks = prev.queue.filter((id) => activeTrackIds.includes(id));
          
          // Reorder current queue according to their position in full tracklist
          newQueue = currentQueueTracks.sort((a, b) => {
            return activeTrackIds.indexOf(a) - activeTrackIds.indexOf(b);
          });
          newIdx = newQueue.indexOf(prev.currentTrackId);
        }
      }

      const nextState = {
        ...prev,
        shuffle: !prev.shuffle,
        queue: newQueue,
        currentIndex: newIdx,
      };
      saveStateSettings(nextState);
      return nextState;
    });
  }, [tracks, saveStateSettings]);

  const toggleRepeatMode = useCallback(() => {
    const modes: RepeatMode[] = ['none', 'all', 'one'];
    setPlaybackState((prev) => {
      const nextIdx = (modes.indexOf(prev.repeatMode) + 1) % modes.length;
      const nextMode = modes[nextIdx];
      const nextState = {
        ...prev,
        repeatMode: nextMode,
      };
      saveStateSettings(nextState);
      return nextState;
    });
  }, [saveStateSettings]);

  // Queue manipulation functions
  const addToQueue = useCallback((trackId: string) => {
    setPlaybackState((prev) => {
      if (prev.queue.includes(trackId)) return prev; // Avoid duplicates in queue
      const nextState = {
        ...prev,
        queue: [...prev.queue, trackId],
      };
      if (nextState.currentIndex === -1) {
        nextState.currentIndex = 0;
        nextState.currentTrackId = trackId;
      }
      saveStateSettings(nextState);
      return nextState;
    });
  }, [saveStateSettings]);

  const playNext = useCallback((trackId: string) => {
    setPlaybackState((prev) => {
      const filteredQueue = prev.queue.filter((id) => id !== trackId);
      const insertIdx = prev.currentIndex + 1;
      
      const newQueue = [
        ...filteredQueue.slice(0, insertIdx),
        trackId,
        ...filteredQueue.slice(insertIdx),
      ];

      const nextState = {
        ...prev,
        queue: newQueue,
        currentIndex: Math.max(0, newQueue.indexOf(prev.currentTrackId || trackId)),
      };
      saveStateSettings(nextState);
      return nextState;
    });
  }, [saveStateSettings]);

  const reorderQueue = useCallback((startIndex: number, endIndex: number) => {
    setPlaybackState((prev) => {
      const newQueue = [...prev.queue];
      const [removed] = newQueue.splice(startIndex, 1);
      newQueue.splice(endIndex, 0, removed);

      // Find new current index
      let newIdx = prev.currentIndex;
      if (prev.currentTrackId) {
        newIdx = newQueue.indexOf(prev.currentTrackId);
      }

      const nextState = {
        ...prev,
        queue: newQueue,
        currentIndex: newIdx,
      };
      saveStateSettings(nextState);
      return nextState;
    });
  }, [saveStateSettings]);

  const removeFromQueue = useCallback((index: number) => {
    setPlaybackState((prev) => {
      if (index < 0 || index >= prev.queue.length) return prev;

      const newQueue = prev.queue.filter((_, i) => i !== index);
      let newIdx = prev.currentIndex;

      if (index === prev.currentIndex) {
        // Removed the currently playing track
        newIdx = index >= newQueue.length ? newQueue.length - 1 : index;
        const nextTrackId = newQueue.length > 0 ? newQueue[newIdx] : null;

        const nextState = {
          ...prev,
          queue: newQueue,
          currentIndex: newIdx,
          currentTrackId: nextTrackId,
        };

        if (nextTrackId) {
          const track = tracks.find((t) => t.id === nextTrackId);
          if (track) {
            audioEngine.playTrack(track);
          }
        } else {
          audioEngine.stop();
          nextState.isPlaying = false;
        }

        saveStateSettings(nextState);
        return nextState;
      } else {
        // Update current index if we removed something before it
        if (index < prev.currentIndex) {
          newIdx = prev.currentIndex - 1;
        }
        const nextState = {
          ...prev,
          queue: newQueue,
          currentIndex: newIdx,
        };
        saveStateSettings(nextState);
        return nextState;
      }
    });
  }, [tracks, saveStateSettings]);

  // Scanning engine integration
  const scanDirectory = async (files: FileList) => {
    setIsScanning(true);
    const scannedTracks: Track[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const track = await MetadataScanner.scanFile(file);
        if (track) {
          scannedTracks.push(track);
        }
      }

      if (scannedTracks.length > 0) {
        // Save to DB
        await dbHelper.saveTracks(scannedTracks);

        // Update state
        setTracks((prev) => {
          // Merge unique tracks
          const existingIds = new Set(prev.map((t) => t.id));
          const newUniqueTracks = scannedTracks.filter((t) => !existingIds.has(t.id));
          return [...prev, ...newUniqueTracks];
        });
      }
    } catch (e) {
      console.error('Scanning error', e);
    } finally {
      setIsScanning(false);
    }
  };

  const clearLibrary = async () => {
    audioEngine.stop();
    await dbHelper.clearAllTracks();
    setTracks([]);
    
    // Clear queue settings
    const clearedState = {
      ...playbackState,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      queue: [],
      currentIndex: -1,
      currentTrackId: null,
    };
    setPlaybackState(clearedState);
    await saveStateSettings(clearedState);
  };

  // Playlists management (CRUD - RF-P01)
  const createPlaylist = async (name: string) => {
    if (!name.trim()) return;
    const newPlaylist: Playlist = {
      id: `playlist-${Date.now()}`,
      name: name.trim(),
      trackIds: [],
      createdAt: Date.now(),
    };

    await dbHelper.savePlaylist(newPlaylist);
    setPlaylists((prev) => [...prev, newPlaylist]);
  };

  const deletePlaylist = async (playlistId: string) => {
    const pl = playlists.find((p) => p.id === playlistId);
    if (!pl || pl.isSystem) return; // Cannot delete system playlists (Favorites)

    await dbHelper.deletePlaylist(playlistId);
    setPlaylists((prev) => prev.filter((p) => p.id !== playlistId));
    if (selectedPlaylistId === playlistId) {
      setSelectedPlaylistId(null);
      setActiveScreen('playlists');
    }
  };

  const toggleFavorite = async (trackId: string) => {
    const favPlaylist = playlists.find((p) => p.isSystem && p.id === 'favorites');
    if (!favPlaylist) return;

    let nextTrackIds = [...favPlaylist.trackIds];
    if (nextTrackIds.includes(trackId)) {
      nextTrackIds = nextTrackIds.filter((id) => id !== trackId);
    } else {
      nextTrackIds.push(trackId);
    }

    const updatedPlaylist = {
      ...favPlaylist,
      trackIds: nextTrackIds,
    };

    await dbHelper.savePlaylist(updatedPlaylist);
    setPlaylists((prev) =>
      prev.map((p) => (p.id === 'favorites' ? updatedPlaylist : p))
    );
  };

  const addTrackToPlaylist = async (playlistId: string, trackId: string) => {
    const pl = playlists.find((p) => p.id === playlistId);
    if (!pl) return;

    if (pl.trackIds.includes(trackId)) return; // Already in playlist

    const updatedPlaylist = {
      ...pl,
      trackIds: [...pl.trackIds, trackId],
    };

    await dbHelper.savePlaylist(updatedPlaylist);
    setPlaylists((prev) =>
      prev.map((p) => (p.id === playlistId ? updatedPlaylist : p))
    );
  };

  const removeTrackFromPlaylist = async (playlistId: string, trackId: string) => {
    const pl = playlists.find((p) => p.id === playlistId);
    if (!pl) return;

    const updatedPlaylist = {
      ...pl,
      trackIds: pl.trackIds.filter((id) => id !== trackId),
    };

    await dbHelper.savePlaylist(updatedPlaylist);
    setPlaylists((prev) =>
      prev.map((p) => (p.id === playlistId ? updatedPlaylist : p))
    );
  };

  return (
    <AudioContext.Provider
      value={{
        tracks,
        playlists,
        playbackState,
        activeScreen,
        activeTab,
        searchQuery,
        isScanning,
        selectedPlaylistId,
        setActiveScreen,
        setActiveTab,
        setSearchQuery,
        setSelectedPlaylistId,
        scanDirectory,
        clearLibrary,
        playTrack,
        playAll,
        togglePlay,
        nextTrack,
        previousTrack,
        seek,
        setVolume,
        toggleShuffle,
        toggleRepeatMode,
        addToQueue,
        playNext,
        reorderQueue,
        removeFromQueue,
        createPlaylist,
        deletePlaylist,
        toggleFavorite,
        addTrackToPlaylist,
        removeTrackFromPlaylist,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};
