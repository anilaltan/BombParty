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
      if (!res.ok) throw new Error('Failed to load');
      const contentType = res.headers.get('content-type') ?? '';
      if (!contentType.includes('application/json')) {
        throw new Error('API returned non-JSON. Check backend/proxy config.');
      }
      const data = await res.json();
      setWords(data.words ?? []);
      setTotal(data.total ?? 0);
      setPage(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An error occurred');
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
  const filtered = searchLower.length > 0
    ? words.filter((w) => w.toLowerCase().includes(searchLower))
    : words;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--jklm-bg)',
      color: 'var(--jklm-text)',
      display: 'flex',
      flexDirection: 'column',
      padding: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'white', margin: 0 }}>Dictionary</h1>
        <button type="button" className="jklm-lobby-btn-secondary" onClick={onBack}>
          Back to Menu
        </button>
      </div>

      <input
        type="text"
        placeholder="Search words..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          marginBottom: 16,
          background: 'var(--jklm-bg-darker)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 6,
          padding: '10px 14px',
          fontSize: 14,
          color: 'white',
          outline: 'none',
          maxWidth: 400,
          width: '100%',
        }}
      />

      {error && (
        <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 8 }}>{error}</p>
      )}

      {loading ? (
        <p style={{ color: 'var(--jklm-text-muted)' }}>Loading...</p>
      ) : (
        <>
          <p style={{ color: 'var(--jklm-text-muted)', fontSize: 12, marginBottom: 8 }}>
            {search ? `${filtered.length} matches` : `Total: ${total} words`}
          </p>
          <div style={{
            flex: 1,
            overflow: 'auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: 2,
            fontSize: 13,
          }}>
            {filtered.map((w) => (
              <div key={w} style={{
                padding: '3px 6px',
                color: 'var(--jklm-text)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {w}
              </div>
            ))}
          </div>
          {!search && totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16 }}>
              <button
                type="button"
                className="jklm-lobby-btn-secondary"
                onClick={() => loadPage(page - 1)}
                disabled={page <= 1}
                style={{ opacity: page <= 1 ? 0.5 : 1 }}
              >
                Previous
              </button>
              <span style={{ color: 'var(--jklm-text-muted)', fontSize: 13 }}>
                {page} / {totalPages}
              </span>
              <button
                type="button"
                className="jklm-lobby-btn-secondary"
                onClick={() => loadPage(page + 1)}
                disabled={page >= totalPages}
                style={{ opacity: page >= totalPages ? 0.5 : 1 }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
