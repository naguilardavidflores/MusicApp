// Mock queue management state machine to run tests in Node.js
// This tests the core logical behavior of the reproducer queue.

class TestQueueManager {
  constructor() {
    this.tracks = [];
    this.queue = []; // Array of track IDs
    this.currentIndex = -1;
    this.currentTrackId = null;
    this.shuffle = false;
    this.repeatMode = 'none'; // 'none' | 'one' | 'all'
    this.originalQueue = []; // to restore order when shuffle is turned off
  }

  setTracks(tracks) {
    this.tracks = tracks;
  }

  playAll(tracksToPlay, startIndex = 0) {
    let trackIds = tracksToPlay.map(t => t.id);
    this.originalQueue = [...trackIds];
    
    if (this.shuffle) {
      const firstTrackId = trackIds[startIndex];
      const remainingTracks = trackIds.filter((_, i) => i !== startIndex);
      // Fisher-Yates shuffle
      for (let i = remainingTracks.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [remainingTracks[i], remainingTracks[j]] = [remainingTracks[j], remainingTracks[i]];
      }
      this.queue = [firstTrackId, ...remainingTracks];
      this.currentIndex = 0;
    } else {
      this.queue = [...trackIds];
      this.currentIndex = startIndex;
    }
    this.currentTrackId = this.queue[this.currentIndex] || null;
  }

  nextTrack() {
    if (this.queue.length === 0) return;

    if (this.repeatMode === 'one') {
      // Repeat same track
      return;
    }

    let nextIndex = this.currentIndex + 1;
    if (nextIndex >= this.queue.length) {
      if (this.repeatMode === 'all') {
        nextIndex = 0;
      } else {
        // Stop playback
        this.currentIndex = -1;
        this.currentTrackId = null;
        return;
      }
    }
    this.currentIndex = nextIndex;
    this.currentTrackId = this.queue[nextIndex];
  }

  previousTrack() {
    if (this.queue.length === 0) return;

    if (this.repeatMode === 'one') {
      return;
    }

    let prevIndex = this.currentIndex - 1;
    if (prevIndex < 0) {
      if (this.repeatMode === 'all') {
        prevIndex = this.queue.length - 1;
      } else {
        prevIndex = 0; // Stay on first track
      }
    }
    this.currentIndex = prevIndex;
    this.currentTrackId = this.queue[prevIndex];
  }

  toggleShuffle() {
    this.shuffle = !this.shuffle;
    if (this.shuffle) {
      // Shuffle other items
      if (this.queue.length > 0 && this.currentTrackId) {
        const currentId = this.currentTrackId;
        const otherIds = this.queue.filter(id => id !== currentId);
        for (let i = otherIds.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [otherIds[i], otherIds[j]] = [otherIds[j], otherIds[i]];
        }
        this.queue = [currentId, ...otherIds];
        this.currentIndex = 0;
      }
    } else {
      // Unshuffle: restore original order relative to track list
      if (this.currentTrackId) {
        const trackIdsOrder = this.tracks.map(t => t.id);
        this.queue = [...this.queue].sort((a, b) => {
          return trackIdsOrder.indexOf(a) - trackIdsOrder.indexOf(b);
        });
        this.currentIndex = this.queue.indexOf(this.currentTrackId);
      }
    }
  }

  addToQueue(trackId) {
    if (this.queue.includes(trackId)) return;
    this.queue.push(trackId);
    if (this.currentIndex === -1) {
      this.currentIndex = 0;
      this.currentTrackId = trackId;
    }
  }

  playNext(trackId) {
    const filteredQueue = this.queue.filter(id => id !== trackId);
    const insertIdx = this.currentIndex + 1;
    this.queue = [
      ...filteredQueue.slice(0, insertIdx),
      trackId,
      ...filteredQueue.slice(insertIdx)
    ];
    this.currentIndex = this.queue.indexOf(this.currentTrackId || trackId);
  }

  removeFromQueue(index) {
    if (index < 0 || index >= this.queue.length) return;
    const removedId = this.queue[index];
    this.queue = this.queue.filter((_, i) => i !== index);

    if (index === this.currentIndex) {
      this.currentIndex = index >= this.queue.length ? this.queue.length - 1 : index;
      this.currentTrackId = this.queue.length > 0 ? this.queue[this.currentIndex] : null;
    } else {
      if (index < this.currentIndex) {
        this.currentIndex--;
      }
    }
  }
}

// --- UNIT TESTS ---

const mockTracks = [
  { id: 't1', title: 'Song 1', artist: 'Artist A' },
  { id: 't2', title: 'Song 2', artist: 'Artist B' },
  { id: 't3', title: 'Song 3', artist: 'Artist C' },
  { id: 't4', title: 'Song 4', artist: 'Artist D' },
];

let failed = false;

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    failed = true;
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

console.log('--- INICIANDO PRUEBAS DE COLA Y REPRODUCTOR ---');

// Test 1: Play all in order
const qm = new TestQueueManager();
qm.setTracks(mockTracks);
qm.playAll(mockTracks, 0);

assert(qm.queue.length === 4, 'La cola contiene 4 canciones');
assert(qm.currentTrackId === 't1', 'La canción actual en reproducción es t1');
assert(qm.currentIndex === 0, 'El índice actual es 0');

// Test 2: Skip to next
qm.nextTrack();
assert(qm.currentTrackId === 't2', 'Siguiente canción es t2');
assert(qm.currentIndex === 1, 'Índice de canción es 1');

// Test 3: Skip to previous
qm.previousTrack();
assert(qm.currentTrackId === 't1', 'Volver a la canción anterior es t1');
assert(qm.currentIndex === 0, 'El índice vuelve a ser 0');

// Test 4: Play Next
qm.playNext('t4');
assert(qm.queue[1] === 't4', 't4 se insertó como la siguiente canción en la cola (Play Next)');
assert(qm.currentTrackId === 't1', 'La canción actual sigue siendo t1');

// Test 5: Shuffle behavior
qm.shuffle = false;
qm.playAll(mockTracks, 1); // Start at t2 (index 1)
assert(qm.currentTrackId === 't2', 'Comienza en t2');

qm.toggleShuffle();
assert(qm.shuffle === true, 'Shuffle activado');
assert(qm.currentTrackId === 't2', 'Al activar shuffle, la canción actual sigue siendo t2');
assert(qm.currentIndex === 0, 'La canción actual se mueve a la posición 0 de la cola barajada');

// Test 6: Unshuffle (Restore Order)
qm.toggleShuffle();
assert(qm.shuffle === false, 'Shuffle desactivado');
assert(qm.currentTrackId === 't2', 'Al desactivar shuffle, la canción actual sigue siendo t2');
assert(qm.queue[1] === 't2', 't2 vuelve a estar en el índice 1 correspondiente a la lista original');

// Test 7: Repeat mode 'one'
qm.repeatMode = 'one';
qm.nextTrack();
assert(qm.currentTrackId === 't2', 'Con Repeat One, nextTrack no cambia de canción');

// Test 8: Repeat mode 'all'
qm.repeatMode = 'all';
qm.currentIndex = 3; // at the end
qm.currentTrackId = qm.queue[3];
qm.nextTrack();
assert(qm.currentTrackId === 't1', 'Con Repeat All, al llegar al final de la cola vuelve a t1');
assert(qm.currentIndex === 0, 'El índice vuelve a ser 0');

// Test 9: Repeat mode 'none'
qm.repeatMode = 'none';
qm.currentIndex = 3; // at the end
qm.currentTrackId = qm.queue[3];
qm.nextTrack();
assert(qm.currentTrackId === null, 'Con Repeat None, al terminar la cola de reproducción se detiene (null)');

// Test 10: Remove from queue
qm.playAll(mockTracks, 1); // Play t2
qm.removeFromQueue(2); // Remove t3
assert(!qm.queue.includes('t3'), 't3 fue eliminada de la cola');
assert(qm.currentTrackId === 't2', 'La canción actual sigue siendo t2');

console.log('------------------------------------------------');
if (failed) {
  console.log('🔴 ALGUNAS PRUEBAS FALLARON');
  process.exit(1);
} else {
  console.log('🟢 TODAS LAS PRUEBAS UNITARIAS LOGRARON PASAR EXITOSAMENTE');
  process.exit(0);
}
