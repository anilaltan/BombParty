import { useState } from 'react';
import { useSocket } from './context/SocketContext';
import { SettingsProvider } from './context/SettingsContext';
import { I18nProvider } from './context/I18nContext';
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
  return showGame ? (
    <Game />
  ) : (
    <Lobby
      onOpenDictionary={() => setView('dictionary')}
      onOpenSettings={() => setView('settings')}
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
