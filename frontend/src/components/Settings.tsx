import { useSettings } from '../context/SettingsContext';
import { useI18n } from '../context/I18nContext';

type Props = { onBack: () => void };

export function Settings({ onBack }: Props) {
  const { soundEnabled, setSoundEnabled } = useSettings();
  const { t, lang, setLang } = useI18n();

  return (
    <div className="bp-lobby">
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 28, fontWeight: 900, color: 'white' }}>{t.settingsTitle}</h1>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)' }}>{t.configureExp}</p>
      </div>

      <div className="bp-card" style={{ maxWidth: 360 }}>
        {/* Sound toggle */}
        <label style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          cursor: 'pointer',
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{t.soundEffects}</div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
              {t.soundDesc}
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

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--border)', margin: '12px 0' }} />

        {/* Language toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{t.language}</div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
              {t.langDesc}
            </div>
          </div>
          <div className="bp-tabs">
            <button
              type="button"
              className={`bp-tab ${lang === 'tr' ? 'on' : 'off'}`}
              onClick={() => setLang('tr')}
            >TR</button>
            <button
              type="button"
              className={`bp-tab ${lang === 'en' ? 'on' : 'off'}`}
              onClick={() => setLang('en')}
            >EN</button>
          </div>
        </div>
      </div>

      <button type="button" className="bp-btn-secondary" onClick={onBack}>
        {t.back}
      </button>
    </div>
  );
}
