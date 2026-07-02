import type { Track } from '../domain/entities';

export class AudioEngine {
  private audio: HTMLAudioElement;
  private currentTrack: Track | null = null;
  private currentUrl: string | null = null;

  // Callbacks
  public onTimeUpdate: (time: number) => void = () => {};
  public onDurationChange: (duration: number) => void = () => {};
  public onEnded: () => void = () => {};
  public onPlayStateChange: (isPlaying: boolean) => void = () => {};
  public onError: (err: any) => void = () => {};

  constructor() {
    this.audio = new Audio();
    this.setupListeners();
    this.setupMediaSessionHandlers();
    this.setupAudioDeviceListeners();
  }

  private setupListeners() {
    this.audio.addEventListener('timeupdate', () => {
      this.onTimeUpdate(this.audio.currentTime);
    });

    this.audio.addEventListener('durationchange', () => {
      if (!isNaN(this.audio.duration)) {
        this.onDurationChange(this.audio.duration);
      }
    });

    this.audio.addEventListener('ended', () => {
      this.onEnded();
    });

    this.audio.addEventListener('play', () => {
      this.onPlayStateChange(true);
      this.syncMediaSessionPlaybackState('playing');
    });

    this.audio.addEventListener('pause', () => {
      this.onPlayStateChange(false);
      this.syncMediaSessionPlaybackState('paused');
    });

    this.audio.addEventListener('error', (e) => {
      console.error('Audio playback error', e);
      this.onError(e);
    });
  }

  private setupAudioDeviceListeners() {
    // RF-S03: Pause if headphones disconnect (Bluetooth or Jack)
    // The browser triggers 'devicechange' when audio outputs change
    if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
      navigator.mediaDevices.addEventListener('devicechange', () => {
        // Pausing is standard practice when headphones are unplugged
        console.log('Audio output device change detected, pausing playback...');
        this.pause();
      });
    }
  }

  private setupMediaSessionHandlers() {
    if ('mediaSession' in navigator) {
      const ms = navigator.mediaSession;
      
      // RF-S04: Physical buttons / notification controls interaction
      ms.setActionHandler('play', () => {
        this.resume();
      });
      ms.setActionHandler('pause', () => {
        this.pause();
      });
      ms.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined) {
          this.seek(details.seekTime);
        }
      });
      // Skip handlers will be configured dynamically in the Context/ViewModel,
      // as they depend on queue state (next/previous tracks).
    }
  }

  public setSkipHandlers(onNext: (() => void) | null, onPrevious: (() => void) | null) {
    if ('mediaSession' in navigator) {
      const ms = navigator.mediaSession;
      if (onNext) {
        ms.setActionHandler('previoustrack', onPrevious);
      } else {
        try { ms.setActionHandler('previoustrack', null); } catch (e) {}
      }
      if (onPrevious) {
        ms.setActionHandler('nexttrack', onNext);
      } else {
        try { ms.setActionHandler('nexttrack', null); } catch (e) {}
      }
    }
  }

  private syncMediaSessionPlaybackState(state: 'playing' | 'paused') {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = state;
    }
  }

  public async playTrack(track: Track, startPosition = 0): Promise<void> {
    try {
      // 1. Clean up old url if exists
      if (this.currentUrl) {
        URL.revokeObjectURL(this.currentUrl);
        this.currentUrl = null;
      }

      this.currentTrack = track;

      // 2. Set source
      if (track.file) {
        // Play local file
        this.currentUrl = URL.createObjectURL(track.file);
        this.audio.src = this.currentUrl;
      } else {
        throw new Error('Track file reference is missing');
      }

      this.audio.load();
      
      // Restore previous seek position if requested
      if (startPosition > 0) {
        this.audio.currentTime = startPosition;
      }

      await this.audio.play();

      // Update Media Session OS integration
      this.updateMediaSessionMetadata(track);
    } catch (err) {
      this.onError(err);
      throw err;
    }
  }

  public pause(): void {
    this.audio.pause();
  }

  public async resume(): Promise<void> {
    if (this.audio.src) {
      await this.audio.play();
    } else if (this.currentTrack) {
      await this.playTrack(this.currentTrack);
    }
  }

  public stop(): void {
    this.audio.pause();
    this.audio.currentTime = 0;
    if (this.currentUrl) {
      URL.revokeObjectURL(this.currentUrl);
      this.currentUrl = null;
    }
    this.audio.src = '';
    this.currentTrack = null;
  }

  public seek(seconds: number): void {
    if (this.audio.src) {
      this.audio.currentTime = seconds;
    }
  }

  public setVolume(volume: number): void {
    // volume is 0.0 to 1.0
    this.audio.volume = Math.max(0, Math.min(1, volume));
  }

  public getVolume(): number {
    return this.audio.volume;
  }

  public getCurrentTime(): number {
    return this.audio.currentTime;
  }

  public getDuration(): number {
    return this.audio.duration || 0;
  }

  // RF-S03: GPS/Notification Audio Ducking
  // Duck (decrease volume) if ducking is enabled, otherwise restore
  public duckVolume(duck: boolean) {
    const currentVol = this.audio.volume;
    if (duck) {
      this.audio.volume = Math.max(0.1, currentVol * 0.3); // Duck to 30%
    } else {
      // Re-trigger volume update from state (normally handled by UI/Context setter)
    }
  }

  private updateMediaSessionMetadata(track: Track) {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist,
        album: track.album,
        artwork: track.coverUrl
          ? [{ src: track.coverUrl, sizes: '512x512', type: 'image/png' }]
          : [{ src: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=256&auto=format&fit=crop', sizes: '256x256', type: 'image/jpeg' }]
      });
    }
  }
}

export const audioEngine = new AudioEngine();
