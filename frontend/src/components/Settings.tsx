import { useSettings } from '../context/SettingsContext';

type Props = { onBack: () => void };

export function Settings({ onBack }: Props) {
  const { soundEnabled, setSoundEnabled } = useSettings();

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 gap-6">
      <h1 className="text-2xl font-bold">Ayarlar</h1>
      <div className="w-64 space-y-4">
        <label className="flex items-center justify-between gap-4 cursor-pointer">
          <span>Ses</span>
          <input
            type="checkbox"
            checked={soundEnabled}
            onChange={(e) => setSoundEnabled(e.target.checked)}
            className="rounded w-5 h-5 accent-emerald-500"
          />
        </label>
      </div>
      <button
        type="button"
        onClick={onBack}
        className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500"
      >
        Ana menüye dön
      </button>
    </div>
  );
}
