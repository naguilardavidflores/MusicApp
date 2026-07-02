import type { Track } from '../domain/entities';

export class MetadataScanner {
  /**
   * Helper to get audio duration using HTML5 Audio element.
   */
  static getDuration(file: File): Promise<number> {
    return new Promise((resolve) => {
      const audio = document.createElement('audio');
      audio.preload = 'metadata';
      const objectUrl = URL.createObjectURL(file);
      audio.src = objectUrl;

      const cleanup = () => {
        URL.revokeObjectURL(objectUrl);
        audio.remove();
      };

      audio.onloadedmetadata = () => {
        const duration = audio.duration;
        cleanup();
        resolve(isNaN(duration) ? 0 : duration);
      };

      audio.onerror = () => {
        cleanup();
        resolve(0);
      };
    });
  }

  /**
   * Scans a File object and extracts metadata, returning a Track object.
   */
  static async scanFile(file: File): Promise<Track | null> {
    // 1. Check file type
    const mime = file.type;
    const name = file.name;
    const ext = name.split('.').pop()?.toLowerCase();
    
    // We support standard formats: mp3, wav, m4a, flac, aac
    const allowedExtensions = ['mp3', 'wav', 'm4a', 'flac', 'aac', 'mp4'];
    if (!allowedExtensions.includes(ext || '') && !mime.startsWith('audio/')) {
      return null;
    }

    // 2. Get duration first
    const duration = await this.getDuration(file);
    
    // RF-B01: Skip short audio (e.g. voice notes < 15 seconds)
    if (duration > 0 && duration < 15) {
      console.log(`Skipping file (duration < 15s): ${name} (${duration.toFixed(1)}s)`);
      return null;
    }

    // 3. Extract path and folder information
    // If the file was imported through webkitRelativePath, use it. Otherwise fall back to name.
    const relativePath = file.webkitRelativePath || file.name;
    const pathParts = relativePath.split('/');
    let parentFolder = 'Root';
    if (pathParts.length > 1) {
      parentFolder = pathParts[pathParts.length - 2];
    }

    // 4. Default metadata values from file name
    let title = name.replace(/\.[^/.]+$/, ""); // Strip extension
    let artist = 'Unknown Artist';
    let album = 'Unknown Album';
    let genre = 'Unknown Genre';
    let year = '';
    let coverUrl: string | undefined = undefined;

    // Check if we can parse ID3 tags
    try {
      const id3Data = await this.parseID3(file);
      if (id3Data) {
        if (id3Data.title) title = id3Data.title.trim();
        if (id3Data.artist) artist = id3Data.artist.trim();
        if (id3Data.album) album = id3Data.album.trim();
        if (id3Data.genre) genre = id3Data.genre.trim();
        if (id3Data.year) year = id3Data.year.trim();
        if (id3Data.coverUrl) coverUrl = id3Data.coverUrl;
      }
    } catch (e) {
      console.warn('Could not parse ID3 tags for ' + file.name, e);
    }

    // Create unique ID using filename and size
    const id = btoa(encodeURIComponent(`${file.name}-${file.size}-${duration}`));

    return {
      id,
      title,
      artist,
      album,
      genre,
      year,
      duration,
      filePath: relativePath,
      parentFolder,
      coverUrl,
      file // In-memory reference
    };
  }

  /**
   * Lightweight custom ID3v2 tag parser.
   */
  private static async parseID3(file: File): Promise<{
    title?: string;
    artist?: string;
    album?: string;
    genre?: string;
    year?: string;
    coverUrl?: string;
  } | null> {
    // Read the first 10 bytes to verify ID3 header
    const headerBuffer = await file.slice(0, 10).arrayBuffer();
    const headerView = new DataView(headerBuffer);

    // Check for "ID3" magic bytes (0x49, 0x44, 0x33)
    if (
      headerView.getUint8(0) !== 0x49 ||
      headerView.getUint8(1) !== 0x44 ||
      headerView.getUint8(2) !== 0x33
    ) {
      return null;
    }

    const majorVersion = headerView.getUint8(3);
    
    // Read synchsafe size (7 bits per byte)
    const b0 = headerView.getUint8(6);
    const b1 = headerView.getUint8(7);
    const b2 = headerView.getUint8(8);
    const b3 = headerView.getUint8(9);
    const tagSize = (b0 << 21) | (b1 << 14) | (b2 << 7) | b3;

    if (tagSize <= 0 || tagSize > file.size) {
      return null;
    }

    // Read the full ID3 tag
    const tagBuffer = await file.slice(10, 10 + tagSize).arrayBuffer();
    const tagView = new DataView(tagBuffer);
    let offset = 0;

    const result: {
      title?: string;
      artist?: string;
      album?: string;
      genre?: string;
      year?: string;
      coverUrl?: string;
    } = {};

    // Standard text decoder helpers
    const getTextString = (view: DataView, start: number, length: number): string => {
      if (length <= 0) return '';
      const encoding = view.getUint8(start);
      const dataOffset = start + 1;
      const dataLength = length - 1;

      if (dataLength <= 0) return '';

      const u8Array = new Uint8Array(view.buffer, view.byteOffset + dataOffset, dataLength);

      try {
        if (encoding === 0x00) {
          // ISO-8859-1 (Latin1)
          return new TextDecoder('windows-1252').decode(u8Array);
        } else if (encoding === 0x01) {
          // UTF-16 with BOM
          return new TextDecoder('utf-16').decode(u8Array);
        } else if (encoding === 0x02) {
          // UTF-16BE without BOM
          return new TextDecoder('utf-16be').decode(u8Array);
        } else if (encoding === 0x03) {
          // UTF-8
          return new TextDecoder('utf-8').decode(u8Array);
        }
      } catch (err) {
        console.error('Text decoding error', err);
      }
      return '';
    };

    while (offset < tagSize - 10) {
      // Frame ID (4 chars)
      const frameId = String.fromCharCode(
        tagView.getUint8(offset),
        tagView.getUint8(offset + 1),
        tagView.getUint8(offset + 2),
        tagView.getUint8(offset + 3)
      );

      // Check for padding (null characters)
      if (frameId.charCodeAt(0) === 0) {
        break;
      }

      // Read Frame Size
      let frameSize = 0;
      if (majorVersion === 4) {
        // ID3v2.4 uses synchsafe integers for frame sizes too
        const fs0 = tagView.getUint8(offset + 4);
        const fs1 = tagView.getUint8(offset + 5);
        const fs2 = tagView.getUint8(offset + 6);
        const fs3 = tagView.getUint8(offset + 7);
        frameSize = (fs0 << 21) | (fs1 << 14) | (fs2 << 7) | fs3;
      } else {
        // ID3v2.3 uses normal 32-bit uint
        frameSize = tagView.getUint32(offset + 4);
      }

      if (frameSize <= 0 || offset + 10 + frameSize > tagSize) {
        break;
      }

      const frameDataOffset = offset + 10;

      // Extract metadata tags
      if (frameId === 'TIT2') {
        result.title = getTextString(tagView, frameDataOffset, frameSize);
      } else if (frameId === 'TPE1') {
        result.artist = getTextString(tagView, frameDataOffset, frameSize);
      } else if (frameId === 'TALB') {
        result.album = getTextString(tagView, frameDataOffset, frameSize);
      } else if (frameId === 'TCON') {
        result.genre = getTextString(tagView, frameDataOffset, frameSize);
      } else if (frameId === 'TYER' || frameId === 'TDRC') {
        result.year = getTextString(tagView, frameDataOffset, frameSize);
      } else if (frameId === 'APIC') {
        // Attached Picture
        try {
          const encoding = tagView.getUint8(frameDataOffset);
          let mimeOffset = frameDataOffset + 1;
          
          // Find end of MIME type (null terminated)
          let mimeEnd = mimeOffset;
          while (tagView.getUint8(mimeEnd) !== 0 && mimeEnd < frameDataOffset + frameSize) {
            mimeEnd++;
          }
          
          const mimeArray = new Uint8Array(tagView.buffer, tagView.byteOffset + mimeOffset, mimeEnd - mimeOffset);
          const mimeType = new TextDecoder('ascii').decode(mimeArray);
          
          // Skip description (null terminated string)
          let descOffset = mimeEnd + 2;
          // Find end of description (depends on encoding)
          let descEnd = descOffset;
          if (encoding === 0x00 || encoding === 0x03) {
            while (tagView.getUint8(descEnd) !== 0 && descEnd < frameDataOffset + frameSize) {
              descEnd++;
            }
            descEnd += 1;
          } else {
            // UTF-16 description ends with 2 null bytes
            while (
              !(tagView.getUint8(descEnd) === 0 && tagView.getUint8(descEnd + 1) === 0) &&
              descEnd < frameDataOffset + frameSize - 1
            ) {
              descEnd++;
            }
            descEnd += 2;
          }

          const pictureDataOffset = descEnd;
          const pictureDataSize = frameSize - (pictureDataOffset - frameDataOffset);
          
          if (pictureDataSize > 0) {
            const pictureArray = new Uint8Array(
              tagView.buffer,
              tagView.byteOffset + pictureDataOffset,
              pictureDataSize
            );
            const blob = new Blob([pictureArray], { type: mimeType });
            result.coverUrl = URL.createObjectURL(blob);
          }
        } catch (picErr) {
          console.warn('Failed parsing APIC tag', picErr);
        }
      }

      // Move to next frame
      offset += 10 + frameSize;
    }

    return result;
  }
}
