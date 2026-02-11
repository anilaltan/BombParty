import { useState } from 'react';
import { useSocket } from './context/SocketContext';
import { SettingsProvider } from './context/SettingsContext';
import { Lobby } from './components/Lobby';
import { Game } from './components/Game';
import { Dictionary } from './components/Dictionary';
import { Settings } from './components/Settings';

type View = 'main' | 'dictionary' | 'settings';

function AppContent() {
  const { gameState, gameEnd } = useSocket();
  const [view, setView] = useState<View>('main');
  const inGame = gameState?.status === 'playing';
  const showGame = inGame || !!gameEnd;

  if (view === 'dictionary') {
    return <Dictionary onBack={() => setView('main')} />;
  }
  if (view === 'settings') {
    return <Settings onBack={() => setView('main')} />;
  }
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {showGame ? (
        <Game />
      ) : (
        <Lobby
          onOpenDictionary={() => setView('dictionary')}
          onOpenSettings={() => setView('settings')}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <SettingsProvider>
      <div className="min-h-screen bg-gray-900 text-white">
        <AppContent />
      </div>
    </SettingsProvider>
  );
}

export default App;
