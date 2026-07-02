import React from 'react';
import { AudioProvider, useAudio } from './presentation/context/AudioContext';
import { MobileShell } from './presentation/components/MobileShell';
import { LibraryScreen } from './presentation/components/LibraryScreen';
import { PlaylistScreen } from './presentation/components/PlaylistScreen';
import { QueueScreen } from './presentation/components/QueueScreen';

const MainScreenContent: React.FC = () => {
  const { activeScreen } = useAudio();

  switch (activeScreen) {
    case 'library':
      return <LibraryScreen />;
    case 'playlists':
      return <PlaylistScreen />;
    case 'queue':
      return <QueueScreen />;
    default:
      return <LibraryScreen />;
  }
};

const App: React.FC = () => {
  return (
    <AudioProvider>
      <MobileShell>
        <MainScreenContent />
      </MobileShell>
    </AudioProvider>
  );
};

export default App;
