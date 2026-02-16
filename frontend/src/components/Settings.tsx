import { useSettings } from '../context/SettingsContext';

type Props = { onBack: () => void };

export function Settings({ onBack }: Props) {
  const { soundEnabled, setSoundEnabled } = useSettings();

  return (
    <div className="jklm-lobby">
      <h1 style={{ fontSize: 24, fontWeight: 800, color: 'white' }}>Settings</h1>
      <div className="jklm-lobby-card" style={{ maxWidth: 360 }}>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          cursor: 'pointer',
          fontSize: 14,
          color: 'var(--jklm-text)',
        }}>
          <span>Sound Effects</span>
          <div
            onClick={() => setSoundEnabled(!soundEnabled)}
            style={{
              width: 44,
              height: 24,
              borderRadius: 12,
              background: soundEnabled ? 'var(--jklm-green)' : 'rgba(255,255,255,0.12)',
              position: 'relative',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            <div style={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: 'white',
              position: 'absolute',
              top: 3,
              left: soundEnabled ? 23 : 3,
              transition: 'left 0.2s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            }} />
          </div>
        </label>
      </div>
      <button
        type="button"
        className="jklm-lobby-btn-secondary"
        onClick={onBack}
      >
        Back to Menu
      </button>
    </div>
  );
}
