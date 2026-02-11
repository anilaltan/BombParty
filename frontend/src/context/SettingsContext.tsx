import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';

const STORAGE_KEY = 'bombparty-settings';

type Settings = {
  soundEnabled: boolean;
};

const defaultSettings: Settings = {
  soundEnabled: true,
};

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Settings>;
      return { ...defaultSettings, ...parsed };
    }
  } catch {
    // ignore
  }
  return defaultSettings;
}

interface SettingsContextValue {
  soundEnabled: boolean;
  setSoundEnabled: (v: boolean) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(loadSettings);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const setSoundEnabled = useCallback((v: boolean) => {
    setSettings((s) => ({ ...s, soundEnabled: v }));
  }, []);

  return (
    <SettingsContext.Provider
      value={{ soundEnabled: settings.soundEnabled, setSoundEnabled }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
