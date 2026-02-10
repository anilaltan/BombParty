import { useSocket } from './context/SocketContext';
import { Lobby } from './components/Lobby';
import { Game } from './components/Game';

function App() {
  const { gameState } = useSocket();
  const inGame = gameState?.status === 'playing';

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {inGame ? <Game /> : <Lobby />}
    </div>
  );
}

export default App;
