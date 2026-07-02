export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
  year?: string;
  duration: number; // in seconds
  filePath: string; // display path
  coverUrl?: string; // Data URL or object URL of artwork
  parentFolder: string; // for folder view classification
  file?: File; // Keep reference to File object in-memory for playback
}

export interface Playlist {
  id: string;
  name: string;
  trackIds: string[];
  createdAt: number;
  isSystem?: boolean; // to identify "Favorites"
}

export type RepeatMode = 'none' | 'one' | 'all';

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  shuffle: boolean;
  repeatMode: RepeatMode;
  queue: string[];
  currentIndex: number;
  currentTrackId: string | null;
}
