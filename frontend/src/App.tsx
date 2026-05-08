import { useState, useEffect } from 'react';
import { useSocket } from './context/SocketContext';
import { SettingsProvider } from './context/SettingsContext';
import { I18nProvider } from './context/I18nContext';
import { Landing } from './components/Landing';
import { Lobby } from './components/Lobby';
import { Game } from './components/Game';
import { Dictionary } from './components/Dictionary';
import { Settings } from './components/Settings';

type View = 'landing' | 'main' | 'dictionary' | 'settings';

function AppContent() {
  const { gameState, gameEnd } = useSocket();

  const [initialRoomCode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('room')?.toUpperCase() ?? '';
  });

  const [view, setView] = useState<View>(initialRoomCode ? 'main' : 'landing');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('unlocked') === 'premium') {
      localStorage.setItem('bombparty-premium', 'true');
      const url = new URL(window.location.href);
      url.searchParams.delete('unlocked');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  useEffect(() => {
    if (initialRoomCode) {
      const url = new URL(window.location.href);
      url.searchParams.delete('room');
      window.history.replaceState({}, '', url.toString());
    }
  }, [initialRoomCode]);

  const inGame = gameState?.status === 'playing';
  const showGame = inGame || !!gameEnd;

  if (view === 'landing') {
    return (
      <Landing
        onPlay={() => setView('main')}
        onDictionary={() => setView('dictionary')}
      />
    );
  }
  if (view === 'dictionary') {
    return <Dictionary onBack={() => setView('main')} />;
  }
  if (view === 'settings') {
    return <Settings onBack={() => setView('main')} />;
  }
  return showGame ? (
    <Game />
  ) : (
    <Lobby
      onOpenDictionary={() => setView('dictionary')}
      onOpenSettings={() => setView('settings')}
      initialRoomCode={initialRoomCode}
    />
  );
}

function App() {
  return (
    <I18nProvider>
      <SettingsProvider>
        <AppContent />
      </SettingsProvider>
    </I18nProvider>
  );
}

export default App;
