import { useState, useEffect, useCallback } from 'react';
import { getDictionaryUrl } from '../lib/api';

const PAGE_SIZE = 2000;

type Props = { onBack: () => void };

export function Dictionary({ onBack }: Props) {
  const [words, setWords] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const loadPage = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(getDictionaryUrl(p, PAGE_SIZE));
      if (!res.ok) throw new Error('Yüklenemedi');
      const data = await res.json();
      setWords(data.words ?? []);
      setTotal(data.total ?? 0);
      setPage(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Bir hata oluştu');
      setWords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPage(1);
  }, [loadPage]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const searchLower = search.trim().toLowerCase();
  const filtered =
    searchLower.length > 0
      ? words.filter((w) => w.toLowerCase().includes(searchLower))
      : words;

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col p-4">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h1 className="text-2xl font-bold">Sözlük</h1>
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500 shrink-0"
        >
          Ana menüye dön
        </button>
      </div>
      <input
        type="text"
        placeholder="Kelime ara..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 px-3 py-2 rounded bg-gray-800 border border-gray-600 text-white w-full max-w-md"
      />
      {error && (
        <p className="text-red-400 text-sm mb-2">{error}</p>
      )}
      {loading ? (
        <p className="text-gray-400">Yükleniyor...</p>
      ) : (
        <>
          <p className="text-gray-400 text-sm mb-2">
            {search ? `${filtered.length} eşleşme` : `Toplam ${total} kelime`}
          </p>
          <ul className="flex-1 overflow-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1 text-sm list-none">
            {filtered.map((w) => (
              <li key={w} className="truncate py-0.5 text-gray-200">
                {w}
              </li>
            ))}
          </ul>
          {!search && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                type="button"
                onClick={() => loadPage(page - 1)}
                disabled={page <= 1}
                className="px-3 py-1 rounded bg-gray-600 hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Önceki
              </button>
              <span className="text-gray-400 text-sm">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => loadPage(page + 1)}
                disabled={page >= totalPages}
                className="px-3 py-1 rounded bg-gray-600 hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sonraki
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
