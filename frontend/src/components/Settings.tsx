import { useSettings } from '../context/SettingsContext';

type Props = { onBack: () => void };

export function Settings({ onBack }: Props) {
  const { soundEnabled, setSoundEnabled } = useSettings();

  return (
    <div className="bp-lobby">
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 28, fontWeight: 900, color: 'white' }}>Settings</h1>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)' }}>Configure your experience</p>
      </div>

      <div className="bp-card" style={{ maxWidth: 360 }}>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          cursor: 'pointer',
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Sound Effects</div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
              Tick sounds and word feedback
            </div>
          </div>
          <div
            className="bp-toggle"
            style={{ background: soundEnabled ? 'var(--green)' : 'var(--surface-3)', border: '1px solid var(--border-2)' }}
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            <div
              className="bp-toggle-thumb"
              style={{ left: soundEnabled ? 23 : 3 }}
            />
          </div>
        </label>
      </div>

      <button type="button" className="bp-btn-secondary" onClick={onBack}>
        ← Back
      </button>
    </div>
  );
}
